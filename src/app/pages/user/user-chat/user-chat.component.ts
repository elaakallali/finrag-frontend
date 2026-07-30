import { Component, OnDestroy, OnInit, effect, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { ConversationService } from '../../../core/services/conversation.service';
import { ConversationStore } from '../../../core/services/conversation-store';
import { IngestionSocketService } from '../../../core/services/ingestion-socket.service';
import { ChatMessage } from '../../../models/chat.model';

@Component({
  selector: 'app-user-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    FileUploadModule,
    TagModule,
    ProgressSpinnerModule
  ],
  templateUrl: './user-chat.component.html',
  styleUrl: './user-chat.component.css'
})
export class UserChatComponent implements OnInit, OnDestroy {
  private readonly conversationService = inject(ConversationService);
  private readonly conversationStore = inject(ConversationStore);
  private readonly ingestionSocket = inject(IngestionSocketService);
  private readonly fileUpload = viewChild(FileUpload);

  messages: ChatMessage[] = [];
  question = '';
  isAsking = false;
  isUploading = false;

  private pendingQuestion: string | null = null;
  private progressSub: Subscription | null = null;
  private askSub: Subscription | null = null;
  private lastLoadedId: string | null = null;

  constructor() {
    // Quand on change de discussion dans la sidebar bleue → recharge les messages
    effect(() => {
      const id = this.conversationStore.currentId();
      if (id && id !== this.lastLoadedId) {
        this.selectConversation(id);
      }
    });
  }

  get currentConversationId(): string | null {
    return this.conversationStore.currentId();
  }

  ngOnInit(): void {
    this.conversationStore.load();
  }

  ngOnDestroy(): void {
    this.stopWatching();
    this.stopAsking();
  }

  selectConversation(id: string): void {
    if (this.lastLoadedId === id && this.messages.length > 0) {
      return;
    }

    this.stopWatching();
    this.stopAsking();
    this.isUploading = false;
    this.isAsking = false;
    this.pendingQuestion = null;
    this.lastLoadedId = id;
    this.messages = [];

    this.conversationService.getMessages(id).subscribe({
      next: (msgs) => {
        this.messages = msgs.map((m) => ({
          role: m.role,
          text: m.content,
          time: this.formatDate(m.createdAt)
        }));
      },
      error: () => {
        this.messages.push({
          role: 'assistant',
          text: 'Erreur : impossible de charger l\'historique.',
          time: this.time()
        });
      }
    });
  }

  send(): void {
    const text = this.question.trim();
    if (!text || this.isAsking || !this.currentConversationId) {
      return;
    }

    this.messages.push({ role: 'user', text, time: this.time() });
    this.question = '';

    if (this.isUploading) {
      this.pendingQuestion = text;
      return;
    }

    this.askQuestion(text);
  }

  onUpload(event: { files: File[] }): void {
    const file = event.files[0];
    if (!file || !this.currentConversationId) {
      return;
    }

    this.isUploading = true;
    this.conversationService.upload(this.currentConversationId, file).subscribe({
      next: (res) => {
        if (!res.id) {
          this.isUploading = false;
          this.fileUpload()?.clear();
          this.messages.push({
            role: 'assistant',
            text: 'Erreur : ingestion du fichier echouee.',
            time: this.time()
          });
          return;
        }
        this.watchProgress(res.id);
      },
      error: () => {
        this.isUploading = false;
        this.fileUpload()?.clear();
        this.pendingQuestion = null;
        this.messages.push({
          role: 'assistant',
          text: 'Erreur : ingestion du fichier echouee.',
          time: this.time()
        });
      }
    });
  }

  formatScore(score: number | null): string {
    return score == null ? '—' : score.toFixed(2);
  }

  private watchProgress(id: string): void {
    this.stopWatching();
    this.progressSub = this.ingestionSocket.watch(id).subscribe({
      next: (progress) => {
        if (progress.status === 'INDEXED') {
          this.stopWatching();
          this.isUploading = false;
          this.fileUpload()?.clear();

          if (this.pendingQuestion) {
            const text = this.pendingQuestion;
            this.pendingQuestion = null;
            this.askQuestion(text);
          }
        }

        if (progress.status === 'FAILED') {
          this.stopWatching();
          this.isUploading = false;
          this.fileUpload()?.clear();
          this.pendingQuestion = null;
          this.messages.push({
            role: 'assistant',
            text: progress.errorMessage ?? 'Erreur : ingestion du fichier echouee.',
            time: this.time()
          });
        }
      },
      error: () => {
        this.stopWatching();
        this.isUploading = false;
        this.fileUpload()?.clear();
        this.pendingQuestion = null;
        this.messages.push({
          role: 'assistant',
          text: 'Erreur : impossible de suivre l\'ingestion (WebSocket).',
          time: this.time()
        });
      }
    });
  }

  private stopWatching(): void {
    this.progressSub?.unsubscribe();
    this.progressSub = null;
  }

  private stopAsking(): void {
    this.askSub?.unsubscribe();
    this.askSub = null;
  }

  private askQuestion(text: string): void {
    if (!this.currentConversationId) {
      return;
    }

    this.stopAsking();
    this.isAsking = true;

    const assistantIndex = this.messages.length;
    this.messages.push({
      role: 'assistant',
      text: '',
      time: this.time(),
      sources: []
    });

    this.askSub = this.conversationService.askStream(this.currentConversationId, text).subscribe({
      next: (event) => {
        const current = this.messages[assistantIndex];
        if (!current) {
          return;
        }

        if (event.type === 'token' && event.text) {
          current.text += event.text;
          this.messages = [...this.messages];
        }

        if (event.type === 'sources' && event.sources) {
          current.sources = event.sources;
          this.messages = [...this.messages];
        }

        if (event.type === 'error') {
          current.text = event.text ?? 'Erreur pendant la generation.';
          this.messages = [...this.messages];
          this.isAsking = false;
        }

        if (event.type === 'done') {
          this.isAsking = false;
          this.conversationStore.refresh();
        }
      },
      error: () => {
        const current = this.messages[assistantIndex];
        if (current && !current.text) {
          current.text = 'Erreur : impossible de contacter le service RAG (SSE).';
          this.messages = [...this.messages];
        }
        this.isAsking = false;
      },
      complete: () => {
        this.isAsking = false;
      }
    });
  }

  private time(): string {
    return new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatDate(iso: string): string {
    return new Date(iso).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

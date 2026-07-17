import { Component, OnDestroy, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { ReportService } from '../../../core/services/report.service';
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
export class UserChatComponent implements OnDestroy {
  private readonly reportService = inject(ReportService);
  private readonly fileUpload = viewChild(FileUpload);

  messages: ChatMessage[] = [];
  question = '';
  isAsking = false;
  isUploading = false;

  /** Question en attente si un upload est encore en cours */
  private pendingQuestion: string | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.stopPolling();
  }

  send(): void {
    const text = this.question.trim();
    if (!text || this.isAsking) {
      return;
    }

    this.messages.push({ role: 'user', text, time: this.time() });
    this.question = '';

    // Si un fichier est encore en ingestion, on attend la fin avant de chercher
    if (this.isUploading) {
      this.pendingQuestion = text;
      return;
    }

    this.askQuestion(text);
  }

  onUpload(event: { files: File[] }): void {
    const file = event.files[0];
    if (!file) {
      return;
    }

    this.isUploading = true;
    this.reportService.uploadReport(file).subscribe({
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
        // Attend la fin reelle via polling
        this.startPolling(res.id);
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

  private startPolling(id: string): void {
    this.stopPolling();

    this.pollTimer = setInterval(() => {
      this.reportService.getIngestionStatus(id).subscribe({
        next: (progress) => {
          if (progress.status === 'INDEXED') {
            this.stopPolling();
            this.isUploading = false;
            this.fileUpload()?.clear();

            if (this.pendingQuestion) {
              const text = this.pendingQuestion;
              this.pendingQuestion = null;
              this.askQuestion(text);
            }
          }

          if (progress.status === 'FAILED') {
            this.stopPolling();
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
          this.stopPolling();
          this.isUploading = false;
          this.fileUpload()?.clear();
          this.pendingQuestion = null;
        }
      });
    }, 2000);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /** Appel RAG : recherche dans les vector stores puis reponse */
  private askQuestion(text: string): void {
    this.isAsking = true;

    this.reportService.ask(text).subscribe({
      next: (res) => {
        this.messages.push({
          role: 'assistant',
          text: res.answer,
          time: this.time(),
          sources: res.sources
        });
        this.isAsking = false;
      },
      error: () => {
        this.messages.push({
          role: 'assistant',
          text: 'Erreur : impossible de contacter le service RAG.',
          time: this.time()
        });
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
}

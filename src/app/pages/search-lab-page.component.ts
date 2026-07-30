import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, finalize } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TextareaModule } from 'primeng/textarea';

import {
  ApiService,
  ChatConversation,
  ChatMessage,
  ReportAnswerResponse
} from '../core/api.service';

type PendingBubble = {
  role: 'user' | 'assistant';
  content: string;
  sources?: ReportAnswerResponse['sources'];
  pending?: boolean;
};

@Component({
  selector: 'app-search-lab-page',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    MessageModule,
    ProgressSpinnerModule,
    TextareaModule
  ],
  templateUrl: './search-lab-page.component.html',
  styleUrl: './search-lab-page.component.scss'
})
export class SearchLabPageComponent implements OnInit, OnDestroy {
  private static readonly DEFAULT_TOP_K = 5;
  private static readonly TOP_SOURCE_PREVIEW_LIMIT = 320;

  private readonly apiService = inject(ApiService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private streamSubscription: Subscription | null = null;

  protected query = '';
  protected loading = false;
  protected errorMessage = '';
  protected streamStatus = '';

  protected conversationsLoading = false;
  protected messagesLoading = false;
  protected conversations: ChatConversation[] = [];
  protected selectedConversationId: number | null = null;
  protected messages: ChatMessage[] = [];

  protected pendingQuestion = '';
  protected pendingAssistantAnswer = '';
  protected pendingAssistantSources: ReportAnswerResponse['sources'] = [];
  protected expandedSourceMessageId: string | null = null;

  ngOnInit(): void {
    this.loadConversations(true);
  }

  ngOnDestroy(): void {
    this.streamSubscription?.unsubscribe();
  }

  protected get selectedConversation(): ChatConversation | null {
    return this.conversations.find(item => item.id === this.selectedConversationId) ?? null;
  }

  protected get conversationMessages(): Array<ChatMessage | PendingBubble> {
    const existing = [...this.messages];
    if (!this.pendingQuestion) {
      return existing;
    }

    return [
      ...existing,
      {
        role: 'user',
        content: this.pendingQuestion,
        pending: true
      },
      {
        role: 'assistant',
        content: this.pendingAssistantAnswer || this.streamStatus || '...',
        sources: this.pendingAssistantSources,
        pending: true
      }
    ];
  }

  protected isSelectedConversation(conversationId: number): boolean {
    return this.selectedConversationId === conversationId;
  }

  protected selectConversation(conversationId: number): void {
    if (this.selectedConversationId === conversationId) {
      return;
    }

    this.selectedConversationId = conversationId;
    this.pendingQuestion = '';
    this.pendingAssistantAnswer = '';
    this.pendingAssistantSources = [];
    this.streamStatus = '';
    this.loading = false;
    this.expandedSourceMessageId = null;
    this.streamSubscription?.unsubscribe();
    this.loadMessages(conversationId);
  }

  protected newConversation(): void {
    this.apiService.createChatConversation().subscribe({
      next: (conversation) => {
        this.conversations = [conversation, ...this.conversations.filter(item => item.id !== conversation.id)];
        this.selectConversation(conversation.id);
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Unable to create a new conversation', error);
        this.errorMessage = error?.error?.error || error?.message || 'Unable to create a new chat.';
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  protected sendMessage(): void {
    const question = this.query.trim();
    if (!question) {
      return;
    }

    if (this.selectedConversationId == null) {
      this.apiService.createChatConversation().subscribe({
        next: (conversation) => {
          this.conversations = [conversation, ...this.conversations.filter(item => item.id !== conversation.id)];
          this.selectedConversationId = conversation.id;
          this.changeDetectorRef.detectChanges();
          this.startConversationStream(conversation.id, question);
        },
        error: (error) => {
          console.error('Unable to create a new conversation before sending', error);
          this.errorMessage = error?.error?.error || error?.message || 'Unable to create a new chat.';
          this.changeDetectorRef.detectChanges();
        }
      });
      return;
    }

    this.startConversationStream(this.selectedConversationId, question);
  }

  protected topSource(message: ChatMessage | PendingBubble) {
    return message.sources?.[0] ?? null;
  }

  protected displayedTopExtractedExcerpt(message: ChatMessage | PendingBubble): string {
    const excerpt = this.topSource(message)?.excerpt ?? '';
    if (this.expandedSourceMessageId === this.messageIdentity(message) || excerpt.length <= SearchLabPageComponent.TOP_SOURCE_PREVIEW_LIMIT) {
      return excerpt;
    }

    return `${excerpt.slice(0, SearchLabPageComponent.TOP_SOURCE_PREVIEW_LIMIT).trimEnd()}...`;
  }

  protected topExtractedSourceCanExpand(message: ChatMessage | PendingBubble): boolean {
    const excerpt = this.topSource(message)?.excerpt ?? '';
    return excerpt.length > SearchLabPageComponent.TOP_SOURCE_PREVIEW_LIMIT;
  }

  protected toggleTopSourceExpanded(message: ChatMessage | PendingBubble): void {
    const identity = this.messageIdentity(message);
    this.expandedSourceMessageId = this.expandedSourceMessageId === identity ? null : identity;
    this.changeDetectorRef.detectChanges();
  }

  protected messageIdentity(message: ChatMessage | PendingBubble): string {
    if ('id' in message && message.id != null) {
      return `message-${message.id}`;
    }
    return `pending-${message.role}`;
  }

  protected refreshConversations(): void {
    this.loadConversations(false);
  }

  protected deleteConversation(conversationId: number, event?: Event): void {
    event?.stopPropagation();

    const wasSelected = this.selectedConversationId === conversationId;

    this.apiService.deleteChatConversation(conversationId).subscribe({
      next: () => {
        this.conversations = this.conversations.filter(item => item.id !== conversationId);
        this.messages = wasSelected ? [] : this.messages;

        if (!this.conversations.length) {
          this.selectedConversationId = null;
          this.pendingQuestion = '';
          this.pendingAssistantAnswer = '';
          this.pendingAssistantSources = [];
          this.streamStatus = '';
          this.loading = false;
          this.newConversation();
          return;
        }

        if (wasSelected) {
          const nextConversation = this.conversations[0];
          this.selectedConversationId = nextConversation.id;
          this.loadMessages(nextConversation.id);
        }

        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Unable to delete the conversation', error);
        this.errorMessage = error?.error?.error || error?.message || 'Unable to delete the conversation.';
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  private loadConversations(autoCreateIfEmpty: boolean): void {
    this.conversationsLoading = true;
    this.apiService.getChatConversations()
      .pipe(finalize(() => {
        this.conversationsLoading = false;
        this.changeDetectorRef.detectChanges();
      }))
      .subscribe({
        next: (conversations) => {
          this.conversations = conversations;

          if (!conversations.length) {
            if (autoCreateIfEmpty) {
              this.newConversation();
            }
            return;
          }

          const targetConversation = this.selectedConversationId != null
            ? conversations.find(item => item.id === this.selectedConversationId)
            : conversations[0];

          if (targetConversation) {
            this.selectedConversationId = targetConversation.id;
            this.loadMessages(targetConversation.id);
          }
        },
        error: (error) => {
          console.error('Unable to load conversations', error);
          this.errorMessage = error?.error?.error || error?.message || 'Unable to load chats.';
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  private loadMessages(conversationId: number): void {
    this.messagesLoading = true;
    this.apiService.getChatMessages(conversationId)
      .pipe(finalize(() => {
        this.messagesLoading = false;
        this.changeDetectorRef.detectChanges();
      }))
      .subscribe({
        next: (messages) => {
          this.messages = messages;
          this.expandedSourceMessageId = null;
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          console.error('Unable to load conversation messages', error);
          this.messages = [];
          this.errorMessage = error?.error?.error || error?.message || 'Unable to load chat messages.';
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  private startConversationStream(conversationId: number, question: string): void {
    this.streamSubscription?.unsubscribe();
    this.loading = true;
    this.pendingQuestion = question;
    this.pendingAssistantAnswer = '';
    this.pendingAssistantSources = [];
    this.streamStatus = 'Opening answer stream...';
    this.errorMessage = '';
    this.query = '';
    this.expandedSourceMessageId = null;
    this.changeDetectorRef.detectChanges();

    this.streamSubscription = this.apiService.streamChatConversation(
      conversationId,
      question,
      SearchLabPageComponent.DEFAULT_TOP_K
    ).subscribe({
      next: (event) => {
        if (event.message) {
          this.streamStatus = event.message;
        }

        if (event.type === 'sources' && event.response) {
          this.pendingAssistantSources = event.response.sources ?? [];
        }

        if (event.type === 'answer_chunk' && event.answerChunk) {
          this.pendingAssistantAnswer = `${this.pendingAssistantAnswer}${event.answerChunk}`;
        }

        if (event.type === 'complete') {
          this.loading = false;
          this.streamStatus = '';
          this.pendingQuestion = '';
          this.pendingAssistantAnswer = '';
          this.pendingAssistantSources = [];
          this.loadConversations(false);
        }

        if (event.type === 'error') {
          this.streamStatus = '';
          this.loading = false;
          this.runStandardFallbackRequest(conversationId, question);
        }

        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Conversation stream failed', error);
        this.streamStatus = '';
        this.loading = false;
        this.runStandardFallbackRequest(conversationId, question);
      }
    });
  }

  private runStandardFallbackRequest(conversationId: number, question: string): void {
    this.apiService.askChatConversation(conversationId, question, SearchLabPageComponent.DEFAULT_TOP_K)
      .pipe(finalize(() => {
        this.loading = false;
        this.changeDetectorRef.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.pendingQuestion = '';
          this.pendingAssistantAnswer = '';
          this.pendingAssistantSources = [];
          this.streamStatus = '';
          this.loadConversations(false);
        },
        error: (error) => {
          console.error('Conversation fallback request failed', error);
          this.errorMessage = error?.error?.error || error?.message || 'Unable to send the message.';
          this.changeDetectorRef.detectChanges();
        }
      });
  }
}

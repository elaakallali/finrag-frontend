import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConversationService } from './conversation.service';
import { Conversation } from '../../models/conversation.model';

@Injectable({ providedIn: 'root' })
export class ConversationStore {
  private readonly conversationService = inject(ConversationService);

  readonly conversations = signal<Conversation[]>([]);
  readonly currentId = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly loading = signal(false);

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.conversationService.list().subscribe({
      next: (list) => {
        this.conversations.set(list);
        this.loading.set(false);
        if (list.length === 0) {
          this.create();
          return;
        }
        if (!this.currentId()) {
          this.currentId.set(list[0].id);
        }
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('Impossible de charger vos discussions. Reconnectez-vous.');
      }
    });
  }

  refresh(): void {
    this.conversationService.list().subscribe({
      next: (list) => this.conversations.set(list),
      error: () => {
        /* ignore refresh errors */
      }
    });
  }

  create(): void {
    this.conversationService.create('Nouvelle discussion').subscribe({
      next: (created) => {
        this.conversations.update((list) => [created, ...list]);
        this.currentId.set(created.id);
        this.loadError.set(null);
      },
      error: () => {
        this.loadError.set('Impossible de créer une discussion.');
      }
    });
  }

  /** Garantit qu'une conversation est sélectionnée (crée si besoin). */
  async ensureCurrentConversation(): Promise<string> {
    const existing = this.currentId();
    if (existing) {
      return existing;
    }

    const created = await firstValueFrom(
      this.conversationService.create('Nouvelle discussion')
    );
    this.conversations.update((list) => [created, ...list]);
    this.currentId.set(created.id);
    return created.id;
  }

  select(id: string): void {
    this.currentId.set(id);
  }

  delete(id: string): void {
    this.conversationService.delete(id).subscribe({
      next: () => {
        const remaining = this.conversations().filter((c) => c.id !== id);
        this.conversations.set(remaining);

        if (this.currentId() === id) {
          if (remaining.length > 0) {
            this.currentId.set(remaining[0].id);
          } else {
            this.currentId.set(null);
            this.create();
          }
        }
      },
      error: () => {
        this.loadError.set('Impossible de supprimer la discussion.');
      }
    });
  }

  clear(): void {
    this.conversations.set([]);
    this.currentId.set(null);
    this.loadError.set(null);
  }
}

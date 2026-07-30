import { Injectable, inject, signal } from '@angular/core';
import { ConversationService } from './conversation.service';
import { Conversation } from '../../models/conversation.model';

/** Etat partage entre la sidebar bleue et le chat. */
@Injectable({ providedIn: 'root' })
export class ConversationStore {
  private readonly conversationService = inject(ConversationService);

  readonly conversations = signal<Conversation[]>([]);
  readonly currentId = signal<string | null>(null);

  load(): void {
    this.conversationService.list().subscribe({
      next: (list) => {
        this.conversations.set(list);
        if (list.length === 0) {
          this.create();
          return;
        }
        if (!this.currentId()) {
          this.currentId.set(list[0].id);
        }
      }
    });
  }

  /** Recharge la liste (ex. apres generation du titre) sans changer la selection. */
  refresh(): void {
    this.conversationService.list().subscribe({
      next: (list) => this.conversations.set(list)
    });
  }

  create(): void {
    this.conversationService.create('Nouvelle discussion').subscribe({
      next: (created) => {
        this.conversations.update((list) => [created, ...list]);
        this.currentId.set(created.id);
      }
    });
  }

  select(id: string): void {
    this.currentId.set(id);
  }
}

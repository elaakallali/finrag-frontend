import { Injectable, inject, signal } from '@angular/core';
import { ConversationService } from './conversation.service';
import { Conversation } from '../../models/conversation.model';

/**
 * Etat partage entre :
 * - la sidebar (MainLayout) qui AFFICHE la liste
 * - le chat (UserChat) qui DECLENCHE le refresh apres "done"
 *
 * Les deux composants injectent le MEME store (providedIn: 'root').
 * Quand refresh() met a jour le signal conversations, la sidebar se re-rend toute seule.
 */
@Injectable({ providedIn: 'root' })
export class ConversationStore {
  private readonly conversationService = inject(ConversationService);

  /** Liste affichee dans la sidebar (signal reactif Angular). */
  readonly conversations = signal<Conversation[]>([]);

  /** Discussion selectionnee (surbrillance + messages charges dans le chat). */
  readonly currentId = signal<string | null>(null);

  /**
   * 1er chargement (entree mode User).
   * - remplit la liste
   * - cree une discussion si vide
   * - selectionne la 1re si aucune selection
   */
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

  /**
   * Mise a jour de la liste APRES generation du titre (ou tout changement serveur).
   * Difference avec load() :
   * - ne cree PAS de conversation
   * - ne change PAS currentId (on reste sur la meme discussion)
   * - remplace seulement conversations → Angular met a jour {{ c.title }} dans la sidebar
   */
  refresh(): void {
    this.conversationService.list().subscribe({
      next: (list) => this.conversations.set(list)
    });
  }

  /** Ajoute une discussion en tete de liste et la selectionne. */
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

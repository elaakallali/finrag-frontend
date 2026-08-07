import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { ConversationStore } from '../../core/services/conversation-store';

/**
 * Layout + sidebar.
 * La sidebar User LIT le signal conversations du store.
 * Elle ne genere pas le titre : elle affiche ce que le store contient apres load/refresh.
 */
@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly conversationStore = inject(ConversationStore);

  /** true = sidebar User, false = sidebar Admin */
  isUserMode = false;

  /**
   * Reference au signal du store (pas une copie).
   * Dans le HTML : conversations() → Angular re-affiche quand refresh() fait .set(list).
   */
  readonly conversations = this.conversationStore.conversations;
  readonly currentConversationId = this.conversationStore.currentId;

  constructor() {
    this.isUserMode = this.router.url.startsWith('/user');

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const nav = event as NavigationEnd;
        this.isUserMode = nav.urlAfterRedirects.startsWith('/user');
        // Entree /user → 1er chargement de la liste
        if (this.isUserMode) {
          this.conversationStore.load();
        }
      });
  }

  ngOnInit(): void {
    if (this.isUserMode) {
      this.conversationStore.load();
    }
  }

  createConversation(): void {
    this.conversationStore.create();
  }

  selectConversation(id: string): void {
    this.conversationStore.select(id);
  }
}

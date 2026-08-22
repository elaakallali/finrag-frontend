import { Component, OnInit, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { ConversationStore } from '../../core/services/conversation-store';
import { AuthService } from '../../core/services/auth.service';

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
  readonly auth = inject(AuthService);

  /** true = sidebar User, false = sidebar Admin */
  isUserMode = false;

  readonly conversations = this.conversationStore.conversations;
  readonly currentConversationId = this.conversationStore.currentId;
  readonly loadError = this.conversationStore.loadError;
  readonly displayName = computed(() => this.auth.displayName());
  readonly initials = computed(() => this.auth.initials());
  readonly email = computed(() => this.auth.currentUser()?.email ?? '');
  readonly isAdmin = this.auth.isAdmin;

  constructor() {
    this.isUserMode = this.router.url.startsWith('/user');

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const nav = event as NavigationEnd;
        this.isUserMode = nav.urlAfterRedirects.startsWith('/user');
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

  deleteConversation(id: string, event: Event): void {
    event.stopPropagation();
    if (!confirm('Supprimer cette discussion ?')) {
      return;
    }
    this.conversationStore.delete(id);
  }

  logout(): void {
    this.conversationStore.clear();
    this.auth.logout();
  }
}

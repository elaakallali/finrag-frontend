import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="profile-page">
      <div class="profile-card">
        <h2>Profil</h2>
        @if (user(); as u) {
          <div class="profile-grid">
            <div>
              <span class="label">Nom</span>
              <strong>{{ displayName() }}</strong>
            </div>
            <div>
              <span class="label">Email</span>
              <strong>{{ u.email }}</strong>
            </div>
            <div>
              <span class="label">Rôle</span>
              <strong>{{ u.role }}</strong>
            </div>
            <div>
              <span class="label">Statut</span>
              <strong>{{ u.active ? 'Actif' : 'Inactif' }}</strong>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .profile-page { max-width: 640px; }
    .profile-card {
      padding: 24px;
      border-radius: var(--fr-radius);
      background: var(--fr-surface);
      border: 1px solid var(--fr-border);
      box-shadow: 0 12px 40px rgba(0, 10, 40, 0.28);
      backdrop-filter: blur(10px);
    }
    h2 { margin: 0 0 18px; color: var(--fr-text); font-size: 1.25rem; }
    .profile-grid { display: grid; gap: 14px; }
    .label {
      display: block;
      margin-bottom: 4px;
      color: var(--fr-gold);
      font-size: 0.72rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-weight: 600;
    }
    strong { color: var(--fr-text); font-weight: 600; }
  `
})
export class UserProfileComponent {
  private readonly auth = inject(AuthService);
  readonly user = this.auth.currentUser;
  readonly displayName = computed(() => this.auth.displayName());
}

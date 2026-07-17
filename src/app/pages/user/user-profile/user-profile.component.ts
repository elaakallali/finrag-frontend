import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CardModule],
  template: `
    <p-card header="Profile">
      <p>Profil utilisateur — a venir.</p>
    </p-card>
  `
})
export class UserProfileComponent {}

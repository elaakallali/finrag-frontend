import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-user-history',
  standalone: true,
  imports: [CardModule],
  template: `
    <p-card header="History">
      <p>Historique des conversations — a venir.</p>
    </p-card>
  `
})
export class UserHistoryComponent {}

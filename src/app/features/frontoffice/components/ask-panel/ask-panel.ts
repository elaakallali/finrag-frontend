import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';

import { QueryResponse } from '../../../../core/models/query.model';
import { ReportQueryService } from '../../../../core/services/report-query';
import { SourcesList } from '../sources-list/sources-list';

@Component({
  selector: 'app-ask-panel',
  imports: [FormsModule, ButtonModule, TextareaModule, SourcesList],
  templateUrl: './ask-panel.html',
  styleUrl: './ask-panel.scss'
})
export class AskPanel {
  private readonly reportQueryService = inject(ReportQueryService);

  readonly question = signal('');
  readonly isAsking = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly response = signal<QueryResponse | null>(null);

  ask(): void {
    const question = this.question().trim();
    if (!question) {
      return;
    }

    this.isAsking.set(true);
    this.errorMessage.set(null);
    this.response.set(null);

    this.reportQueryService.ask(question).subscribe({
      next: (response) => {
        this.isAsking.set(false);
        this.response.set(response);
      },
      error: (error: unknown) => {
        this.isAsking.set(false);
        this.errorMessage.set(this.resolveErrorMessage(error));
      }
    });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return "Impossible de contacter le backend. Vérifiez qu'il est démarré sur le port 8081.";
    }
    return "La question n'a pas pu être traitée.";
  }
}

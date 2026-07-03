import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TextareaModule } from 'primeng/textarea';

import { ApiService, SearchResult } from '../core/api.service';

@Component({
  selector: 'app-search-lab-page',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputNumberModule,
    MessageModule,
    ProgressSpinnerModule,
    TextareaModule
  ],
  template: `
    <section class="page-header">
      <p class="eyebrow">Search Lab</p>
      <h1>Test vector retrieval</h1>
      <p>Ask a question and inspect the chunks returned by the report store.</p>
    </section>

    <p-card header="Search fin-report" subheader="Run a retrieval query against indexed financial chunks">
      <div class="field">
        <label for="query">Question</label>
        <textarea
          pTextarea
          id="query"
          rows="4"
          [(ngModel)]="query"
          placeholder="Quel est le chiffre d'affaires ?"
        ></textarea>
      </div>

      <div class="grid two-columns">
        <div class="field">
          <label for="topK">Top K</label>
          <p-inputNumber
            inputId="topK"
            [(ngModel)]="topK"
            [min]="1"
            [max]="20"
            [useGrouping]="false"
          />
        </div>
      </div>

      <div class="actions">
        <p-button
          label="Search report store"
          icon="pi pi-search"
          [loading]="loading"
          [disabled]="!query.trim() || loading"
          (onClick)="search()"
        />
        <div class="spinner-inline" *ngIf="loading">
          <p-progressSpinner
            strokeWidth="6"
            animationDuration=".8s"
            [style]="{ width: '28px', height: '28px' }"
          />
          <span class="hint">Computing nearest chunks...</span>
        </div>
      </div>
    </p-card>

    <p-card *ngIf="results.length" header="Results">

      <article class="result-card" *ngFor="let result of results; let index = index">
        <div class="result-meta">
          <span>#{{ index + 1 }}</span>
          <span *ngIf="result.score !== undefined">score: {{ result.score }}</span>
          <span *ngIf="result.similarity !== undefined">similarity: {{ result.similarity }}</span>
          <span *ngIf="result.distance !== undefined">distance: {{ result.distance }}</span>
        </div>

        <pre>{{ result | json }}</pre>
      </article>
    </p-card>

    <p-message *ngIf="errorMessage" severity="error" [text]="errorMessage" />
  `,
  styles: [`
    :host {
      display: grid;
      gap: 1.5rem;
    }

    .result-card {
      border-top: 1px solid rgba(12, 52, 61, 0.08);
      padding-top: 1rem;
      margin-top: 1rem;
    }

    .result-card:first-child {
      border-top: 0;
      margin-top: 0;
      padding-top: 0;
    }

    .result-meta {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.75rem;
      color: #56757d;
      font-size: 0.9rem;
    }
  `]
})
export class SearchLabPageComponent {
  private readonly apiService = inject(ApiService);

  protected query = '';
  protected topK = 5;
  protected loading = false;
  protected results: SearchResult[] = [];
  protected errorMessage = '';

  protected search(): void {
    if (!this.query.trim()) {
      return;
    }

    this.loading = true;
    this.results = [];
    this.errorMessage = '';

    this.apiService.searchReport(this.query.trim(), this.topK)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (results) => {
          this.results = results;
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || error?.message || 'Search failed.';
        }
      });
  }
}

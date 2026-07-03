import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { ApiService, IngestionStatusResponse } from '../core/api.service';

@Component({
  selector: 'app-report-ingestion-page',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    InputNumberModule,
    MessageModule,
    TagModule,
    ProgressSpinnerModule
  ],
  template: `
    <section class="page-header">
      <p class="eyebrow">Report Store</p>
      <h1>Ingest financial reports</h1>
      <p>Upload a report, choose a chunking strategy, and send it to <code>fin-report</code>.</p>
    </section>

    <p-card header="Upload and index report" subheader="PrimeNG-powered ingestion form">
      <div class="field">
        <label for="report-file">Document</label>
        <input id="report-file" type="file" accept=".pdf,.doc,.docx,.xlsx,.xls" (change)="onFileSelected($event)" />
      </div>

      <div class="grid">
        <div class="field">
          <label for="strategy">Chunking strategy</label>
          <p-select
            inputId="strategy"
            [options]="strategyOptions"
            optionLabel="label"
            optionValue="value"
            [(ngModel)]="strategy"
            placeholder="Choose a strategy"
          />
        </div>

        <div class="field">
          <label for="maxTokens">Max tokens</label>
          <p-inputNumber
            inputId="maxTokens"
            [(ngModel)]="maxTokens"
            [min]="50"
            [step]="50"
            [useGrouping]="false"
          />
        </div>

        <div class="field">
          <label for="overlapTokens">Overlap tokens</label>
          <p-inputNumber
            inputId="overlapTokens"
            [(ngModel)]="overlapTokens"
            [min]="0"
            [step]="10"
            [useGrouping]="false"
          />
        </div>
      </div>

      <div class="actions">
        <p-button
          label="Ingest report"
          icon="pi pi-upload"
          [loading]="loading"
          [disabled]="!selectedFile || loading"
          (onClick)="submit()"
        />
        <p-tag *ngIf="selectedFile" [value]="selectedFile.name" severity="contrast" />
        <div class="spinner-inline" *ngIf="loading">
          <p-progressSpinner
            strokeWidth="6"
            animationDuration=".8s"
            [style]="{ width: '28px', height: '28px' }"
          />
          <span class="hint">Sending chunks to fin-report...</span>
        </div>
      </div>
    </p-card>

    <p-card *ngIf="response || errorMessage" header="Backend response">
      <p-message *ngIf="response" severity="success" text="Report ingestion completed." />
      <p-message *ngIf="errorMessage" severity="error" [text]="errorMessage" />

      <pre *ngIf="response">{{ response | json }}</pre>
    </p-card>
  `,
  styles: [`
    :host {
      display: grid;
      gap: 1.5rem;
    }
  `]
})
export class ReportIngestionPageComponent {
  private readonly apiService = inject(ApiService);
  protected readonly strategyOptions = [
    { label: 'Markdown', value: 'markdown' },
    { label: 'Semantic', value: 'semantic' },
    { label: 'Size Based', value: 'size-based' },
    { label: 'Table Aware', value: 'table-aware' }
  ];

  protected selectedFile: File | null = null;
  protected strategy = 'markdown';
  protected maxTokens = 500;
  protected overlapTokens = 50;
  protected loading = false;
  protected response: IngestionStatusResponse | null = null;
  protected errorMessage = '';

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  protected submit(): void {
    if (!this.selectedFile) {
      return;
    }

    this.loading = true;
    this.response = null;
    this.errorMessage = '';

    this.apiService.ingestReport(this.selectedFile, this.strategy, this.maxTokens, this.overlapTokens)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.response = response;
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || error?.message || 'Failed to ingest report.';
        }
      });
  }
}

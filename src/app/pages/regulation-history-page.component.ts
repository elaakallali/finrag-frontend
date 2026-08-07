import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, finalize, takeUntil } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';

import { ApiService, IngestionHistoryItem } from '../core/api.service';
import { RegulationHistoryRefreshService } from '../core/regulation-history-refresh.service';

@Component({
  selector: 'app-regulation-history-page',
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    MessageModule,
    ProgressSpinnerModule,
    TagModule
  ],
  template: `
    <section class="page-header">
      <p class="eyebrow">Administration</p>
      <h1>Regulation history</h1>
      <p>Review the documents that have already been indexed in the regulation store.</p>
    </section>

    <p-card header="Indexed regulation documents">
      <div class="toolbar">
        <p-button
          label="Refresh history"
          icon="pi pi-refresh"
          [loading]="loading"
          (onClick)="loadHistory()"
        />
      </div>

      <div *ngIf="loading" class="loading-state">
        <p-progressSpinner
          strokeWidth="6"
          animationDuration=".8s"
          [style]="{ width: '64px', height: '64px' }"
        />
        <p>Loading ingestion history...</p>
      </div>

      <p-message
        *ngIf="!loading && errorMessage"
        severity="error"
        [text]="errorMessage"
      />

      <p-message
        *ngIf="!loading && !errorMessage && !history.length"
        severity="info"
        text="No regulation documents have been indexed yet."
      />

      <div *ngIf="!loading && history.length" class="history-table-wrapper">
        <table class="history-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Chunks</th>
              <th>Mode</th>
              <th>Strategy</th>
              <th>Indexed at</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of history">
              <td>{{ item.documentName }}</td>
              <td>{{ item.chunkCount }}</td>
              <td>
                <p-tag
                  [value]="item.dynamicMode ? 'Dynamic' : 'Classic'"
                  [severity]="item.dynamicMode ? 'info' : 'contrast'"
                />
              </td>
              <td>{{ item.strategy || '-' }}</td>
              <td>{{ formatDate(item.createdAt) }}</td>
              <td>
                <div class="actions-cell">
                  <p-button
                    icon="pi pi-eye"
                    label="View"
                    severity="secondary"
                    [text]="true"
                    (onClick)="viewItem(item.id)"
                  />
                  <p-button
                    icon="pi pi-download"
                    label="Download"
                    severity="secondary"
                    [text]="true"
                    (onClick)="downloadItem(item.id)"
                  />
                  <p-button
                    icon="pi pi-trash"
                    label="Delete"
                    severity="danger"
                    [text]="true"
                    (onClick)="deleteItem(item.id)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </p-card>
  `,
  styles: [`
    :host {
      display: grid;
      gap: 1.5rem;
    }

    .toolbar {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1rem;
    }

    .loading-state {
      min-height: 12rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      color: #5b7b82;
    }

    .history-table-wrapper {
      overflow-x: auto;
    }

    .history-table {
      width: 100%;
      border-collapse: collapse;
    }

    .history-table th,
    .history-table td {
      padding: 0.9rem 0.85rem;
      border-bottom: 1px solid rgba(12, 52, 61, 0.08);
      text-align: left;
      vertical-align: middle;
    }

    .history-table th {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #6c858b;
      background: rgba(248, 244, 235, 0.8);
    }

    .history-table td {
      color: #12373e;
    }

    .actions-cell {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      align-items: center;
    }
  `]
})
export class RegulationHistoryPageComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly historyRefreshService = inject(RegulationHistoryRefreshService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  protected history: IngestionHistoryItem[] = [];
  protected loading = false;
  protected errorMessage = '';

  ngOnInit(): void {
    this.loadHistory();
    this.historyRefreshService.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadHistory());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected loadHistory(): void {
    this.loading = true;
    this.errorMessage = '';
    this.history = [];
    this.changeDetectorRef.detectChanges();

    this.apiService.getRegulationHistory()
      .pipe(finalize(() => {
        this.loading = false;
        this.changeDetectorRef.detectChanges();
      }))
      .subscribe({
        next: (history) => {
          this.history = Array.isArray(history) ? history : [];
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || error?.message || 'Failed to load regulation history.';
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  protected formatDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleString();
  }

  protected viewItem(id: number): void {
    window.open(this.apiService.viewRegulationHistoryFileUrl(id), '_blank', 'noopener');
  }

  protected downloadItem(id: number): void {
    window.open(this.apiService.downloadRegulationHistoryFileUrl(id), '_blank', 'noopener');
  }

  protected deleteItem(id: number): void {
    this.apiService.deleteRegulationHistoryItem(id).subscribe({
      next: () => {
        this.history = this.history.filter((item) => item.id !== id);
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || error?.message || 'Failed to delete the regulation document.';
        this.changeDetectorRef.detectChanges();
      }
    });
  }
}

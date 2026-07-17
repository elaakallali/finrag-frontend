import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, finalize, takeUntil } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';

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
    TagModule,
    TableModule
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

      <p-table
        *ngIf="!loading && history.length"
        [value]="history"
        [paginator]="true"
        [rows]="10"
        [rowsPerPageOptions]="[5, 10, 20]"
        responsiveLayout="scroll"
        styleClass="history-table"
      >
        <ng-template pTemplate="header">
          <tr>
            <th>Document</th>
            <th>Chunks</th>
            <th>Mode</th>
            <th>Strategy</th>
            <th>Indexed at</th>
            <th>Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-item>
          <tr>
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
              <div class="history-actions">
                <p-button
                  label="View"
                  icon="pi pi-eye"
                  [text]="true"
                  [disabled]="!item.fileAvailable"
                  (onClick)="viewFile(item)"
                />
                <p-button
                  label="Download"
                  icon="pi pi-download"
                  [text]="true"
                  [disabled]="!item.fileAvailable"
                  (onClick)="downloadFile(item)"
                />
                <p-button
                  label="Delete"
                  icon="pi pi-trash"
                  severity="danger"
                  [text]="true"
                  (onClick)="deleteItem(item)"
                />
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
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

    .history-actions {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex-wrap: wrap;
    }

    :host ::ng-deep .history-table .p-datatable-thead > tr > th {
      padding: 0.9rem 0.85rem;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #6c858b;
      background: rgba(248, 244, 235, 0.8);
      text-align: left;
      border-bottom: 1px solid rgba(12, 52, 61, 0.08);
    }

    :host ::ng-deep .history-table .p-datatable-tbody > tr > td {
      padding: 0.9rem 0.85rem;
      color: #12373e;
      text-align: left;
      vertical-align: middle;
      border-bottom: 1px solid rgba(12, 52, 61, 0.08);
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

  protected viewFile(item: IngestionHistoryItem): void {
    if (!item.fileAvailable) {
      return;
    }

    window.open(this.apiService.viewRegulationHistoryFileUrl(item.id), '_blank', 'noopener,noreferrer');
  }

  protected downloadFile(item: IngestionHistoryItem): void {
    if (!item.fileAvailable) {
      return;
    }

    window.open(this.apiService.downloadRegulationHistoryFileUrl(item.id), '_blank', 'noopener,noreferrer');
  }

  protected deleteItem(item: IngestionHistoryItem): void {
    const confirmed = window.confirm(`Delete "${item.documentName}" from history?`);
    if (!confirmed) {
      return;
    }

    this.apiService.deleteRegulationHistoryItem(item.id)
      .subscribe({
        next: () => {
          this.history = this.history.filter(historyItem => historyItem.id !== item.id);
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || error?.message || 'Failed to delete regulation history entry.';
          this.changeDetectorRef.detectChanges();
        }
      });
  }
}

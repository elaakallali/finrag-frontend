import { DatePipe } from '@angular/common';
import { Component, OnDestroy, inject, input, output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import type { TableLazyLoadEvent } from 'primeng/types/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import {
  IngestedDocument,
  IngestionHistorySortField,
  IngestionStatus,
  SortDirection
} from '../../../../core/models/document.model';
import { IngestionService } from '../../../../core/services/ingestion';

const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-ingestion-history',
  imports: [TableModule, TagModule, DatePipe, ButtonModule, TooltipModule, InputTextModule],
  templateUrl: './ingestion-history.html',
  styleUrl: './ingestion-history.scss'
})
export class IngestionHistory implements OnDestroy {
  private readonly ingestionService = inject(IngestionService);
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  readonly documents = input<IngestedDocument[]>([]);
  readonly sortField = input<IngestionHistorySortField>('createdAt');
  readonly sortDirection = input<SortDirection>('desc');
  readonly totalElements = input<number>(0);
  readonly pageSize = input<number>(4);

  readonly documentDeleted = output<void>();
  readonly searchChanged = output<string>();
  readonly sortChanged = output<{ field: IngestionHistorySortField; direction: SortDirection }>();
  readonly pageChanged = output<{ page: number; size: number }>();

  readonly deletingId = signal<number | null>(null);
  readonly errorMessage = signal<string | null>(null);

  ngOnDestroy(): void {
    if (this.searchDebounceTimer !== null) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  onSearchInput(value: string): void {
    if (this.searchDebounceTimer !== null) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => this.searchChanged.emit(value.trim()), SEARCH_DEBOUNCE_MS);
  }

  toggleSort(field: IngestionHistorySortField): void {
    const direction: SortDirection =
      this.sortField() === field && this.sortDirection() === 'asc' ? 'desc' : 'asc';
    this.sortChanged.emit({ field, direction });
  }

  sortIcon(field: IngestionHistorySortField): string {
    if (this.sortField() !== field) {
      return 'pi pi-sort-alt';
    }
    return this.sortDirection() === 'asc' ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down';
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize();
    const first = event.first ?? 0;
    this.pageChanged.emit({ page: Math.floor(first / rows), size: rows });
  }

  statusSeverity(status: IngestionStatus): 'success' | 'danger' | 'info' | 'warn' {
    switch (status) {
      case 'DONE':
        return 'success';
      case 'FAILED':
        return 'danger';
      case 'IN_PROGRESS':
        return 'info';
      default:
        return 'warn';
    }
  }

  statusLabel(status: IngestionStatus): string {
    switch (status) {
      case 'DONE':
        return 'Terminé';
      case 'FAILED':
        return 'Échec';
      case 'IN_PROGRESS':
        return 'En cours';
      default:
        return 'En attente';
    }
  }

  viewPdf(doc: IngestedDocument): void {
    window.open(this.ingestionService.getPdfUrl(doc.id), '_blank');
  }

  deleteDocument(doc: IngestedDocument): void {
    const confirmed = window.confirm(
      `Supprimer définitivement "${doc.fileName}" ? L'historique, les chunks et les embeddings associés seront supprimés.`
    );
    if (!confirmed) {
      return;
    }

    this.errorMessage.set(null);
    this.deletingId.set(doc.id);

    this.ingestionService.deleteDocument(doc.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.documentDeleted.emit();
      },
      error: () => {
        this.deletingId.set(null);
        this.errorMessage.set(`La suppression de "${doc.fileName}" a échoué.`);
      }
    });
  }
}

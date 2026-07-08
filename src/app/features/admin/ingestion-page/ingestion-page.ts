import { Component, OnInit, inject, signal } from '@angular/core';

import {
  IngestedDocument,
  IngestionHistorySortField,
  SortDirection
} from '../../../core/models/document.model';
import { IngestionService } from '../../../core/services/ingestion';
import { IngestionHistory } from '../components/ingestion-history/ingestion-history';
import { UploadPanel } from '../components/upload-panel/upload-panel';

const DEFAULT_PAGE_SIZE = 4;

@Component({
  selector: 'app-ingestion-page',
  imports: [UploadPanel, IngestionHistory],
  templateUrl: './ingestion-page.html',
  styleUrl: './ingestion-page.scss'
})
export class IngestionPage implements OnInit {
  private readonly ingestionService = inject(IngestionService);

  readonly documents = signal<IngestedDocument[]>([]);
  readonly totalElements = signal(0);
  readonly searchTerm = signal('');
  readonly sortField = signal<IngestionHistorySortField>('createdAt');
  readonly sortDirection = signal<SortDirection>('desc');
  readonly page = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  ngOnInit(): void {
    this.refreshHistory();
  }

  // Le backend persiste l'historique (table ingestion_history) et applique la recherche/le tri/la
  // pagination ; on recharge depuis là après chaque changement pour rester la source de vérité.
  refreshHistory(): void {
    this.ingestionService
      .getHistory({
        search: this.searchTerm(),
        sortBy: this.sortField(),
        sortDir: this.sortDirection(),
        page: this.page(),
        size: this.pageSize()
      })
      .subscribe({
        next: ({ documents, totalElements }) => {
          this.documents.set(documents);
          this.totalElements.set(totalElements);
        },
        error: () => {
          // silencieux : la table d'historique reste simplement vide si l'appel échoue
        }
      });
  }

  onSearchChanged(term: string): void {
    this.searchTerm.set(term);
    this.page.set(0);
    this.refreshHistory();
  }

  onSortChanged(sort: { field: IngestionHistorySortField; direction: SortDirection }): void {
    this.sortField.set(sort.field);
    this.sortDirection.set(sort.direction);
    this.page.set(0);
    this.refreshHistory();
  }

  onPageChanged(pageEvent: { page: number; size: number }): void {
    this.page.set(pageEvent.page);
    this.pageSize.set(pageEvent.size);
    this.refreshHistory();
  }
}

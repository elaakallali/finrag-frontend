import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { DocumentService } from '../../../core/services/document.service';
import { DocumentRow } from '../../../models/document.model';

@Component({
  selector: 'app-document-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TableModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './document-history.component.html',
  styleUrls: ['./document-history.component.css']
})
export class DocumentHistoryComponent {

  documents: DocumentRow[] = [];
  searchName = '';
  isLoading = false;
  deleteError: string | null = null;

  // Pagination geree par le backend (3 par page)
  currentPage = 0;
  pageSize = 5;
  totalElements = 0;

  constructor(
    private documentService: DocumentService,
    private confirmationService: ConfirmationService
  ) {}

  loadDocuments(): void {
    this.isLoading = true;

    this.documentService.listDocuments(this.searchName, this.currentPage).subscribe({
      next: (page) => {
        this.pageSize = page.size;
        this.totalElements = page.totalElements;
        this.currentPage = page.page;

        this.documents = page.content.map(doc => ({
          id: doc.id,
          name: doc.filename,
          uploadDate: this.formatDate(doc.uploadedAt)
        }));

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des documents :', error);
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize;
    this.currentPage = Math.floor((event.first ?? 0) / rows);
    this.loadDocuments();
  }

  onSearchChange(): void {
    this.currentPage = 0;
    this.loadDocuments();
  }

  reloadDocuments(): void {
    this.searchName = '';
    this.currentPage = 0;
    this.loadDocuments();
  }

  viewDocument(doc: DocumentRow): void {
    this.documentService.viewDocument(doc.id);
  }

  downloadDocument(doc: DocumentRow): void {
    this.documentService.downloadDocument(doc.id);
  }

  deleteDocument(doc: DocumentRow): void {
    this.deleteError = null;

    this.confirmationService.confirm({
      message: `Supprimer « ${doc.name} » et tous ses chunks de la base ?`,
      header: 'Confirmer la suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.documentService.deleteDocument(doc.id).subscribe({
          next: () => {
            if (this.documents.length === 1 && this.currentPage > 0) {
              this.currentPage--;
            }
            this.loadDocuments();
          },
          error: (error: { error?: { message?: string }; message?: string }) => {
            this.deleteError =
              error.error?.message ?? error.message ?? 'Impossible de supprimer le document.';
            console.error('Erreur lors de la suppression :', error);
          }
        });
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DocumentIngestionRequest,
  DocumentPage,
  IngestionResponse,
  IngestionStep
} from '../../models/document.model';
import { findChunkingStrategy } from '../../models/chunking-strategies';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  listDocuments(name?: string, page = 0): Observable<DocumentPage> {
    let params = new HttpParams().set('page', page);
    if (name?.trim()) {
      params = params.set('name', name.trim());
    }
    return this.http.get<DocumentPage>(`${this.baseUrl}/documents`, { params });
  }

  /** Étapes du pipeline d'ingestion affichées pendant le spinner. */
  getIngestionSteps(): Observable<IngestionStep[]> {
    return this.http.get<IngestionStep[]>(`${this.baseUrl}/documents/ingestion-steps`);
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/documents/${id}`);
  }

  /** URL d'affichage du PDF (proxy Angular → backend, pas de :8081 visible). */
  getViewUrl(id: string): string {
    return `${this.baseUrl}/documents/${id}/view`;
  }

  /** URL de telechargement du PDF. */
  getDownloadUrl(id: string): string {
    return `${this.baseUrl}/documents/${id}/download`;
  }

  /**
   * Ouvre le PDF dans un nouvel onglet.
   * Le backend lit file_data en base et renvoie application/pdf (inline).
   * Avec apiUrl = '/api', l'URL affichee est localhost:4200/api/...
   */
  viewDocument(id: string): void {
    window.open(this.getViewUrl(id), '_blank', 'noopener');
  }

  downloadDocument(id: string): void {
    window.open(this.getDownloadUrl(id), '_blank', 'noopener');
  }

  ingestDocument(request: DocumentIngestionRequest): Observable<IngestionResponse> {
    const strategyConfig = findChunkingStrategy(request.chunkingStrategy);
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('strategy', strategyConfig.apiStrategy);

    if (strategyConfig.usesTokenBudget) {
      formData.append('chunkSize', String(request.chunkSize));
      formData.append('overlap', String(this.defaultOverlap(request.chunkSize)));
    }

    return this.http.post<IngestionResponse>(`${this.baseUrl}/regulation/ingest`, formData);
  }

  computeOverlap(chunkSize: number): number {
    return this.defaultOverlap(chunkSize);
  }

  private defaultOverlap(chunkSize: number): number {
    return Math.max(1, Math.floor(chunkSize * 0.1));
  }
}

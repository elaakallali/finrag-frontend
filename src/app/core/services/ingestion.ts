import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

// Base WebSocket dérivée de l'URL HTTP de l'API (http://localhost:8081/api -> ws://localhost:8081).
function toWebSocketBaseUrl(apiBaseUrl: string): string {
  return apiBaseUrl.replace(/^http/, 'ws').replace(/\/api$/, '');
}

import { environment } from '../../../environments/environment';
import {
  ChunkingStrategy,
  IngestedDocument,
  IngestionHistoryEntry,
  IngestionHistoryPageResponse,
  IngestionHistorySortField,
  IngestionJobCreated,
  IngestionJobStatus,
  RegulationType,
  SortDirection
} from '../models/document.model';

export interface IngestionHistoryQuery {
  search?: string;
  sortBy?: IngestionHistorySortField;
  sortDir?: SortDirection;
  page?: number;
  size?: number;
}

export interface IngestedDocumentsPage {
  documents: IngestedDocument[];
  totalElements: number;
}

@Injectable({
  providedIn: 'root',
})
export class IngestionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  ingestRegulation(
    file: File,
    regulationType: RegulationType,
    strategy: ChunkingStrategy = 'MIXED'
  ): Observable<IngestionJobCreated> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('strategy', strategy);
    formData.append('regulationType', regulationType);

    return this.http.post<IngestionJobCreated>(`${this.baseUrl}/regulation/ingest`, formData);
  }

  getIngestionStatus(jobId: string): Observable<IngestionJobStatus> {
    return this.http.get<IngestionJobStatus>(`${this.baseUrl}/regulation/ingest/${jobId}/status`);
  }

  // Remplace le polling de getIngestionStatus() : le backend pousse un message dès que le job
  // avance (voir IngestionJobRegistry côté backend), au lieu que le front redemande toutes les
  // secondes. Le navigateur reçoit chaque changement d'état en temps réel, sans intervalle
  // d'attente ni étape manquée.
  watchJobStatus(jobId: string): Observable<IngestionJobStatus> {
    const wsUrl = `${toWebSocketBaseUrl(this.baseUrl)}/ws/ingestion/${jobId}`;

    return new Observable<IngestionJobStatus>((subscriber) => {
      const socket = new WebSocket(wsUrl);
      socket.onmessage = (event) => subscriber.next(JSON.parse(event.data));
      socket.onerror = (event) => subscriber.error(event);
      socket.onclose = () => subscriber.complete();

      return () => socket.close();
    });
  }

  getHistory(query: IngestionHistoryQuery = {}): Observable<IngestedDocumentsPage> {
    let params = new HttpParams();
    if (query.search) {
      params = params.set('search', query.search);
    }
    if (query.sortBy) {
      params = params.set('sortBy', query.sortBy);
    }
    if (query.sortDir) {
      params = params.set('sortDir', query.sortDir);
    }
    if (query.page !== undefined) {
      params = params.set('page', query.page);
    }
    if (query.size !== undefined) {
      params = params.set('size', query.size);
    }

    return this.http
      .get<IngestionHistoryPageResponse>(`${this.baseUrl}/regulation/history`, { params })
      .pipe(
        map((res) => ({
          documents: res.content.map(toIngestedDocument),
          totalElements: res.totalElements
        }))
      );
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/regulation/${id}`);
  }

  getPdfUrl(id: number): string {
    return `${this.baseUrl}/regulation/${id}/pdf`;
  }
}

function toIngestedDocument(entry: IngestionHistoryEntry): IngestedDocument {
  return {
    id: entry.id,
    fileName: entry.documentName,
    regulationType: (entry.regulationType as RegulationType) ?? 'MiFID II',
    strategy: (entry.strategy as ChunkingStrategy) ?? 'MIXED',
    status: entry.success ? 'DONE' : 'FAILED',
    chunkCount: entry.success ? entry.chunkCount : null,
    indexedAt: entry.success ? entry.createdAt : null
  };
}

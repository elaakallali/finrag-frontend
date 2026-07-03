import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IngestionStatusResponse {
  success?: boolean;
  timestamp?: number | string;
  error?: string | null;
  chunkCount?: number | null;
}

export interface IngestionJobResponse {
  jobId: string;
  status: string;
}

export interface IngestionProgressResponse {
  jobId: string;
  status: string;
  stage: string;
  documentName?: string;
  success?: boolean | null;
  timestamp?: number | null;
  error?: string | null;
  chunkCount?: number | null;
}

export interface IngestionHistoryItem {
  id: number;
  documentName: string;
  documentType: string;
  chunkCount: number;
  strategy?: string | null;
  maxTokens?: number | null;
  overlapTokens?: number | null;
  dynamicMode: boolean;
  createdAt: string;
}

export interface SearchResult {
  content: string;
  score?: number;
  similarity?: number;
  distance?: number;
  metadata?: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8081/api';

  ingestReport(file: File, strategy: string, maxTokens?: number, overlapTokens?: number): Observable<IngestionStatusResponse> {
    const params = this.buildChunkingParams(strategy, maxTokens, overlapTokens);

    return this.http.post<IngestionStatusResponse>(
      `${this.baseUrl}/report/ingest/dynamic`,
      this.toFormData(file),
      { params }
    );
  }

  ingestRegulation(file: File, strategy: string, maxTokens?: number, overlapTokens?: number): Observable<IngestionStatusResponse> {
    const params = this.buildClassicChunkingParams(strategy, maxTokens, overlapTokens);

    return this.http.post<IngestionStatusResponse>(
      `${this.baseUrl}/regulation/ingest`,
      this.toFormData(file),
      { params }
    );
  }

  getRegulationHistory(): Observable<IngestionHistoryItem[]> {
    return this.http.get<IngestionHistoryItem[]>(`${this.baseUrl}/regulation/history`);
  }

  startRegulationIngestionAsync(file: File, strategy: string, maxTokens?: number, overlapTokens?: number): Observable<IngestionJobResponse> {
    const params = this.buildClassicChunkingParams(strategy, maxTokens, overlapTokens);

    return this.http.post<IngestionJobResponse>(
      `${this.baseUrl}/regulation/ingest/async`,
      this.toFormData(file),
      { params }
    );
  }

  ingestRegulationDynamic(file: File, strategy: string, maxTokens?: number, overlapTokens?: number): Observable<IngestionStatusResponse> {
    const params = this.buildChunkingParams(strategy, maxTokens, overlapTokens);

    return this.http.post<IngestionStatusResponse>(
      `${this.baseUrl}/regulation/ingest/dynamic`,
      this.toFormData(file),
      { params }
    );
  }

  startRegulationDynamicIngestionAsync(file: File, strategy: string, maxTokens?: number, overlapTokens?: number): Observable<IngestionJobResponse> {
    const params = this.buildChunkingParams(strategy, maxTokens, overlapTokens);

    return this.http.post<IngestionJobResponse>(
      `${this.baseUrl}/regulation/ingest/dynamic/async`,
      this.toFormData(file),
      { params }
    );
  }

  getRegulationIngestionProgress(jobId: string): Observable<IngestionProgressResponse> {
    return this.http.get<IngestionProgressResponse>(`${this.baseUrl}/regulation/ingest/progress/${jobId}`);
  }

  searchReport(query: string, topK: number): Observable<SearchResult[]> {
    const params = new HttpParams()
      .set('query', query)
      .set('topK', topK);

    return this.http.post<SearchResult[]>(
      `${this.baseUrl}/report/search`,
      null,
      { params }
    );
  }

  private buildChunkingParams(strategy: string, maxTokens?: number, overlapTokens?: number): HttpParams {
    let params = new HttpParams().set('chunkingStrategy', strategy);

    if (maxTokens) {
      params = params.set('maxTokens', maxTokens);
    }

    if (overlapTokens !== undefined && overlapTokens !== null) {
      params = params.set('overlapTokens', overlapTokens);
    }

    return params;
  }

  private buildClassicChunkingParams(strategy: string, maxTokens?: number, overlapTokens?: number): HttpParams {
    let params = new HttpParams().set('strategy', strategy);

    if (maxTokens) {
      params = params.set('maxTokens', maxTokens);
    }

    if (overlapTokens !== undefined && overlapTokens !== null) {
      params = params.set('overlapTokens', overlapTokens);
    }

    return params;
  }

  private toFormData(file: File): FormData {
    const formData = new FormData();
    formData.append('file', file);
    return formData;
  }
}

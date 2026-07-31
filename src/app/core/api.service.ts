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
  fileAvailable?: boolean;
  createdAt: string;
}

export interface SearchResult {
  content: string;
  score?: number;
  similarity?: number;
  distance?: number;
  metadata?: Record<string, unknown>;
}

export interface ReportAnswerSource {
  documentType?: string;
  sourceName: string;
  pageStart?: number | null;
  pageEnd?: number | null;
  score?: number | null;
  excerpt: string;
}

export interface ReportAnswerResponse {
  answer: string;
  sources: ReportAnswerSource[];
}

export interface SearchAnswerStreamEvent {
  type: string;
  message?: string | null;
  answerChunk?: string | null;
  response?: ReportAnswerResponse | null;
}

export interface SearchHistoryItem {
  id: number;
  question: string;
  answer: string;
  sources: ReportAnswerSource[];
  topK?: number | null;
  createdAt: string;
}

export interface SearchHistoryStreamEvent {
  id: number;
  question: string;
  answer: string;
  sources: ReportAnswerSource[];
  topK?: number | null;
  createdAt: string;
}

export interface ChatConversation {
  id: number;
  title: string;
  lastMessagePreview?: string | null;
  reportIngestionKey?: string | null;
  reportDocumentName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant' | string;
  content: string;
  sources: ReportAnswerSource[];
  topK?: number | null;
  createdAt: string;
}

export interface PromptContextSource {
  documentType: string;
  sourceName: string;
  pageStart?: number | null;
  pageEnd?: number | null;
  score?: number | null;
  excerpt: string;
}

export interface PromptBuildResponse {
  question: string;
  prompt: string;
  sources: PromptContextSource[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  ingestReport(file: File, strategy: string, maxTokens?: number, overlapTokens?: number): Observable<IngestionStatusResponse> {
    const params = this.buildChunkingParams(strategy, maxTokens, overlapTokens);

    return this.http.post<IngestionStatusResponse>(
      `${this.baseUrl}/report/ingest/dynamic`,
      this.toFormData(file),
      { params }
    );
  }

  startReportDynamicIngestionAsync(file: File, strategy: string, maxTokens?: number, overlapTokens?: number): Observable<IngestionJobResponse> {
    const params = this.buildChunkingParams(strategy, maxTokens, overlapTokens);

    return this.http.post<IngestionJobResponse>(
      `${this.baseUrl}/report/ingest/dynamic/async`,
      this.toFormData(file),
      { params }
    );
  }

  startReportIngestionAsync(file: File, strategy: string, maxTokens?: number, overlapTokens?: number): Observable<IngestionJobResponse> {
    const params = this.buildClassicChunkingParams(strategy, maxTokens, overlapTokens);

    return this.http.post<IngestionJobResponse>(
      `${this.baseUrl}/report/ingest/async`,
      this.toFormData(file),
      { params }
    );
  }

  getReportIngestionProgress(jobId: string): Observable<IngestionProgressResponse> {
    return this.http.get<IngestionProgressResponse>(`${this.baseUrl}/report/ingest/progress/${jobId}`);
  }

  cancelReportIngestion(jobId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/report/ingest/cancel/${jobId}`, null);
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

  deleteRegulationHistoryItem(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/regulation/history/${id}/delete`, null);
  }

  viewRegulationHistoryFileUrl(id: number): string {
    return `${this.baseUrl}/regulation/history/${id}/view`;
  }

  downloadRegulationHistoryFileUrl(id: number): string {
    return `${this.baseUrl}/regulation/history/${id}/download`;
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

  cancelRegulationIngestion(jobId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/regulation/ingest/cancel/${jobId}`, null);
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

  askWorkspace(query: string, topK: number = 5): Observable<ReportAnswerResponse> {
    const params = new HttpParams()
      .set('query', query)
      .set('topK', topK);

    return this.http.post<ReportAnswerResponse>(
      `${this.baseUrl}/search/ask`,
      null,
      { params }
    );
  }

  streamWorkspace(query: string, topK: number = 5): Observable<SearchAnswerStreamEvent> {
    return new Observable<SearchAnswerStreamEvent>((observer) => {
      const url = `${this.baseUrl}/search/ask/stream?query=${encodeURIComponent(query)}&topK=${encodeURIComponent(topK)}`;
      const eventSource = new EventSource(url);

      const handleEvent = (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data) as SearchAnswerStreamEvent;
          observer.next(payload);

          if (payload.type === 'complete' || payload.type === 'error') {
            eventSource.close();
            observer.complete();
          }
        } catch (error) {
          eventSource.close();
          observer.error(error);
        }
      };

      eventSource.onmessage = handleEvent;
      ['status', 'sources', 'answer_chunk', 'complete', 'error'].forEach((eventName) => {
        eventSource.addEventListener(eventName, handleEvent as EventListener);
      });

      eventSource.onerror = () => {
        eventSource.close();
        observer.error(new Error('The answer stream failed.'));
      };

      return () => eventSource.close();
    });
  }

  createChatConversation(title?: string): Observable<ChatConversation> {
    let params = new HttpParams();
    if (title && title.trim()) {
      params = params.set('title', title.trim());
    }

    return this.http.post<ChatConversation>(`${this.baseUrl}/chat/conversations`, null, { params });
  }

  getChatConversations(): Observable<ChatConversation[]> {
    return this.http.get<ChatConversation[]>(`${this.baseUrl}/chat/conversations`);
  }

  getChatMessages(conversationId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/chat/conversations/${conversationId}/messages`);
  }

  deleteChatConversation(conversationId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/chat/conversations/${conversationId}`);
  }

  uploadChatConversationReport(conversationId: number, file: File): Observable<ChatConversation> {
    return this.http.post<ChatConversation>(
      `${this.baseUrl}/chat/conversations/${conversationId}/report`,
      this.toFormData(file)
    );
  }

  askChatConversation(conversationId: number, query: string, topK: number = 5): Observable<ReportAnswerResponse> {
    const params = new HttpParams()
      .set('query', query)
      .set('topK', topK);

    return this.http.get<ReportAnswerResponse>(
      `${this.baseUrl}/chat/conversations/${conversationId}/ask`,
      { params }
    );
  }

  streamChatConversation(conversationId: number, query: string, topK: number = 5): Observable<SearchAnswerStreamEvent> {
    return new Observable<SearchAnswerStreamEvent>((observer) => {
      const url = `${this.baseUrl}/chat/conversations/${conversationId}/ask/stream?query=${encodeURIComponent(query)}&topK=${encodeURIComponent(topK)}`;
      const eventSource = new EventSource(url);

      const handleEvent = (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data) as SearchAnswerStreamEvent;
          observer.next(payload);

          if (payload.type === 'complete' || payload.type === 'error') {
            eventSource.close();
            observer.complete();
          }
        } catch (error) {
          eventSource.close();
          observer.error(error);
        }
      };

      eventSource.onmessage = handleEvent;
      ['status', 'sources', 'answer_chunk', 'complete', 'error'].forEach((eventName) => {
        eventSource.addEventListener(eventName, handleEvent as EventListener);
      });

      eventSource.onerror = () => {
        eventSource.close();
        observer.error(new Error('The conversation stream failed.'));
      };

      return () => eventSource.close();
    });
  }

  getSearchHistory(): Observable<SearchHistoryItem[]> {
    return this.http.get<SearchHistoryItem[]>(`${this.baseUrl}/search/history`);
  }

  streamSearchHistory(): Observable<SearchHistoryStreamEvent> {
    return new Observable<SearchHistoryStreamEvent>((observer) => {
      const eventSource = new EventSource(`${this.baseUrl}/search/history/stream`);

      const handleEvent = (event: MessageEvent) => {
        try {
          observer.next(JSON.parse(event.data) as SearchHistoryStreamEvent);
        } catch (error) {
          eventSource.close();
          observer.error(error);
        }
      };

      eventSource.onmessage = handleEvent;
      eventSource.addEventListener('history_saved', handleEvent as EventListener);

      eventSource.onerror = () => {
        eventSource.close();
        observer.error(new Error('The history stream failed.'));
      };

      return () => eventSource.close();
    });
  }

  deleteSearchHistoryItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/search/history/${id}`);
  }

  clearSearchHistory(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/search/history`);
  }

  buildMultiStorePrompt(query: string, topK: number = 5): Observable<PromptBuildResponse> {
    const params = new HttpParams()
      .set('query', query)
      .set('topK', topK);

    return this.http.get<PromptBuildResponse>(
      `${this.baseUrl}/prompt/build`,
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

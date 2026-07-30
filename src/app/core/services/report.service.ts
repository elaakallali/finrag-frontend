import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IngestionResponse, RagQueryResponse } from '../../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /** Envoie un PDF rapport (renvoie l'id tout de suite, travail en async). */
  uploadReport(file: File): Observable<IngestionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('strategy', 'TABLE_AWARE');
    return this.http.post<IngestionResponse>(`${this.baseUrl}/report/ingest`, formData);
  }

  /** Pose une question au RAG (fin_report + fin_regulation) */
  ask(question: string): Observable<RagQueryResponse> {
    const params = new HttpParams().set('question', question);
    return this.http.post<RagQueryResponse>(`${this.baseUrl}/rag/ask`, null, { params });
  }
}

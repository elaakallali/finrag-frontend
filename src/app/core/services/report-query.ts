import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { QueryResponse } from '../models/query.model';

interface QueryRequestDto {
  question: string;
  topK?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ReportQueryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  ask(question: string, topK?: number): Observable<QueryResponse> {
    const body: QueryRequestDto = { question, topK };
    return this.http.post<QueryResponse>(`${this.baseUrl}/report/query`, body);
  }
}

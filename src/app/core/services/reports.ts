import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { IngestionResponseDto, ReportIngestionResult } from '../models/report.model';

// Combinaison validée par benchmark (cf. BenchmarkService) : TABLE_AWARE / 800 tokens / overlap
// 0.15. Fixée ici plutôt que laissée au choix de l'utilisateur final ; seul l'admin (upload-panel,
// ingestion des textes réglementaires) garde la main sur la stratégie de chunking.
const REPORT_CHUNKING_STRATEGY = 'TABLE_AWARE';
const REPORT_CHUNKING_MAX_TOKENS = 800;
const REPORT_CHUNKING_OVERLAP_RATIO = 0.15;

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  ingestReport(file: File): Observable<ReportIngestionResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('strategy', REPORT_CHUNKING_STRATEGY);
    formData.append('maxTokens', String(REPORT_CHUNKING_MAX_TOKENS));
    formData.append('overlapRatio', String(REPORT_CHUNKING_OVERLAP_RATIO));

    return this.http
      .post<IngestionResponseDto>(`${this.baseUrl}/report/ingest`, formData)
      .pipe(map(toReportIngestionResult));
  }
}

function toReportIngestionResult(dto: IngestionResponseDto): ReportIngestionResult {
  return { success: dto.success, durationMs: dto.timestamp, error: dto.error };
}

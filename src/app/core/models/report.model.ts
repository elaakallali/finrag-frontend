// Forme brute renvoyée par POST /api/report/ingest. Contrairement à /regulation/ingest,
// cette réponse est synchrone (pas de jobId à poller) : l'ingestion est terminée quand elle arrive.
export interface IngestionResponseDto {
  success: boolean;
  timestamp: number; // durée de l'ingestion en ms, malgré le nom côté backend
  error: string | null;
}

export interface ReportIngestionResult {
  success: boolean;
  durationMs: number;
  error: string | null;
}

export const CHUNKING_STRATEGIES = [
  'MIXED',
  'MARKDOWN',
  'SEMANTIC',
  'SIZE_BASED',
  'TABLE_AWARE',
  'TABLE_AWARE_V2',
  'RECURSIVE',
  'HEADING'
] as const;

export type ChunkingStrategy = typeof CHUNKING_STRATEGIES[number];

export const REGULATION_TYPES = ['MiFID II', 'CRR', 'IFRS', 'PCG'] as const;

export type RegulationType = typeof REGULATION_TYPES[number];

export type IngestionStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'FAILED';

export interface IngestedDocument {
  id: number;
  fileName: string;
  regulationType: RegulationType;
  strategy: ChunkingStrategy;
  status: IngestionStatus;
  chunkCount: number | null;
  indexedAt: string | null;
}

// Forme brute renvoyée par GET /api/regulation/history (table Postgres ingestion_history)
export interface IngestionHistoryEntry {
  id: number;
  documentName: string;
  regulationType: string | null;
  strategy: string | null;
  chunkCount: number;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
}

// Forme brute paginée renvoyée par GET /api/regulation/history
export interface IngestionHistoryPageResponse {
  content: IngestionHistoryEntry[];
  totalElements: number;
  page: number;
  size: number;
}

export type SortDirection = 'asc' | 'desc';

// Doit correspondre aux clés acceptées par IngestionHistoryRepository.SORTABLE_COLUMNS côté backend
export type IngestionHistorySortField =
  | 'documentName'
  | 'regulationType'
  | 'strategy'
  | 'chunkCount'
  | 'success'
  | 'createdAt';

// Doit correspondre à com.talan.finrag.enums.IngestionStep côté backend
export type IngestionStep = 'QUEUED' | 'PARSING' | 'CHUNKING' | 'EMBEDDING' | 'STORING' | 'DONE';

// Renvoyé par POST /api/regulation/ingest : le job démarre en arrière-plan, l'ingestion elle-même
// se suit via GET /api/regulation/ingest/{jobId}/status
export interface IngestionJobCreated {
  jobId: string;
}

export interface IngestionJobStatus {
  jobId: string;
  documentName: string;
  step: IngestionStep;
  failed: boolean;
  errorMessage: string | null;
  historyId: number | null;
  updatedAt: string;
}

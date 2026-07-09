import type { ChunkingStrategy } from './chunking-strategies';

export type DocumentType = 'report' | 'regulation' | 'policy' | 'financial-statement';
export type { ChunkingStrategy } from './chunking-strategies';
export type IngestionStatus = 'processing' | 'indexed' | 'failed';

export interface DocumentIngestionRequest {
  file: File;
  chunkingStrategy: ChunkingStrategy;
  chunkSize: number;
}

export interface IngestionResponse {
  success: boolean;
  timestamp: number;
  error: string | null;
  id: string | null;
  document: string | null;
  totalChunks: number | null;
  documentType: string | null;
}

export interface DocumentSummary {
  id: string;
  filename: string;
  documentType: string;
  chunkingStrategy: string;
  chunkSize: number | null;
  chunkCount: number | null;
  status: IngestionStatus;
  uploadedAt: string;
  durationMs: number | null;
  errorMessage: string | null;
}

export interface DocumentRow {
  id: string;
  name: string;
  uploadDate: string;
}

// Reponse paginee du backend (3 documents par page)
export interface DocumentPage {
  content: DocumentSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

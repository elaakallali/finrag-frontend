export interface ReportSource {
  filename: string;
  section: string;
  score: number | null;
  store: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  time: string;
  sources?: ReportSource[];
}

export interface IngestionResponse {
  success: boolean;
  error: string | null;
  id: string | null;
  document: string | null;
  totalChunks: number | null;
}

export interface RagQueryResponse {
  answer: string;
  sources: ReportSource[];
  prompt: string;
}

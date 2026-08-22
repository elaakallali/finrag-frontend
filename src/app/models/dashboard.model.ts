export type DashboardPeriod = '7d' | '30d' | '90d';

export interface DashboardLastIngestion {
  filename: string;
  uploadedAt: string;
  status: string;
}

export interface DashboardMonthlyUpload {
  label: string;
  year: number;
  reports: number;
  regulations: number;
}

export interface DashboardActivityItem {
  id: string;
  title: string;
  status: string;
  currentStep: string | null;
  uploadedAt: string;
  tone: 'success' | 'primary' | 'teal' | 'danger';
}

export interface DashboardStats {
  lastUpdated: string;
  period: DashboardPeriod;
  totalDocuments: number;
  reportsCount: number;
  regulationsCount: number;
  totalChunks: number;
  embeddingsCount: number;
  totalDocumentsTrendPct: number | null;
  reportsTrendPct: number | null;
  regulationsTrendPct: number | null;
  chunksTrendPct: number | null;
  embeddingsSynced: boolean;
  lastIngestion: DashboardLastIngestion | null;
  uploadsByMonth: DashboardMonthlyUpload[];
  recentActivity: DashboardActivityItem[];
}

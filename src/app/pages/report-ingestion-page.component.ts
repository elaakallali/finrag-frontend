import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { FileUploadModule } from 'primeng/fileupload';

import { ApiService, IngestionProgressResponse, IngestionStatusResponse } from '../core/api.service';
import { IngestionProgressWebSocketService } from '../core/ingestion-progress-websocket.service';

@Component({
  selector: 'app-report-ingestion-page',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    InputNumberModule,
    MessageModule,
    TagModule,
    ProgressSpinnerModule,
    DividerModule,
    FileUploadModule
  ],
  templateUrl: './report-ingestion-page.component.html',
  styleUrl: './report-ingestion-page.component.scss'
})
export class ReportIngestionPageComponent implements OnInit, OnDestroy {
  private static readonly STORAGE_KEY = 'finrag.report.ingestionJob';

  private readonly apiService = inject(ApiService);
  private readonly ingestionProgressWebSocketService = inject(IngestionProgressWebSocketService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private progressSubscription?: Subscription;

  protected readonly ingestionModes = [
    { label: 'Classic', value: 'classic' },
    { label: 'Dynamic', value: 'dynamic' }
  ];

  protected readonly classicStrategies = [
    { label: 'Semantic', value: 'SEMANTIC' },
    { label: 'Heading', value: 'HEADING' },
    { label: 'Recursive', value: 'RECURSIVE' },
    { label: 'Table aware', value: 'TABLE_AWARE' },
    { label: 'Mixed', value: 'MIXED' }
  ];

  protected readonly dynamicStrategies = [
    { label: 'Markdown', value: 'markdown' },
    { label: 'Semantic', value: 'semantic' },
    { label: 'Size Based', value: 'size-based' },
    { label: 'Table Aware', value: 'table-aware' }
  ];

  protected readonly stageTimeline = [
    { key: 'QUEUED', order: 1, label: 'Queued', description: 'The ingestion job was created and is waiting to start.' },
    { key: 'PARSING', order: 2, label: 'Parsing', description: 'The backend is reading and extracting the report content.' },
    { key: 'CHUNKING', order: 3, label: 'Chunking', description: 'The report content is being split into searchable chunks.' },
    { key: 'EMBEDDING', order: 4, label: 'Embedding', description: 'Each chunk is being transformed into vector embeddings.' },
    { key: 'STORING', order: 5, label: 'Storing', description: 'The vectors and metadata are being inserted into fin-report.' },
    { key: 'DONE', order: 6, label: 'Done', description: 'The report ingestion finished successfully.' }
  ] as const;

  protected selectedFile: File | null = null;
  protected selectedMode = 'dynamic';
  protected selectedStrategy = 'markdown';
  protected maxTokens = 500;
  protected overlapTokens = 50;
  protected loading = false;
  protected response: IngestionStatusResponse | null = null;
  protected progress: IngestionProgressResponse | null = null;
  protected currentJobId: string | null = null;
  protected errorMessage = '';
  protected currentDocumentName = '';

  ngOnInit(): void {
    this.resumeSavedJob();
  }

  protected onFileSelected(event: { files?: File[] }): void {
    this.selectedFile = event.files?.[0] ?? null;
  }

  protected onModeChange(mode: string): void {
    this.selectedMode = mode;
    this.selectedStrategy = mode === 'classic' ? 'SEMANTIC' : 'markdown';
  }

  protected get availableStrategies(): Array<{ label: string; value: string }> {
    return this.selectedMode === 'classic' ? this.classicStrategies : this.dynamicStrategies;
  }

  protected get canSubmit(): boolean {
    return !!this.selectedFile && !!this.selectedStrategy && !this.loading;
  }

  protected submit(): void {
    if (!this.selectedFile) {
      return;
    }

    this.loading = true;
    this.response = null;
    this.progress = null;
    this.currentJobId = null;
    this.errorMessage = '';
    this.currentDocumentName = this.selectedFile.name;
    this.changeDetectorRef.detectChanges();

    const request$ = this.selectedMode === 'classic'
      ? this.apiService.startReportIngestionAsync(this.selectedFile, this.selectedStrategy, this.maxTokens, this.overlapTokens)
      : this.apiService.startReportDynamicIngestionAsync(this.selectedFile, this.selectedStrategy, this.maxTokens, this.overlapTokens);

    firstValueFrom(request$).then((job) => {
      this.currentJobId = job.jobId;
      this.progress = {
        jobId: job.jobId,
        status: job.status,
        stage: 'QUEUED'
      };
      this.persistJob();
      this.subscribeToProgress(job.jobId);
    }).catch((error) => {
      this.loading = false;
      this.errorMessage = error?.error?.error || error?.message || 'Failed to ingest report.';
      this.clearSavedJob();
      this.changeDetectorRef.detectChanges();
    });
  }

  protected async stopIngestion(): Promise<void> {
    if (!this.currentJobId || !this.loading) {
      return;
    }

    try {
      await firstValueFrom(this.apiService.cancelReportIngestion(this.currentJobId));
      this.progress = {
        ...(this.progress ?? { jobId: this.currentJobId, documentName: this.currentDocumentName }),
        jobId: this.currentJobId,
        status: 'CANCELLED',
        stage: 'CANCELLED',
        error: 'Ingestion cancelled by user.'
      };
      this.loading = false;
      this.clearSavedJob();
      this.progressSubscription?.unsubscribe();
      this.changeDetectorRef.detectChanges();
    } catch (error: any) {
      this.errorMessage = error?.error?.error || error?.message || 'Failed to stop report ingestion.';
      this.changeDetectorRef.detectChanges();
    }
  }

  protected get progressStageLabel(): string {
    switch (this.progress?.stage) {
      case 'QUEUED':
        return 'Job queued';
      case 'PARSING':
        return 'Parsing document';
      case 'CHUNKING':
        return 'Generating chunks';
      case 'EMBEDDING':
        return 'Embedding chunks';
      case 'STORING':
        return 'Storing in vector database';
      case 'DONE':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'FAILED':
        return 'Failed';
      default:
        return 'Preparing ingestion';
    }
  }

  protected get selectedModeLabel(): string {
    return this.ingestionModes.find((mode) => mode.value === this.selectedMode)?.label ?? '-';
  }

  protected get selectedStrategyLabel(): string {
    return this.availableStrategies.find((strategy) => strategy.value === this.selectedStrategy)?.label ?? '-';
  }

  protected isStageDone(stageKey: string): boolean {
    const currentIndex = this.stageTimeline.findIndex((stage) => stage.key === this.progress?.stage);
    const stageIndex = this.stageTimeline.findIndex((stage) => stage.key === stageKey);
    return currentIndex > stageIndex;
  }

  protected isStageActive(stageKey: string): boolean {
    return this.progress?.stage === stageKey;
  }

  ngOnDestroy(): void {
    this.progressSubscription?.unsubscribe();
  }

  private resumeSavedJob(): void {
    const savedJob = this.readSavedJob();
    if (!savedJob?.jobId) {
      return;
    }

    this.selectedMode = savedJob.mode ?? this.selectedMode;
    this.selectedStrategy = savedJob.strategy ?? this.selectedStrategy;
    this.maxTokens = savedJob.maxTokens ?? this.maxTokens;
    this.overlapTokens = savedJob.overlapTokens ?? this.overlapTokens;
    this.currentDocumentName = savedJob.documentName ?? '';
    this.currentJobId = savedJob.jobId;
    this.loading = true;
    this.progress = {
      jobId: savedJob.jobId,
      status: savedJob.status ?? 'QUEUED',
      stage: savedJob.stage ?? 'QUEUED',
      documentName: savedJob.documentName ?? undefined,
      chunkCount: savedJob.chunkCount ?? null,
      timestamp: savedJob.timestamp ?? null,
      error: savedJob.error ?? null,
      success: savedJob.success ?? null
    };

    this.subscribeToProgress(savedJob.jobId);
  }

  private subscribeToProgress(jobId: string): void {
    this.progressSubscription?.unsubscribe();

    this.progressSubscription = this.ingestionProgressWebSocketService.connect(jobId)
      .subscribe({
        next: (progress) => {
          this.progress = progress;
          this.currentDocumentName = progress.documentName || this.currentDocumentName;
          this.persistJob();

          if (progress.status === 'DONE') {
            this.response = {
              success: progress.success ?? true,
              timestamp: progress.timestamp ?? null,
              error: progress.error ?? null,
              chunkCount: progress.chunkCount ?? 0
            };
            this.loading = false;
            this.progressSubscription?.unsubscribe();
            this.clearSavedJob();
          } else if (progress.status === 'FAILED') {
            this.errorMessage = progress.error || 'Failed to ingest report.';
            this.loading = false;
            this.progressSubscription?.unsubscribe();
            this.clearSavedJob();
          } else if (progress.status === 'CANCELLED') {
            this.loading = false;
            this.progressSubscription?.unsubscribe();
            this.clearSavedJob();
          }

          this.changeDetectorRef.detectChanges();
        },
        error: (error: any) => {
          this.errorMessage = error?.error?.error || error?.message || 'WebSocket connection lost while tracking ingestion progress.';
          this.loading = false;
          this.progressSubscription?.unsubscribe();
          this.clearSavedJob();
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  private persistJob(): void {
    if (!this.currentJobId) {
      return;
    }

    const payload = {
      jobId: this.currentJobId,
      documentName: this.currentDocumentName,
      mode: this.selectedMode,
      strategy: this.selectedStrategy,
      maxTokens: this.maxTokens,
      overlapTokens: this.overlapTokens,
      status: this.progress?.status ?? 'QUEUED',
      stage: this.progress?.stage ?? 'QUEUED',
      chunkCount: this.progress?.chunkCount ?? null,
      timestamp: this.progress?.timestamp ?? null,
      error: this.progress?.error ?? null,
      success: this.progress?.success ?? null
    };

    localStorage.setItem(ReportIngestionPageComponent.STORAGE_KEY, JSON.stringify(payload));
  }

  private clearSavedJob(): void {
    localStorage.removeItem(ReportIngestionPageComponent.STORAGE_KEY);
  }

  private readSavedJob(): {
    jobId: string;
    documentName?: string;
    mode?: string;
    strategy?: string;
    maxTokens?: number;
    overlapTokens?: number;
    status?: string;
    stage?: string;
    chunkCount?: number | null;
    timestamp?: number | null;
    error?: string | null;
    success?: boolean | null;
  } | null {
    const raw = localStorage.getItem(ReportIngestionPageComponent.STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      this.clearSavedJob();
      return null;
    }
  }
}

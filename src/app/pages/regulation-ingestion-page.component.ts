import { ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, firstValueFrom, interval, startWith, switchMap } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';

import { ApiService, IngestionJobResponse, IngestionProgressResponse, IngestionStatusResponse } from '../core/api.service';
import { RegulationHistoryRefreshService } from '../core/regulation-history-refresh.service';

@Component({
  selector: 'app-regulation-ingestion-page',
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    MessageModule,
    TagModule,
    ProgressSpinnerModule,
    DividerModule
  ],
  template: `
    <section class="page-header">
      <p class="eyebrow">Administration</p>
      <h1>Regulation ingestion</h1>
      <p>Upload regulatory reference documents and add them to the knowledge base.</p>
    </section>

    <p-card header="Upload regulation document">
      <div class="field">
        <label for="reg-file">Document</label>
        <input id="reg-file" type="file" accept=".pdf,.doc,.docx,.xlsx,.xls" (change)="onFileSelected($event)" />
      </div>

      <div class="field">
        <label for="ingestion-mode">Ingestion mode</label>
        <select id="ingestion-mode" [value]="selectedMode" (change)="onModeChange(($any($event.target)).value)">
          <option value="">Choose a mode</option>
          <option *ngFor="let mode of ingestionModes" [value]="mode.value">{{ mode.label }}</option>
        </select>
      </div>

      <div class="field">
        <label for="chunking-strategy">Chunking method</label>
        <select
          id="chunking-strategy"
          [value]="selectedStrategy"
          [disabled]="!selectedMode"
          (change)="selectedStrategy = ($any($event.target)).value"
        >
          <option value="">Choose a chunking method</option>
          <option *ngFor="let strategy of availableStrategies" [value]="strategy.value">
            {{ strategy.label }}
          </option>
        </select>
      </div>

      <div class="actions">
        <p-button
          label="Start ingestion"
          icon="pi pi-book"
          [loading]="loading"
          [disabled]="!canSubmit"
          (onClick)="submit()"
        />
        <p-tag *ngIf="selectedFile" [value]="selectedFile.name" severity="contrast" />
      </div>
    </p-card>

    <p-card *ngIf="loading" header="Ingestion in progress">
      <div class="progress-panel">
        <p-progressSpinner
          strokeWidth="6"
          animationDuration=".8s"
          [style]="{ width: '72px', height: '72px' }"
        />
        <div>
          <h3>{{ progressStageLabel }}</h3>
          <p *ngIf="progress?.documentName">{{ progress.documentName }}</p>
          <p *ngIf="currentJobId" class="progress-meta">Job ID: {{ currentJobId }}</p>
        </div>
      </div>

      <div class="stage-timeline">
        <div
          *ngFor="let stage of stageTimeline"
          class="stage-item"
          [class.stage-done]="isStageDone(stage.key)"
          [class.stage-active]="isStageActive(stage.key)"
        >
          <div class="stage-marker">
            <span *ngIf="isStageDone(stage.key)">✓</span>
            <span *ngIf="!isStageDone(stage.key)">{{ stage.order }}</span>
          </div>
          <div class="stage-copy">
            <strong>{{ stage.label }}</strong>
            <span>{{ stage.description }}</span>
          </div>
        </div>
      </div>
    </p-card>

    <p-card *ngIf="response && !loading" header="Ingestion completed">
      <p-message severity="success" text="The document was indexed successfully." />
      <p-divider />

      <div class="result-grid">
        <div class="result-item">
          <span class="result-label">Document</span>
          <strong>{{ selectedFile?.name }}</strong>
        </div>
        <div class="result-item">
          <span class="result-label">Chunks generated</span>
          <strong>{{ response.chunkCount ?? 0 }}</strong>
        </div>
        <div class="result-item">
          <span class="result-label">Mode</span>
          <strong>{{ selectedModeLabel }}</strong>
        </div>
        <div class="result-item">
          <span class="result-label">Chunking method</span>
          <strong>{{ selectedStrategyLabel }}</strong>
        </div>
        <div class="result-item">
          <span class="result-label">Status</span>
          <strong>{{ response.success ? 'OK' : 'FAILED' }}</strong>
        </div>
      </div>
    </p-card>

    <p-card *ngIf="errorMessage && !loading" header="Ingestion failed">
      <p-message severity="error" [text]="errorMessage" />
    </p-card>
  `,
  styles: [`
    :host {
      display: grid;
      gap: 1.5rem;
    }

    .field {
      display: grid;
      gap: 0.55rem;
      margin-bottom: 1rem;
    }

    .field label {
      font-weight: 600;
      color: #12373e;
    }

    .field input,
    .field select {
      width: 100%;
      max-width: 28rem;
      padding: 0.85rem 1rem;
      border-radius: 0.9rem;
      border: 1px solid rgba(18, 55, 62, 0.14);
      background: rgba(255, 255, 255, 0.92);
      color: #12373e;
      font: inherit;
    }

    .field select:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.85rem;
      align-items: center;
      margin-top: 1rem;
    }

    .progress-panel {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      min-height: 8rem;
    }

    .progress-panel h3 {
      margin: 0 0 0.35rem;
      color: #12373e;
      font-size: 1.2rem;
    }

    .progress-panel p {
      margin: 0;
      color: #5b7b82;
      line-height: 1.6;
    }

    .progress-meta {
      margin-top: 0.4rem !important;
      font-size: 0.88rem;
      color: #7d9499 !important;
    }

    .stage-timeline {
      margin-top: 1.5rem;
      display: grid;
      gap: 0.9rem;
    }

    .stage-item {
      display: grid;
      grid-template-columns: 3rem 1fr;
      gap: 1rem;
      align-items: start;
      padding: 0.95rem 1rem;
      border-radius: 1rem;
      border: 1px solid rgba(18, 55, 62, 0.1);
      background: rgba(255, 255, 255, 0.72);
      transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
    }

    .stage-active {
      border-color: rgba(33, 155, 122, 0.4);
      background: rgba(233, 248, 242, 0.95);
      transform: translateY(-1px);
    }

    .stage-done {
      border-color: rgba(33, 155, 122, 0.18);
      background: rgba(244, 250, 247, 0.95);
    }

    .stage-marker {
      width: 2.4rem;
      height: 2.4rem;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.95rem;
      color: #5f757b;
      background: rgba(18, 55, 62, 0.07);
      border: 1px solid rgba(18, 55, 62, 0.08);
    }

    .stage-done .stage-marker,
    .stage-active .stage-marker {
      color: #fff;
      background: #23a177;
      border-color: #23a177;
    }

    .stage-copy {
      display: grid;
      gap: 0.25rem;
    }

    .stage-copy strong {
      color: #12373e;
      font-size: 1rem;
    }

    .stage-copy span {
      color: #5b7b82;
      line-height: 1.5;
      font-size: 0.95rem;
    }

    .result-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 1rem;
    }

    .result-item {
      display: grid;
      gap: 0.35rem;
      padding: 1rem;
      border-radius: 1rem;
      background: rgba(248, 244, 235, 0.9);
      border: 1px solid rgba(12, 52, 61, 0.08);
    }

    .result-label {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #6c858b;
    }

    .result-item strong {
      color: #12373e;
      font-size: 1.05rem;
      word-break: break-word;
    }

    @media (max-width: 840px) {
      .progress-panel,
      .result-grid {
        grid-template-columns: 1fr;
      }

      .progress-panel {
        align-items: start;
        flex-direction: column;
      }
    }
  `]
})
export class RegulationIngestionPageComponent implements OnDestroy {
  private readonly apiService = inject(ApiService);
  private readonly historyRefreshService = inject(RegulationHistoryRefreshService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private pollingSubscription?: Subscription;

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
    { label: 'Table aware', value: 'table-aware' },
    { label: 'Size based', value: 'size-based' }
  ];

  protected selectedFile: File | null = null;
  protected loading = false;
  protected response: IngestionStatusResponse | null = null;
  protected progress: IngestionProgressResponse | null = null;
  protected errorMessage = '';
  protected selectedMode = '';
  protected selectedStrategy = '';
  protected currentJobId: string | null = null;

  protected readonly stageTimeline = [
    { key: 'QUEUED', order: 1, label: 'Queued', description: 'The ingestion job was created and is waiting to start.' },
    { key: 'PARSING', order: 2, label: 'Parsing', description: 'The backend is reading and extracting the document content.' },
    { key: 'CHUNKING', order: 3, label: 'Chunking', description: 'The extracted content is being split into searchable chunks.' },
    { key: 'EMBEDDING', order: 4, label: 'Embedding', description: 'Each chunk is being transformed into vector embeddings.' },
    { key: 'STORING', order: 5, label: 'Storing', description: 'The vectors and metadata are being inserted into the store.' },
    { key: 'DONE', order: 6, label: 'Done', description: 'The ingestion finished successfully and is ready in history.' }
  ] as const;

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  protected onModeChange(mode: string): void {
    this.selectedMode = mode;
    this.selectedStrategy = '';
  }

  protected get availableStrategies(): Array<{ label: string; value: string }> {
    if (this.selectedMode === 'classic') {
      return this.classicStrategies;
    }

    if (this.selectedMode === 'dynamic') {
      return this.dynamicStrategies;
    }

    return [];
  }

  protected get canSubmit(): boolean {
    return !!this.selectedFile && !!this.selectedMode && !!this.selectedStrategy && !this.loading;
  }

  protected get selectedModeLabel(): string {
    return this.ingestionModes.find((mode) => mode.value === this.selectedMode)?.label ?? '-';
  }

  protected get selectedStrategyLabel(): string {
    return this.availableStrategies.find((strategy) => strategy.value === this.selectedStrategy)?.label ?? '-';
  }

  protected async submit(): Promise<void> {
    if (!this.selectedFile || !this.selectedMode || !this.selectedStrategy) {
      return;
    }

    this.loading = true;
    this.response = null;
    this.progress = null;
    this.errorMessage = '';
    this.currentJobId = null;
    this.changeDetectorRef.detectChanges();

    const request$ = this.selectedMode === 'dynamic'
      ? this.apiService.startRegulationDynamicIngestionAsync(this.selectedFile, this.selectedStrategy)
      : this.apiService.startRegulationIngestionAsync(this.selectedFile, this.selectedStrategy);

    try {
      const job = await firstValueFrom(request$);
      this.currentJobId = job.jobId;
      this.progress = {
        jobId: job.jobId,
        status: job.status,
        stage: 'QUEUED'
      };
      this.startPolling(job);
    } catch (error: any) {
      this.errorMessage = error?.error?.error || error?.message || 'Failed to ingest regulation.';
      this.loading = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe();
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
      case 'FAILED':
        return 'Failed';
      default:
        return 'Preparing ingestion';
    }
  }

  protected isStageDone(stageKey: string): boolean {
    const currentIndex = this.stageTimeline.findIndex((stage) => stage.key === this.progress?.stage);
    const stageIndex = this.stageTimeline.findIndex((stage) => stage.key === stageKey);
    return currentIndex > stageIndex;
  }

  protected isStageActive(stageKey: string): boolean {
    return this.progress?.stage === stageKey;
  }

  private startPolling(job: IngestionJobResponse): void {
    this.pollingSubscription?.unsubscribe();

    this.pollingSubscription = interval(1500)
      .pipe(
        startWith(0),
        switchMap(() => this.apiService.getRegulationIngestionProgress(job.jobId))
      )
      .subscribe({
        next: (progress) => {
          this.progress = progress;

          if (progress.status === 'DONE') {
            this.response = {
              success: progress.success ?? true,
              timestamp: progress.timestamp ?? null,
              error: progress.error ?? null,
              chunkCount: progress.chunkCount ?? 0
            };
            this.loading = false;
            this.historyRefreshService.notify();
            this.pollingSubscription?.unsubscribe();
          } else if (progress.status === 'FAILED') {
            this.errorMessage = progress.error || 'Failed to ingest regulation.';
            this.loading = false;
            this.pollingSubscription?.unsubscribe();
          }

          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || error?.message || 'Failed to fetch ingestion progress.';
          this.loading = false;
          this.changeDetectorRef.detectChanges();
          this.pollingSubscription?.unsubscribe();
        }
      });
  }
}

import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, OnDestroy, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { SelectModule } from 'primeng/select';
import type { FileSelectEvent } from 'primeng/types/fileupload';
import { Subscription, takeWhile } from 'rxjs';

import {
  CHUNKING_STRATEGIES,
  ChunkingStrategy,
  IngestionJobStatus,
  IngestionStep,
  REGULATION_TYPES,
  RegulationType
} from '../../../../core/models/document.model';
import { IngestionService } from '../../../../core/services/ingestion';

export interface UploadOutcome {
  file: File;
  regulationType: RegulationType;
  strategy: ChunkingStrategy;
}

export type StepState = 'done' | 'active' | 'failed' | 'pending';

interface StepDefinition {
  key: IngestionStep;
  label: string;
  description: string;
}

// Ordre réel des étapes remontées par le backend (DocumentService.ingestRegulationFromStoredFile
// + DocumentController.runIngestion) — reflète le pipeline effectif, pas une simulation.
const STEPS: StepDefinition[] = [
  { key: 'QUEUED', label: 'Queued', description: "Le job d'ingestion a été créé et est en attente." },
  { key: 'PARSING', label: 'Parsing', description: 'Le backend lit et extrait le contenu du document.' },
  { key: 'CHUNKING', label: 'Chunking', description: 'Le contenu extrait est découpé en chunks exploitables.' },
  { key: 'EMBEDDING', label: 'Embedding', description: 'Chaque chunk est transformé en vecteur et indexé.' },
  { key: 'STORING', label: 'Storing', description: "L'historique d'ingestion est enregistré." },
  { key: 'DONE', label: 'Done', description: "L'ingestion est terminée et disponible dans l'historique." }
];

const STEP_ORDER: IngestionStep[] = STEPS.map((s) => s.key);

@Component({
  selector: 'app-upload-panel',
  imports: [FormsModule, ButtonModule, FileUploadModule, SelectModule],
  templateUrl: './upload-panel.html',
  styleUrl: './upload-panel.scss'
})
export class UploadPanel implements OnDestroy {
  private readonly ingestionService = inject(IngestionService);
  private statusSubscription: Subscription | null = null;

  readonly regulationTypes = REGULATION_TYPES;
  readonly strategies = CHUNKING_STRATEGIES;
  readonly steps = STEPS;

  readonly selectedFile = signal<File | null>(null);
  readonly regulationType = signal<RegulationType>('MiFID II');
  readonly strategy = signal<ChunkingStrategy>('MIXED');
  readonly isUploading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly jobStatus = signal<IngestionJobStatus | null>(null);

  @Output() readonly uploadStarted = new EventEmitter<UploadOutcome>();
  @Output() readonly uploadCompleted = new EventEmitter<UploadOutcome & { response: IngestionJobStatus }>();
  @Output() readonly uploadFailed = new EventEmitter<UploadOutcome & { error: unknown }>();

  ngOnDestroy(): void {
    this.stopWatching();
  }

  onFileSelect(event: FileSelectEvent): void {
    this.selectedFile.set(event.currentFiles[0] ?? null);
    this.errorMessage.set(null);
  }

  onFileRemove(): void {
    this.selectedFile.set(null);
  }

  submit(): void {
    const file = this.selectedFile();
    if (!file) {
      return;
    }

    const outcome: UploadOutcome = {
      file,
      regulationType: this.regulationType(),
      strategy: this.strategy()
    };

    this.isUploading.set(true);
    this.errorMessage.set(null);
    this.jobStatus.set(null);
    this.uploadStarted.emit(outcome);

        this.ingestionService.ingestRegulation(file, outcome.regulationType, outcome.strategy).subscribe({
      next: ({ jobId }) => {
        // Affiche tout de suite la liste des étapes (QUEUED en cours), sans attendre le premier
        // message du serveur : on sait que le job a démarré dès qu'on a le jobId.
        this.jobStatus.set({
          jobId,
          documentName: file.name,
          step: 'QUEUED',
          failed: false,
          errorMessage: null,
          historyId: null,
          updatedAt: new Date().toISOString()
        });
        this.watchStatus(jobId, outcome);
      },
      
      error: (error: unknown) => {
        this.isUploading.set(false);
        this.errorMessage.set(this.resolveErrorMessage(error));
        this.uploadFailed.emit({ ...outcome, error });
      }
    });
  }

  stepState(step: IngestionStep): StepState {
    const status = this.jobStatus();
    if (!status) {
      return 'pending';
    }

    const currentIndex = STEP_ORDER.indexOf(status.step);
    const stepIndex = STEP_ORDER.indexOf(step);

    if (stepIndex < currentIndex) {
      return 'done';
    }
    if (stepIndex > currentIndex) {
      return 'pending';
    }
    // stepIndex === currentIndex : c'est l'étape en cours (ou l'échec/la fin s'y trouve).
    if (status.failed) {
      return 'failed';
    }
    return status.step === 'DONE' ? 'done' : 'active';
  }

  // Le backend pousse chaque changement d'état via WebSocket (voir IngestionService.watchJobStatus) :
  // plus besoin de redemander l'état toutes les secondes, on est notifié dès qu'il change vraiment.
  private watchStatus(jobId: string, outcome: UploadOutcome): void {
    this.stopWatching();

    this.statusSubscription = this.ingestionService
      .watchJobStatus(jobId)
      .pipe(takeWhile((status) => status.step !== 'DONE' && !status.failed, true))
      .subscribe({
        next: (status) => {
          this.jobStatus.set(status);

          if (status.step === 'DONE') {
            this.isUploading.set(false);
            this.selectedFile.set(null);
            this.uploadCompleted.emit({ ...outcome, response: status });
          } else if (status.failed) {
            this.isUploading.set(false);
            this.uploadFailed.emit({ ...outcome, error: status.errorMessage });
          }
        },
        error: (error: unknown) => {
          this.isUploading.set(false);
          this.errorMessage.set(this.resolveErrorMessage(error));
          this.uploadFailed.emit({ ...outcome, error });
        }
      });
  }

  private stopWatching(): void {
    if (this.statusSubscription !== null) {
      this.statusSubscription.unsubscribe();
      this.statusSubscription = null;
    }
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return "Impossible de contacter le backend. Vérifiez qu'il est démarré sur le port 8081.";
      }
    }
    return "L'ingestion a échoué.";
  }
}

import { Component, ElementRef, OnDestroy, OnInit, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DocumentService } from '../../../core/services/document.service';
import { IngestionSocketService } from '../../../core/services/ingestion-socket.service';
import {
  CHUNKING_STRATEGIES,
  ChunkingStrategy,
  findChunkingStrategy
} from '../../../models/chunking-strategies';
import { DocumentIngestionRequest, IngestionStep } from '../../../models/document.model';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule],
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.css'
})
export class DocumentUploadComponent implements OnInit, OnDestroy {
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private readonly documentService = inject(DocumentService);
  private readonly ingestionSocket = inject(IngestionSocketService);
  private readonly router = inject(Router);

  readonly maxFileSizeMb = 100;
  readonly chunkingStrategies = CHUNKING_STRATEGIES;

  /** Étapes chargées depuis le backend. */
  readonly ingestionSteps = signal<IngestionStep[]>([]);

  chunkingStrategy: ChunkingStrategy = 'table-aware';
  chunkSize = 512;

  readonly selectedFile = signal<File | null>(null);
  readonly isDragging = signal(false);
  readonly uploadError = signal<string | null>(null);
  readonly isUploading = signal(false);
  readonly currentStepIndex = signal(0);

  /** Abonnement WebSocket a /topic/ingestion/{id}. */
  private progressSub: Subscription | null = null;

  ngOnInit(): void {
    this.documentService.getIngestionSteps().subscribe({
      next: (steps) => this.ingestionSteps.set(steps),
      error: () => this.uploadError.set('Impossible de charger les étapes d\'ingestion.')
    });
  }

  ngOnDestroy(): void {
    this.stopWatching();
  }

  usesTokenBudget(): boolean {
    return findChunkingStrategy(this.chunkingStrategy).usesTokenBudget;
  }

  computedOverlap(): number {
    return this.documentService.computeOverlap(this.chunkSize);
  }

  stepStatus(index: number): 'done' | 'active' | 'pending' {
    const current = this.currentStepIndex();
    if (index < current) {
      return 'done';
    }
    if (index === current) {
      return 'active';
    }
    return 'pending';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);

    const file = event.dataTransfer?.files.item(0);
    if (file) {
      this.setFile(file);
    }
  }

  openFilePicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (file) {
      this.setFile(file);
    }
    input.value = '';
  }

  startIngestion(): void {
    const file = this.selectedFile();
    if (!file) {
      this.uploadError.set('Please select a PDF file to upload.');
      return;
    }

    const request: DocumentIngestionRequest = {
      file,
      chunkingStrategy: this.chunkingStrategy,
      chunkSize: this.chunkSize
    };

    this.uploadError.set(null);
    this.isUploading.set(true);
    this.currentStepIndex.set(0);

    // 1) Demarre l'ingestion → le backend renvoie l'id tout de suite
    this.documentService.ingestDocument(request).subscribe({
      next: (response) => {
        if (!response.id) {
          this.isUploading.set(false);
          this.uploadError.set(response.error ?? 'Ingestion failed.');
          return;
        }
        // 2) WebSocket : snapshot a l'abonnement + updates suivantes
        this.watchProgress(response.id);
      },
      error: (error: { error?: { error?: string }; message?: string }) => {
        this.isUploading.set(false);
        this.uploadError.set(
          error.error?.error ?? error.message ?? 'Unable to reach the ingestion service.'
        );
      }
    });
  }

  private watchProgress(id: string): void {
    this.stopWatching();
    this.progressSub = this.ingestionSocket.watch(id).subscribe({
      next: (progress) => {
        const steps = this.ingestionSteps();
        const idx = steps.findIndex((s) => s.key === progress.currentStep);
        if (idx >= 0) {
          this.currentStepIndex.set(idx);
        }

        if (progress.status === 'INDEXED') {
          this.stopWatching();
          this.currentStepIndex.set(Math.max(0, steps.length - 1));
          this.isUploading.set(false);
          void this.router.navigate(['/admin/document-history']);
        }

        if (progress.status === 'FAILED') {
          this.stopWatching();
          this.isUploading.set(false);
          this.uploadError.set(progress.errorMessage ?? 'Ingestion failed.');
        }
      },
      error: () => {
        this.stopWatching();
        this.isUploading.set(false);
        this.uploadError.set('Impossible de suivre le statut d\'ingestion (WebSocket).');
      }
    });
  }

  private stopWatching(): void {
    this.progressSub?.unsubscribe();
    this.progressSub = null;
  }

  private setFile(file: File): void {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.uploadError.set('Only PDF files are supported.');
      this.selectedFile.set(null);
      return;
    }

    if (file.size > this.maxFileSizeMb * 1024 * 1024) {
      this.uploadError.set(`File size must not exceed ${this.maxFileSizeMb} MB.`);
      this.selectedFile.set(null);
      return;
    }

    this.uploadError.set(null);
    this.selectedFile.set(file);
  }
}

import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DocumentService } from '../../../core/services/document.service';
import {
  CHUNKING_STRATEGIES,
  ChunkingStrategy,
  findChunkingStrategy
} from '../../../models/chunking-strategies';
import { DocumentIngestionRequest } from '../../../models/document.model';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule],
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.css'
})
export class DocumentUploadComponent {
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private readonly documentService = inject(DocumentService);
  private readonly router = inject(Router);

  readonly maxFileSizeMb = 100;
  readonly chunkingStrategies = CHUNKING_STRATEGIES;

  chunkingStrategy: ChunkingStrategy = 'mixed';
  chunkSize = 512;

  readonly selectedFile = signal<File | null>(null);
  readonly isDragging = signal(false);
  readonly uploadError = signal<string | null>(null);
  readonly isUploading = signal(false);

  usesTokenBudget(): boolean {
    return findChunkingStrategy(this.chunkingStrategy).usesTokenBudget;
  }

  computedOverlap(): number {
    return this.documentService.computeOverlap(this.chunkSize);
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

    this.documentService.ingestDocument(request).subscribe({
      next: (response) => {
        this.isUploading.set(false);

        if (!response.success) {
          this.uploadError.set(response.error ?? 'Ingestion failed.');
          return;
        }

        void this.router.navigate(['/admin/document-history']);
      },
      error: (error: { error?: { error?: string }; message?: string }) => {
        this.isUploading.set(false);
        this.uploadError.set(
          error.error?.error ?? error.message ?? 'Unable to reach the ingestion service.'
        );
      }
    });
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

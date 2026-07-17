import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import type { FileSelectEvent } from 'primeng/types/fileupload';

import { ReportIngestionResult } from '../../../../core/models/report.model';
import { ReportsService } from '../../../../core/services/reports';

@Component({
  selector: 'app-upload-report-panel',
  imports: [FormsModule, ButtonModule, FileUploadModule],
  templateUrl: './upload-report-panel.html',
  styleUrl: './upload-report-panel.scss'
})
export class UploadReportPanel {
  private readonly reportsService = inject(ReportsService);

  readonly selectedFile = signal<File | null>(null);
  readonly isUploading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly result = signal<ReportIngestionResult | null>(null);

  @Output() readonly uploadCompleted = new EventEmitter<ReportIngestionResult>();

  onFileSelect(event: FileSelectEvent): void {
    this.selectedFile.set(event.currentFiles[0] ?? null);
    this.errorMessage.set(null);
    this.result.set(null);
  }

  onFileRemove(): void {
    this.selectedFile.set(null);
  }

  submit(): void {
    const file = this.selectedFile();
    if (!file) {
      return;
    }

    this.isUploading.set(true);
    this.errorMessage.set(null);
    this.result.set(null);

    this.reportsService.ingestReport(file).subscribe({
      next: (result) => {
        this.isUploading.set(false);
        this.result.set(result);
        if (result.success) {
          this.selectedFile.set(null);
          this.uploadCompleted.emit(result);
        } else {
          this.errorMessage.set(result.error ?? "L'ingestion a échoué.");
        }
      },
      error: (error: unknown) => {
        this.isUploading.set(false);
        this.errorMessage.set(this.resolveErrorMessage(error));
      }
    });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return "Impossible de contacter le backend. Vérifiez qu'il est démarré sur le port 8081.";
    }
    return "L'ingestion a échoué.";
  }
}

import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TextareaModule } from 'primeng/textarea';

import { ApiService, ReportAnswerResponse } from '../core/api.service';

@Component({
  selector: 'app-search-lab-page',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    MessageModule,
    ProgressSpinnerModule,
    TextareaModule
  ],
  templateUrl: './search-lab-page.component.html',
  styleUrl: './search-lab-page.component.scss'
})
export class SearchLabPageComponent {
  private static readonly DEFAULT_TOP_K = 5;

  private readonly apiService = inject(ApiService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  protected query = '';
  protected loading = false;
  protected answerResponse: ReportAnswerResponse | null = null;
  protected errorMessage = '';

  protected search(): void {
    if (!this.query.trim()) {
      return;
    }

    this.loading = true;
    this.answerResponse = null;
    this.errorMessage = '';
    this.changeDetectorRef.detectChanges();

    this.apiService.askReport(this.query.trim(), SearchLabPageComponent.DEFAULT_TOP_K)
      .pipe(finalize(() => {
        this.loading = false;
        this.changeDetectorRef.detectChanges();
      }))
      .subscribe({
        next: (response) => {
          console.log('Report QA response received', response);
          this.answerResponse = response;
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          console.error('Report QA request failed', error);
          this.errorMessage = error?.error?.error || error?.message || 'Search failed.';
          this.changeDetectorRef.detectChanges();
        }
      });
  }
}

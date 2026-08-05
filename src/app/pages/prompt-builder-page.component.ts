import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TextareaModule } from 'primeng/textarea';

import { ApiService, PromptBuildResponse } from '../core/api.service';

@Component({
  selector: 'app-prompt-builder-page',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    MessageModule,
    ProgressSpinnerModule,
    TextareaModule
  ],
  templateUrl: './prompt-builder-page.component.html',
  styleUrl: './prompt-builder-page.component.scss'
})
export class PromptBuilderPageComponent {
  private readonly apiService = inject(ApiService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  protected query = '';
  protected loading = false;
  protected errorMessage = '';
  protected promptResponse: PromptBuildResponse | null = null;

  protected buildPrompt(): void {
    if (!this.query.trim()) {
      return;
    }

    this.loading = true;
    this.promptResponse = null;
    this.errorMessage = '';
    this.changeDetectorRef.detectChanges();

    this.apiService.buildMultiStorePrompt(this.query.trim(), 5)
      .pipe(finalize(() => {
        this.loading = false;
        this.changeDetectorRef.detectChanges();
      }))
      .subscribe({
        next: (response) => {
          this.promptResponse = response;
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          this.errorMessage = error?.error?.error || error?.message || 'Prompt generation failed.';
          this.changeDetectorRef.detectChanges();
        }
      });
  }
}

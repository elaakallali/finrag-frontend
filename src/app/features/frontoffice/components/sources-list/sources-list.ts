import { Component, computed, input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { QuerySource } from '../../../../core/models/query.model';

@Component({
  selector: 'app-sources-list',
  imports: [TableModule, TagModule],
  templateUrl: './sources-list.html',
  styleUrl: './sources-list.scss'
})
export class SourcesList {
  readonly sources = input<QuerySource[]>([]);

  readonly sortedSources = computed(() => [...this.sources()].sort((a, b) => b.score - a.score));

  scoreSeverity(score: number): 'success' | 'warn' | 'danger' {
    if (score >= 0.75) {
      return 'success';
    }
    if (score >= 0.5) {
      return 'warn';
    }
    return 'danger';
  }

  scoreLabel(score: number): string {
    return `${(score * 100).toFixed(0)} %`;
  }
}

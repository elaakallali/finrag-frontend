import { Routes } from '@angular/router';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { RegulationIngestionPageComponent } from './pages/regulation-ingestion-page.component';
import { RegulationHistoryPageComponent } from './pages/regulation-history-page.component';
import { PromptBuilderPageComponent } from './pages/prompt-builder-page.component';
import { ReportIngestionPageComponent } from './pages/report-ingestion-page.component';
import { SearchLabPageComponent } from './pages/search-lab-page.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardPageComponent
  },
  {
    path: 'user/report-ingestion',
    component: ReportIngestionPageComponent
  },
  {
    path: 'user/report-search',
    component: SearchLabPageComponent
  },
  {
    path: 'user/prompt-builder',
    component: PromptBuilderPageComponent
  },
  {
    path: 'admin/regulation-ingestion',
    component: RegulationIngestionPageComponent
  },
  {
    path: 'admin/regulation-history',
    component: RegulationHistoryPageComponent
  },
  {
    path: 'report-ingestion',
    redirectTo: 'user/report-ingestion',
    pathMatch: 'full'
  },
  {
    path: 'search-lab',
    redirectTo: 'user/report-search',
    pathMatch: 'full'
  },
  {
    path: 'prompt-builder',
    redirectTo: 'user/prompt-builder',
    pathMatch: 'full'
  },
  {
    path: 'regulation-ingestion',
    redirectTo: 'admin/regulation-ingestion',
    pathMatch: 'full'
  },
  {
    path: 'regulation-history',
    redirectTo: 'admin/regulation-history',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: ''
  }
];

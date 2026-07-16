import { Routes } from '@angular/router';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { PromptBuilderPageComponent } from './pages/prompt-builder-page.component';
import { ReportIngestionPageComponent } from './pages/report-ingestion-page.component';
import { SearchLabPageComponent } from './pages/search-lab-page.component';
import { RegulationIngestionPageComponent } from './pages/regulation-ingestion-page.component';
import { RegulationHistoryPageComponent } from './pages/regulation-history-page.component';

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
    path: '**',
    redirectTo: ''
  }
];

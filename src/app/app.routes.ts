import { Routes } from '@angular/router';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { RegulationIngestionPageComponent } from './pages/regulation-ingestion-page.component';
import { RegulationHistoryPageComponent } from './pages/regulation-history-page.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardPageComponent
  },
  {
    path: 'regulation-ingestion',
    component: RegulationIngestionPageComponent
  },
  {
    path: 'regulation-history',
    component: RegulationHistoryPageComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];

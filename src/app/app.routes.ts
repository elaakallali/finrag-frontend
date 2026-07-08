import { Routes } from '@angular/router';
import { IngestionPage } from './features/admin/ingestion-page/ingestion-page';

export const routes: Routes = [
  { path: '', redirectTo: 'admin/ingestion', pathMatch: 'full' },
  { path: 'admin/ingestion', component: IngestionPage }
];

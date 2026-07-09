import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DocumentHistoryComponent } from './pages/admin/document-history/document-history.component';
import { DocumentUploadComponent } from './pages/admin/document-upload/document-upload.component';
import { ReportQueryComponent } from './pages/admin/report-query/report-query.component';
import { UsersComponent } from './pages/admin/users/users.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'report-query', pathMatch: 'full' },
      { path: 'report-query', component: ReportQueryComponent },
      { path: 'admin/document-upload', component: DocumentUploadComponent },
      { path: 'admin/document-history', component: DocumentHistoryComponent },
      { path: 'admin/users', component: UsersComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];

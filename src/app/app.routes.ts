import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DocumentHistoryComponent } from './pages/admin/document-history/document-history.component';
import { DocumentUploadComponent } from './pages/admin/document-upload/document-upload.component';
import { ReportQueryComponent } from './pages/admin/report-query/report-query.component';
import { UsersComponent } from './pages/admin/users/users.component';
import { UserChatComponent } from './pages/user/user-chat/user-chat.component';
import { UserProfileComponent } from './pages/user/user-profile/user-profile.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'report-query', pathMatch: 'full' },
      { path: 'report-query', component: ReportQueryComponent },
      { path: 'user', component: UserChatComponent },
      { path: 'user/profile', component: UserProfileComponent },
      { path: 'admin/document-upload', component: DocumentUploadComponent },
      { path: 'admin/document-history', component: DocumentHistoryComponent },
      { path: 'admin/users', component: UsersComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];

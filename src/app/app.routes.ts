import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DocumentHistoryComponent } from './pages/admin/document-history/document-history.component';
import { DocumentUploadComponent } from './pages/admin/document-upload/document-upload.component';
import { ReportQueryComponent } from './pages/admin/report-query/report-query.component';
import { UsersComponent } from './pages/admin/users/users.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { UserChatComponent } from './pages/user/user-chat/user-chat.component';
import { UserProfileComponent } from './pages/user/user-profile/user-profile.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomeComponent
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'user', component: UserChatComponent },
      { path: 'user/profile', component: UserProfileComponent },
      {
        path: 'report-query',
        component: ReportQueryComponent,
        canActivate: [adminGuard]
      },
      {
        path: 'admin/document-upload',
        component: DocumentUploadComponent,
        canActivate: [adminGuard]
      },
      {
        path: 'admin/document-history',
        component: DocumentHistoryComponent,
        canActivate: [adminGuard]
      },
      {
        path: 'admin/users',
        component: UsersComponent,
        canActivate: [adminGuard]
      }
    ]
  },
  { path: '**', redirectTo: '' }
];

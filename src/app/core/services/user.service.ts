import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, CreateUserPayload, UserRole } from '../../models/user.model';

export interface UpdateUserPayload {
  firstname?: string;
  lastname?: string;
  role?: UserRole;
  active?: boolean;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  list(): Observable<AuthUser[]> {
    return this.http.get<AuthUser[]>(this.baseUrl);
  }

  create(payload: CreateUserPayload): Observable<AuthUser> {
    return this.http.post<AuthUser>(this.baseUrl, payload);
  }

  update(id: number, payload: UpdateUserPayload): Observable<AuthUser> {
    return this.http.put<AuthUser>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload
} from '../../models/user.model';

const TOKEN_KEY = 'finrag_token';
const USER_KEY = 'finrag_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly userSignal = signal<AuthUser | null>(this.readStoredUser());
  private readonly tokenSignal = signal<string | null>(this.readStoredToken());

  readonly currentUser = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(
    () => !!this.tokenSignal() && !!this.userSignal()
  );
  readonly isAdmin = computed(() => this.userSignal()?.role === 'ADMIN');

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, {
        email: payload.email.trim().toLowerCase(),
        password: payload.password
      })
      .pipe(tap((response) => this.persistSession(response)));
  }

  /** Crée le compte sans ouvrir de session (l'utilisateur doit ensuite se connecter). */
  register(payload: RegisterPayload): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.baseUrl}/register`, {
      firstname: payload.firstname.trim(),
      lastname: payload.lastname.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password
    });
  }

  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.baseUrl}/me`).pipe(
      tap((user) => {
        this.userSignal.set(user);
        this.writeStorage(USER_KEY, JSON.stringify(user));
      })
    );
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.removeStorage(TOKEN_KEY);
    this.removeStorage(USER_KEY);
    void this.router.navigateByUrl('/');
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  displayName(): string {
    const user = this.userSignal();
    if (!user) {
      return '';
    }
    return `${user.firstname} ${user.lastname}`.trim();
  }

  initials(): string {
    const user = this.userSignal();
    if (!user) {
      return '?';
    }
    return `${user.firstname.charAt(0)}${user.lastname.charAt(0)}`.toUpperCase();
  }

  private persistSession(response: AuthResponse): void {
    this.tokenSignal.set(response.token);
    this.userSignal.set(response.user);
    this.writeStorage(TOKEN_KEY, response.token);
    this.writeStorage(USER_KEY, JSON.stringify(response.user));
  }

  private readStoredToken(): string | null {
    return this.readStorage(TOKEN_KEY);
  }

  private readStoredUser(): AuthUser | null {
    const raw = this.readStorage(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  private readStorage(key: string): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore (SSR / mode privé)
    }
  }

  private removeStorage(key: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

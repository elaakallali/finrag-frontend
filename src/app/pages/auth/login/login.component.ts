import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { AuthResponse, AuthUser } from '../../../models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  password = '';
  firstname = '';
  lastname = '';
  mode: 'login' | 'register' = 'login';

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  ngOnInit(): void {
    const mode = this.route.snapshot.queryParamMap.get('mode');
    if (mode === 'register') {
      this.mode = 'register';
    }
  }

  submit(): void {
    this.error.set(null);
    this.success.set(null);

    const email = this.email.trim();
    const password = this.password;

    if (!email || !password) {
      this.error.set('Veuillez renseigner email et mot de passe.');
      return;
    }

    if (password.length < 6) {
      this.error.set('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (this.mode === 'register') {
      const firstname = this.firstname.trim();
      const lastname = this.lastname.trim();
      if (!firstname || !lastname) {
        this.error.set('Veuillez renseigner prénom et nom.');
        return;
      }
      this.doRegister(firstname, lastname, email, password);
      return;
    }

    this.doLogin(email, password);
  }

  switchMode(mode: 'login' | 'register'): void {
    this.mode = mode;
    this.error.set(null);
    this.success.set(null);
  }

  private doLogin(email: string, password: string): void {
    this.loading.set(true);
    this.auth
      .login({ email, password })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: AuthResponse) => {
          const target = response.user.role === 'ADMIN' ? '/report-query' : '/user';
          void this.router.navigateByUrl(target);
        },
        error: (err: unknown) => {
          this.error.set(this.extractError(err, 'Email ou mot de passe incorrect.'));
        }
      });
  }

  private doRegister(
    firstname: string,
    lastname: string,
    email: string,
    password: string
  ): void {
    this.loading.set(true);
    this.auth
      .register({ firstname, lastname, email, password })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (_user: AuthUser) => {
          this.mode = 'login';
          this.password = '';
          this.success.set('Compte créé. Connectez-vous pour accéder à vos conversations.');
        },
        error: (err: unknown) => {
          this.error.set(this.extractError(err, "Impossible de créer le compte."));
        }
      });
  }

  private extractError(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'error' in err) {
      const body = (err as { error?: { message?: string } | string }).error;
      if (typeof body === 'string' && body.trim()) {
        return body;
      }
      if (body && typeof body === 'object' && body.message) {
        return body.message;
      }
    }
    return fallback;
  }
}

import { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'finrag_token';

/**
 * Lit le JWT depuis localStorage pour éviter une dépendance circulaire
 * AuthService → HttpClient → interceptor → AuthService.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    return next(req);
  }

  let token: string | null = null;
  try {
    if (typeof localStorage !== 'undefined') {
      token = localStorage.getItem(TOKEN_KEY);
    }
  } catch {
    token = null;
  }

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    })
  );
};

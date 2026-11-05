import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Agrega el JWT a las llamadas al backend. Si el backend responde 401
 * (token vencido o inválido), cierra la sesión y vuelve al login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const esApi = req.url.startsWith(environment.apiUrl);
  const token = auth.token();

  const peticion = esApi && token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((err: unknown) => {
      if (esApi && err instanceof HttpErrorResponse && err.status === 401 && !req.url.endsWith('/auth/login')) {
        auth.logout();
        router.navigate(['/login'], { queryParams: { sesion: 'expirada' } });
      }
      return throwError(() => err);
    }),
  );
};

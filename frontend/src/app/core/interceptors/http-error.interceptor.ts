import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ApiErrorResponse } from '../../shared/models/api-error.model';
import { ToastService } from '../../shared/components/toast/toast.service';

/**
 * A 401 from /auth/login or /auth/register means "wrong credentials" / "bad input",
 * not "your session expired" — those must NOT trigger a logout/redirect, so the login
 * and register components can show the error inline on the form instead.
 */
function isAuthEndpoint(url: string): boolean {
  return url.includes('/auth/login') || url.includes('/auth/register');
}

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const apiError = error.error as ApiErrorResponse | undefined;

      if (error.status === 401 && !isAuthEndpoint(req.url)) {
        toastService.show('Your session has expired. Please log in again.');
        authService.logout();
      } else {
        toastService.show(apiError?.message ?? 'Something went wrong. Please try again.');
      }

      return throwError(() => error);
    }),
  );
};

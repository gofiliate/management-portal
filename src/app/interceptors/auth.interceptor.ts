import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, Observable, from, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ReAuthService } from '../services/re-auth.service';
import { ToastrService } from 'ngx-toastr';

let isRefreshing = false;

function isJwtExpirationError(error: HttpErrorResponse): boolean {
  // Check if the error message indicates JWT expiration
  const message = error.error?.message || '';
  return message.includes('JWT') && 
         (message.includes('no longer valid') || message.includes('expired'));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const reAuthService = inject(ReAuthService);
  const toastr = inject(ToastrService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      
      // Check if it's a 403 error with JWT expiration message
      if (error.status === 403 && isJwtExpirationError(error)) {
        if (isRefreshing) {
          return throwError(() => new Error('Authentication in progress'));
        }

        isRefreshing = true;

        // Get current user session to pre-fill username
        const currentSession = authService.getSession();
        const username = currentSession?.username || '';

        // Convert the promise-based re-auth flow to an Observable
        return from(reAuthService.requestReAuth(username)).pipe(
          switchMap(credentials => {
            if (!credentials) {
              // User cancelled - redirect to login
              isRefreshing = false;
              authService.logout();
              toastr.warning('Session expired. Please log in again.', 'Session Expired');
              window.location.href = '/account/sign-in';
              return throwError(() => new Error('Re-authentication cancelled'));
            }

            // Attempt to re-authenticate
            return authService.login(credentials).pipe(
              switchMap(newSession => {
                // Save the new session
                authService.saveSession(newSession);
                isRefreshing = false;
                toastr.success('Session refreshed successfully', 'Welcome Back');

                // Clone the original request with the new token
                const clonedRequest = req.clone({
                  setHeaders: {
                    Authorization: newSession.bearer
                  }
                });

                // Retry the original request
                return next(clonedRequest);
              }),
              catchError(err => {
                // Re-authentication failed - redirect to login
                isRefreshing = false;
                authService.logout();
                toastr.error('Invalid credentials. Please log in again.', 'Re-authentication Failed');
                window.location.href = '/account/sign-in';
                return throwError(() => err);
              })
            );
          }),
          catchError(err => {
            isRefreshing = false;
            return throwError(() => err);
          })
        );
      }
      
      return throwError(() => error);
    })
  );
};

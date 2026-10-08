import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { API_URL, SessionStore } from 'portal-contracts';
import { AuthService } from './auth.service';
function belongsToApi(url: string, api: string): boolean {
  try {
    const target = new URL(url, location.origin);
    const allowed = new URL(api, location.origin);
    return (
      target.origin === allowed.origin &&
      (target.pathname === allowed.pathname || target.pathname.startsWith(allowed.pathname + '/'))
    );
  } catch {
    return false;
  }
}
export const authorizationInterceptor: HttpInterceptorFn = (request, next) => {
  const api = inject(API_URL);
  const session = inject(SessionStore).session();
  if (
    belongsToApi(request.url, api) &&
    session &&
    !request.url.endsWith('/login') &&
    !request.url.endsWith('/refresh')
  ) {
    request = request.clone({ setHeaders: { Authorization: `Bearer ${session.token}` } });
  }
  return next(request);
};
export const refreshInterceptor: HttpInterceptorFn = (request, next) => {
  const api = inject(API_URL);
  const auth = inject(AuthService);
  const isSession = request.url.endsWith('/login') || request.url.endsWith('/refresh');
  return next(request).pipe(
    catchError((error) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        isSession ||
        !belongsToApi(request.url, api)
      )
        return throwError(() => error);
      return auth
        .refresh()
        .pipe(
          switchMap((session) =>
            next(request.clone({ setHeaders: { Authorization: `Bearer ${session.token}` } })),
          ),
        );
    }),
  );
};
@Injectable({ providedIn: 'root' })
export class ErrorLog {
  readonly entries: { status: number; url: string }[] = [];
  record(status: number, url: string): void {
    this.entries.push({ status, url });
    if (this.entries.length > 30) this.entries.shift();
  }
}
export const errorLoggingInterceptor: HttpInterceptorFn = (request, next) => {
  const log = inject(ErrorLog);
  return next(request).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse) log.record(error.status, request.url.split('?')[0]);
      return throwError(() => error);
    }),
  );
};

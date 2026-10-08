import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, shareReplay, tap, throwError } from 'rxjs';
import { API_URL, CartStore, Session, SessionStore } from 'portal-contracts';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_URL);
  private readonly store = inject(SessionStore);
  private readonly cart = inject(CartStore);
  private renewal?: Observable<Session>;
  login(email: string, password: string): Observable<Session> {
    return this.http.post<Session>(`${this.api}/login`, { email, password }).pipe(
      tap((session) => {
        this.cart.clear();
        this.store.set(session);
      }),
    );
  }
  refresh(): Observable<Session> {
    if (this.renewal) return this.renewal;
    const refreshToken = this.store.session()?.refreshToken;
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('Sessão encerrada. Faça login.'));
    }
    this.renewal = this.http.post<Session>(`${this.api}/refresh`, { refreshToken }).pipe(
      tap((session) => this.store.set(session)),
      catchError((error) => {
        if (error.status === 401) this.logout();
        return throwError(() => error);
      }),
      finalize(() => {
        this.renewal = undefined;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.renewal;
  }
  logout(): void {
    this.store.set(null);
    this.cart.clear();
  }
}

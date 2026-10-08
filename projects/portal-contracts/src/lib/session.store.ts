import { Injectable, InjectionToken, signal } from '@angular/core';
import { Session } from './models';
export const API_URL = new InjectionToken<string>('API_URL');
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly state = signal<Session | null>(null);
  readonly session = this.state.asReadonly();
  set(value: Session | null): void {
    this.state.set(value);
  }
}

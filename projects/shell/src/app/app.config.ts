import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { API_URL } from 'portal-contracts';
import { routes } from './app.routes';
import {
  authorizationInterceptor,
  refreshInterceptor,
  errorLoggingInterceptor,
} from './core/interceptors';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    { provide: API_URL, useValue: '/api' },
    provideHttpClient(
      withInterceptors([errorLoggingInterceptor, authorizationInterceptor, refreshInterceptor]),
    ),
  ],
};

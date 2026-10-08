import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { adminMatchGuard, authenticatedGuard, protectedChildrenGuard } from './core/guards';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'catalogo' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'catalogo',
    loadComponent: () =>
      import('./features/catalog/presentation/catalog-page').then((m) => m.CatalogPage),
  },
  {
    path: 'pedidos',
    canActivate: [authenticatedGuard],
    canActivateChild: [protectedChildrenGuard],
    loadChildren: () =>
      loadRemoteModule('pedidos', './Routes')
        .then((m) => m.ORDER_ROUTES)
        .catch(() =>
          import('./shared/fallback-page').then((m) => [{ path: '**', component: m.FallbackPage }]),
        ),
  },
  {
    path: 'admin',
    canActivate: [authenticatedGuard],
    canMatch: [adminMatchGuard],
    loadComponent: () => import('./features/admin/admin-page').then((m) => m.AdminPage),
  },
  {
    path: 'sem-permissao',
    loadComponent: () => import('./shared/fallback-page').then((m) => m.ForbiddenPage),
  },
  { path: '**', redirectTo: 'catalogo' },
];

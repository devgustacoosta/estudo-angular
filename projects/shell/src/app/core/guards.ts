import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { SessionStore } from 'portal-contracts';
export const authenticatedGuard: CanActivateFn = (_route, state) =>
  inject(SessionStore).session()
    ? true
    : inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
export const protectedChildrenGuard: CanActivateChildFn = (route, state) =>
  authenticatedGuard(route, state);
export const adminMatchGuard: CanMatchFn = () =>
  inject(SessionStore).session()?.user.role === 'admin'
    ? true
    : inject(Router).createUrlTree(['/sem-permissao']);

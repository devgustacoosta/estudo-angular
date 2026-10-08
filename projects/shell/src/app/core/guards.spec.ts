import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { SessionStore } from 'portal-contracts';
import { adminMatchGuard, authenticatedGuard, protectedChildrenGuard } from './guards';
describe('Guards', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/pedidos/checkout' } as RouterStateSnapshot;
  it('redireciona visitante para login com retorno', () => {
    const result = TestBed.runInInjectionContext(() => authenticatedGuard(route, state));
    expect(result instanceof UrlTree).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toContain('/login?returnUrl=');
  });
  it('autoriza filhos autenticados e redireciona cliente na rota admin', () => {
    TestBed.inject(SessionStore).set({
      token: 't',
      refreshToken: 'r',
      user: { id: '1', name: 'Ana', role: 'customer' },
    });
    expect(TestBed.runInInjectionContext(() => protectedChildrenGuard(route, state))).toBe(true);
    const result = TestBed.runInInjectionContext(() => adminMatchGuard({}, []));
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/sem-permissao');
  });
  it('autoriza administrador no CanMatch', () => {
    TestBed.inject(SessionStore).set({
      token: 't',
      refreshToken: 'r',
      user: { id: '1', name: 'Admin', role: 'admin' },
    });
    expect(TestBed.runInInjectionContext(() => adminMatchGuard({}, []))).toBe(true);
  });
});

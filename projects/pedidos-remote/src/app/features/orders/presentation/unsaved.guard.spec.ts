import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { unsavedGuard } from './unsaved.guard';
describe('CanDeactivate', () => {
  it('delega a decisão ao contrato da página', () => {
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;
    expect(unsavedGuard({ canLeave: () => true }, route, state, state)).toBe(true);
    expect(unsavedGuard({ canLeave: () => false }, route, state, state)).toBe(false);
  });
});

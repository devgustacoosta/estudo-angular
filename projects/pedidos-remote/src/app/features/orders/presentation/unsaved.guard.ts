import { CanDeactivateFn } from '@angular/router';
export interface UnsavedChanges {
  canLeave(): boolean | Promise<boolean>;
}
export const unsavedGuard: CanDeactivateFn<UnsavedChanges> = (component) => component.canLeave();

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Layout } from './layout/layout';
@Component({
  selector: 'app-root',
  imports: [Layout],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-layout />`,
})
export class App {}

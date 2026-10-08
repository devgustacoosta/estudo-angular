import { ChangeDetectionStrategy, Component } from '@angular/core';
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main>
    <h1>Pedidos Remote</h1>
    <p>Esta aplicação expõe rotas por Native Federation.</p>
    <a href="http://localhost:4200">Abra o shell na porta 4200 para usar o portal completo.</a>
  </main>`,
})
export class App {}

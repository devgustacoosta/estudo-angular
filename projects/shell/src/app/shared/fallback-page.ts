import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="panel">
    <h1>Pedidos temporariamente indisponíveis</h1>
    <p>Não foi possível carregar a aplicação de pedidos. Seu carrinho continua no shell.</p>
    <p>Inicie o remote na porta 4201 e tente novamente.</p>
    <button (click)="retry()">Recarregar portal</button
    ><a routerLink="/catalogo">Voltar ao catálogo</a>
  </section>`,
})
export class FallbackPage {
  retry(): void {
    location.reload();
  }
}
@Component({
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="panel">
    <h1>Acesso não permitido</h1>
    <p>Esta área exige o perfil administrador. Sua sessão continua ativa.</p>
    <a routerLink="/catalogo">Voltar ao catálogo</a>
  </section>`,
})
export class ForbiddenPage {}

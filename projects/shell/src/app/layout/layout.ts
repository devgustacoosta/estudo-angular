import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CartStore, SessionStore } from 'portal-contracts';
import { BrlPipe } from 'portal-ui';
import { AuthService } from '../core/auth.service';
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a href="#main" class="skip">Ir para o conteúdo</a>
    <header>
      <a class="brand" routerLink="/catalogo"
        ><span aria-hidden="true">P</span>Portal<span class="brand-light">Lab</span></a
      >
      <nav aria-label="Principal">
        <a routerLink="/catalogo" routerLinkActive="active">Catálogo</a
        ><a routerLink="/pedidos/historico" routerLinkActive="active">Meus pedidos</a>
        @if (session.session()?.user?.role === 'admin') {
          <a routerLink="/admin" routerLinkActive="active">Administração</a>
        }
      </nav>
      <div class="header-actions">
        <a class="cart-link" routerLink="/pedidos/checkout"
          >Carrinho <b data-testid="cart-count">{{ cart.quantity() }}</b
          ><span>{{ cart.total() | brl }}</span></a
        >
        @if (session.session()) {
          <button (click)="logout()">Sair</button>
        } @else {
          <a routerLink="/login">Entrar</a>
        }
      </div>
    </header>
    <div class="app-container">
      <div class="context-bar">
        <span>Angular • Laboratório de pedidos</span
        ><span>{{ session.session()?.user?.name ?? 'Visitante' }}</span>
      </div>
      <main id="main" tabindex="-1"><router-outlet /></main>
      <footer>
        <span>Portal Lab / Aprender construindo</span>
        <details>
          <summary>Diagnóstico do estado compartilhado</summary>
          <p>
            Instância no shell: <code data-testid="shell-instance">{{ cart.instanceId }}</code>
          </p>
          <p>Compare com a instância exibida no checkout.</p>
        </details>
      </footer>
    </div>`,
})
export class Layout {
  readonly cart = inject(CartStore);
  readonly session = inject(SessionStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  output,
} from '@angular/core';
import { Product } from 'portal-contracts';
import { BrlPipe, ButtonComponent } from 'portal-ui';
@Component({
  selector: 'app-product-card',
  imports: [BrlPipe, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<article class="product">
    <div class="product-icon" aria-hidden="true">{{ product.icon }}</div>
    <small>{{ product.category }}</small>
    <h3>{{ product.name }}</h3>
    <strong>{{ product.price | brl }}</strong>
    <p>{{ availability }}</p>
    <ui-button [disabled]="product.stock === 0" (pressed)="added.emit(product)"
      >Adicionar {{ product.name }}</ui-button
    >
  </article>`,
})
export class ProductCard implements OnChanges {
  @Input({ required: true }) product!: Product;
  readonly added = output<Product>();
  availability = '';
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'])
      this.availability = this.product.stock ? `${this.product.stock} em estoque` : 'Indisponível';
  }
}

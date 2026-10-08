import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, take } from 'rxjs';
import { FiltersStore } from './filters.store';
@Component({
  selector: 'app-filter-bar',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="filters">
    <div>
      <label for="search">Buscar produto</label
      ><input id="search" type="search" [formControl]="search" placeholder="Ex.: teclado" />
    </div>
    <div>
      <label for="category">Categoria</label
      ><select id="category" [formControl]="category">
        <option value="">Todas</option>
        <option>Acessórios</option>
        <option>Computadores</option>
      </select>
    </div>
  </div>`,
})
export class FilterBar {
  private readonly filters = inject(FiltersStore);
  private readonly destroy = inject(DestroyRef);
  readonly search = new FormControl('', { nonNullable: true });
  readonly category = new FormControl('', { nonNullable: true });
  constructor() {
    this.filters.filters$.pipe(take(1)).subscribe((filters) => {
      this.search.setValue(filters.q, { emitEvent: false });
      this.category.setValue(filters.category, { emitEvent: false });
    });
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroy))
      .subscribe((q) => this.filters.update({ q, page: 1 }));
    this.category.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroy))
      .subscribe((category) => this.filters.update({ category, page: 1 }));
  }
}

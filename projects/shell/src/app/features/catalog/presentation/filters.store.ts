import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
export interface CatalogFilters {
  q: string;
  category: string;
  page: number;
}
@Injectable({ providedIn: 'root' })
export class FiltersStore {
  private readonly subject = new BehaviorSubject<CatalogFilters>({ q: '', category: '', page: 1 });
  readonly filters$ = this.subject
    .asObservable()
    .pipe(
      distinctUntilChanged((a, b) => a.q === b.q && a.category === b.category && a.page === b.page),
    );
  update(patch: Partial<CatalogFilters>): void {
    this.subject.next({ ...this.subject.value, ...patch });
  }
}

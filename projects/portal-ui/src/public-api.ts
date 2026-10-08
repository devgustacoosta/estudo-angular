import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  HostListener,
  Pipe,
  PipeTransform,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
@Component({
  selector: 'ui-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button [type]="type()" [disabled]="disabled()" (click)="pressed.emit()">
    <ng-content />
  </button>`,
})
export class ButtonComponent {
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly pressed = output<void>();
}
@Component({
  selector: 'ui-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p
    [attr.role]="kind() === 'error' ? 'alert' : 'status'"
    class="state"
    [class.error]="kind() === 'error'"
  >
    <ng-content />
  </p>`,
})
export class StateComponent {
  readonly kind = input<'loading' | 'error' | 'empty' | 'success'>('empty');
}
@Component({
  selector: 'ui-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => FieldComponent), multi: true },
  ],
  template: `<label [for]="fieldId()">{{ label() }}</label
    ><input
      [id]="fieldId()"
      [type]="type()"
      [autocomplete]="autocomplete()"
      [value]="value()"
      [disabled]="disabled()"
      [attr.aria-describedby]="error() ? fieldId() + '-error' : null"
      [attr.aria-invalid]="!!error()"
      (input)="update($event)"
      (blur)="touch()"
    />
    @if (error()) {
      <small class="error" [id]="fieldId() + '-error'">{{ error() }}</small>
    }`,
})
export class FieldComponent implements ControlValueAccessor {
  readonly fieldId = input.required<string>();
  readonly label = input.required<string>();
  readonly type = input('text');
  readonly autocomplete = input('off');
  readonly error = input('');
  readonly value = signal('');
  readonly disabled = signal(false);
  private change: (value: string) => void = () => {};
  touch: () => void = () => {};
  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }
  registerOnChange(fn: (value: string) => void): void {
    this.change = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.touch = fn;
  }
  setDisabledState(value: boolean): void {
    this.disabled.set(value);
  }
  update(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.change(value);
  }
}
@Component({
  selector: 'ui-confirm',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<dialog #dialog aria-labelledby="confirm-title" (cancel)="cancel($event)">
    <h2 id="confirm-title">{{ title() }}</h2>
    <ng-content />
    <div class="actions">
      <button autofocus (click)="decide(false)">Continuar editando</button
      ><button (click)="decide(true)">Descartar alterações</button>
    </div>
  </dialog>`,
})
export class ConfirmComponent implements AfterViewInit {
  readonly open = input(false);
  readonly title = input('Descartar alterações?');
  readonly decision = output<boolean>();
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private ready = signal(false);
  private previousFocus: HTMLElement | null = null;
  constructor() {
    effect(() => {
      if (!this.ready()) return;
      const dialog = this.dialog().nativeElement;
      if (this.open() && !dialog.open) {
        this.previousFocus = document.activeElement as HTMLElement;
        dialog.showModal();
      }
      if (!this.open() && dialog.open) {
        dialog.close();
        this.previousFocus?.focus();
      }
    });
  }
  ngAfterViewInit(): void {
    this.ready.set(true);
  }
  cancel(event: Event): void {
    event.preventDefault();
    this.decide(false);
  }
  decide(value: boolean): void {
    this.decision.emit(value);
  }
}
@Pipe({ name: 'brl', pure: true })
export class BrlPipe implements PipeTransform {
  private readonly formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  transform(cents: number): string {
    return this.formatter.format(cents / 100);
  }
}
@Directive({ selector: '[selectOnFocus]' })
export class SelectOnFocusDirective {
  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef);
  @HostListener('focus') select(): void {
    this.element.nativeElement.select();
  }
}

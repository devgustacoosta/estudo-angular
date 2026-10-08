import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, exhaustMap, finalize, of } from 'rxjs';
import { FieldComponent, StateComponent } from 'portal-ui';
import { AuthService } from '../../core/auth.service';
@Component({
  imports: [ReactiveFormsModule, FieldComponent, StateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="login panel">
    <small>PORTAL LAB • ANGULAR</small>
    <h1>Bem-vindo de volta</h1>
    <p>Entre para montar seu pedido e acompanhar cada etapa.</p>
    <form [formGroup]="form" (ngSubmit)="submit.next()">
      <ui-field
        fieldId="email"
        label="E-mail"
        type="email"
        autocomplete="username"
        formControlName="email"
      /><ui-field
        fieldId="password"
        label="Senha"
        type="password"
        autocomplete="current-password"
        formControlName="password"
      /><button type="submit" [disabled]="busy()">{{ busy() ? 'Entrando…' : 'Entrar' }}</button>
    </form>
    @if (error()) {
      <ui-state kind="error">{{ error() }}</ui-state>
    }
    <div class="demo">
      <h2>Contas de demonstração</h2>
      <p>Senha: <strong>demo123</strong></p>
      <button (click)="choose('cliente')">Usar cliente</button
      ><button (click)="choose('admin')">Usar administrador</button>
      <p>Autenticação educacional. Nenhuma credencial real.</p>
    </div>
  </section>`,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['cliente@demo.local', [Validators.required, Validators.email]],
    password: ['demo123', Validators.required],
  });
  readonly busy = signal(false);
  readonly error = signal('');
  readonly submit = new Subject<void>();
  constructor() {
    this.submit
      .pipe(
        exhaustMap(() => {
          this.form.markAllAsTouched();
          if (this.form.invalid) {
            this.error.set('Preencha e-mail e senha.');
            return of(null);
          }
          this.busy.set(true);
          this.error.set('');
          return this.auth
            .login(this.form.getRawValue().email, this.form.getRawValue().password)
            .pipe(
              catchError((error) => {
                this.error.set(error.error?.message ?? 'Não foi possível entrar.');
                return of(null);
              }),
              finalize(() => this.busy.set(false)),
            );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((session) => {
        if (session) {
          const path = this.route.snapshot.queryParamMap.get('returnUrl');
          void this.router.navigateByUrl(
            path?.startsWith('/') && !path.startsWith('//') ? path : '/catalogo',
          );
        }
      });
  }
  choose(profile: string): void {
    this.form.setValue({ email: `${profile}@demo.local`, password: 'demo123' });
  }
}

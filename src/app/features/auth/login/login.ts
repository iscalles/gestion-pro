import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'gp-login',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule, MessageModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    clave: ['', Validators.required],
  });

  // Barras decorativas del panel: [inicio %, ancho %, tono]
  protected readonly barras = [
    [4, 22, 'b1'], [18, 30, 'b2'], [26, 18, 'b3'], [40, 34, 'b2'],
    [52, 20, 'b1'], [60, 28, 'b3'], [74, 16, 'b2'], [82, 12, 'b1'],
  ] as const;

  protected usarCuenta(correo: string): void {
    this.form.setValue({ correo, clave: 'demo1234' });
    this.error.set(null);
  }

  protected ingresar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    const { correo, clave } = this.form.getRawValue();
    this.auth.login(correo, clave).subscribe({
      next: () => this.router.navigateByUrl('/proyectos'),
      error: (e: Error) => {
        this.error.set(e.message);
        this.cargando.set(false);
      },
    });
  }

  protected invalido(campo: 'correo' | 'clave'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && c.touched;
  }
}

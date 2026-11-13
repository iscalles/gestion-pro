import { Component, inject, input, output, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ConfirmationService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { mensajeDeError } from '../../../core/api/api-error';
import { AuthService } from '../../../core/auth/auth.service';
import { descargarArchivo } from '../../util/descargas';

export interface Evidencia {
  id: number;
  nombreArchivo: string;
  tipoMime: string;
  tamanoBytes: number;
  subidoPorId: number | null;
  subidoPor: string | null;
  subidoEn: string;
}

/**
 * Evidencias adjuntas a un hito o a una solicitud de cambio: subir (máx. 10 MB), descargar y eliminar
 * (quien la subió o el administrador). `urlSubida` es el endpoint multipart del dueño.
 */
@Component({
  selector: 'gp-evidencias',
  imports: [DatePipe, ButtonModule, MessageModule],
  template: `
    <div class="cab">
      <h3>Evidencias <span class="gp-tenue">({{ evidencias().length }})</span></h3>
      @if (editable()) {
        <input #archivo type="file" class="sr-only" [id]="idInput" (change)="subir(archivo)" />
        <p-button
          label="Adjuntar archivo"
          icon="pi pi-paperclip"
          size="small"
          [outlined]="true"
          [loading]="subiendo()"
          (onClick)="archivo.click()"
        />
      }
    </div>
    @if (error(); as e) {
      <p-message severity="error" [text]="e" styleClass="msg" />
    }
    @if (evidencias().length === 0) {
      <p class="gp-tenue vacio">Sin evidencias adjuntas.</p>
    } @else {
      <ul>
        @for (e of evidencias(); track e.id) {
          <li>
            <i class="pi pi-file" aria-hidden="true"></i>
            <span class="datos">
              <button type="button" class="nombre" (click)="descargar(e)">{{ e.nombreArchivo }}</button>
              <span class="gp-tenue">{{ tamano(e.tamanoBytes) }} · {{ e.subidoPor ?? '—' }} · {{ e.subidoEn | date: 'dd-MM-yyyy HH:mm' }}</span>
            </span>
            @if (editable() && (esAdmin() || e.subidoPorId === usuarioId())) {
              <p-button icon="pi pi-trash" [text]="true" severity="danger" size="small" [ariaLabel]="'Eliminar ' + e.nombreArchivo" (onClick)="eliminar(e)" />
            }
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .cab { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
    h3 { font-size: var(--gp-text-md); }
    ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
    li { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border: 1px solid var(--gp-line); border-radius: var(--gp-radius-sm); }
    li > i { color: var(--gp-data); }
    .datos { display: flex; flex-direction: column; flex: 1; min-width: 0; font-size: var(--gp-text-sm); }
    .nombre { all: unset; cursor: pointer; color: var(--gp-accent); overflow-wrap: anywhere; }
    .nombre:hover { text-decoration: underline; }
    .nombre:focus-visible { box-shadow: var(--gp-focus); border-radius: 2px; }
    .vacio { margin: 0; font-size: var(--gp-text-sm); }
    :host ::ng-deep .msg { margin-bottom: 8px; }
  `,
})
export class Evidencias {
  readonly evidencias = input.required<Evidencia[]>();
  readonly urlSubida = input.required<string>();
  readonly editable = input(true);
  /** Se emite tras subir o eliminar, para que el dueño recargue. */
  readonly cambio = output<void>();

  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  protected readonly esAdmin = this.auth.esAdmin;
  protected readonly usuarioId = () => this.auth.usuario()?.id ?? null;
  protected readonly subiendo = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly idInput = 'ev-' + Math.random().toString(36).slice(2, 7);

  protected subir(input: HTMLInputElement): void {
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;
    if (archivo.size > 10 * 1024 * 1024) {
      this.error.set('El archivo supera el máximo de 10 MB.');
      return;
    }
    const datos = new FormData();
    datos.append('archivo', archivo);
    this.subiendo.set(true);
    this.error.set(null);
    this.http.post(this.urlSubida(), datos).subscribe({
      next: () => {
        this.subiendo.set(false);
        this.cambio.emit();
      },
      error: (e) => {
        this.subiendo.set(false);
        this.error.set(mensajeDeError(e));
      },
    });
  }

  protected descargar(e: Evidencia): void {
    descargarArchivo(this.http, `${environment.apiUrl}/evidencias/${e.id}/archivo`, e.nombreArchivo).catch((err) =>
      this.error.set(mensajeDeError(err)),
    );
  }

  private readonly confirmacion = inject(ConfirmationService, { optional: true });

  protected eliminar(e: Evidencia): void {
    const borrar = () =>
      this.http.delete(`${environment.apiUrl}/evidencias/${e.id}`).subscribe({
        next: () => this.cambio.emit(),
        error: (err) => this.error.set(mensajeDeError(err)),
      });
    const mensaje = `¿Eliminar la evidencia «${e.nombreArchivo}»? No se puede deshacer.`;
    if (this.confirmacion) {
      this.confirmacion.confirm({
        header: 'Eliminar evidencia',
        message: mensaje,
        acceptLabel: 'Eliminar',
        rejectLabel: 'Cancelar',
        acceptButtonProps: { severity: 'danger' },
        rejectButtonProps: { outlined: true },
        accept: borrar,
      });
    } else if (confirm(mensaje)) {
      borrar();
    }
  }

  protected tamano(b: number): string {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
  }
}

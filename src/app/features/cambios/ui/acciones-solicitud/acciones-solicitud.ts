import { Component, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmationService, MessageService } from 'primeng/api';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { erroresDeCampos, mensajeDeError } from '../../../../core/api/api-error';
import { hoyIso } from '../../../../shared/util/formato';
import { CambiosService } from '../../data/cambios.service';
import { AccionCorrectiva, Solicitud } from '../../models/cambio.model';

/** Acciones correctivas de la solicitud; todas deben cerrarse antes de cerrar la solicitud. */
@Component({
  selector: 'gp-acciones-solicitud',
  imports: [DatePipe, FormsModule, ButtonModule, DialogModule, InputTextModule, MessageModule, SelectModule, TextareaModule, StatusBadge],
  template: `
    <div class="gp-seccion">
      <div class="gp-seccion-cabecera">
        <h2>Acciones correctivas</h2>
        @if (abierta()) {
          <p-button label="Agregar" icon="pi pi-plus" [text]="true" size="small" (onClick)="abrir(null)" />
        }
      </div>
      <ul class="acciones">
        @for (a of solicitud().acciones; track a.id) {
          <li>
            <div class="texto">
              <span class="desc">{{ a.descripcion }}</span>
              <span class="gp-tenue gp-tnum">
                {{ a.responsable }} · compromiso {{ a.fechaCompromiso | date: 'dd-MM-yyyy' }}
                @if (a.fechaCierre) {
                  · cerrada {{ a.fechaCierre | date: 'dd-MM-yyyy' }}
                }
              </span>
            </div>
            <gp-status-badge [tono]="a.estado === 'CERRADA' ? 'ok' : a.vencida ? 'danger' : 'warn'">
              {{ a.estado === 'CERRADA' ? 'Cerrada' : a.vencida ? 'Vencida' : 'Abierta' }}
            </gp-status-badge>
            @if (abierta()) {
              <span class="gp-acciones-fila">
                @if (a.estado === 'ABIERTA') {
                  <p-button icon="pi pi-check" [text]="true" size="small" [ariaLabel]="'Cerrar acción ' + a.descripcion" (onClick)="cerrarAccion(a)" />
                }
                <p-button icon="pi pi-pencil" [text]="true" size="small" [ariaLabel]="'Editar acción ' + a.descripcion" (onClick)="abrir(a)" />
                <p-button icon="pi pi-trash" [text]="true" size="small" severity="danger" [ariaLabel]="'Eliminar acción ' + a.descripcion" (onClick)="eliminar(a)" />
              </span>
            }
          </li>
        } @empty {
          <li class="vacio"><i class="pi pi-wrench" aria-hidden="true"></i> Sin acciones correctivas.</li>
        }
      </ul>
    </div>

    <p-dialog [header]="editando() ? 'Editar acción' : 'Nueva acción correctiva'" [visible]="dialogo()" (visibleChange)="dialogo.set($event)" [modal]="true" [draggable]="false" [style]="{ width: 'min(560px, calc(100vw - 32px))' }">
      <form class="gp-form" id="form-accion" (ngSubmit)="guardar()">
        <div class="gp-campo gp-completo">
          <label for="ac-desc">Acción</label>
          <textarea pTextarea id="ac-desc" name="descripcion" [(ngModel)]="f.descripcion" rows="2" maxlength="500"></textarea>
          @if (errores()['descripcion']; as e) { <p class="gp-error-campo">{{ e }}</p> }
        </div>
        <div class="gp-campo gp-completo">
          <label for="ac-resp">Responsable</label>
          <p-select inputId="ac-resp" name="responsableId" [options]="usuarios()" optionLabel="label" optionValue="value" [(ngModel)]="f.responsableId" placeholder="Elige un usuario" appendTo="body" />
        </div>
        <div class="gp-campo">
          <label for="ac-comp">Fecha de compromiso</label>
          <input pInputText type="date" id="ac-comp" name="fechaCompromiso" [(ngModel)]="f.fechaCompromiso" />
        </div>
        <div class="gp-campo">
          <label for="ac-cie">Fecha de cierre</label>
          <input pInputText type="date" id="ac-cie" name="fechaCierre" [(ngModel)]="f.fechaCierre" [max]="hoy" />
          <p class="gp-ayuda">Con fecha de cierre la acción queda cerrada.</p>
        </div>
      </form>
      @if (error(); as e) {
        <p-message severity="error" [text]="e" styleClass="gp-msg" />
      }
      <ng-template #footer>
        <div class="gp-pie-dialogo">
          <p-button label="Cancelar" [outlined]="true" (onClick)="dialogo.set(false)" />
          <p-button label="Guardar" icon="pi pi-check" type="submit" form="form-accion" [loading]="guardando()" />
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: `
    h2 { font-size: var(--gp-text-lg); }
    .acciones { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--gp-line); }
    .acciones li { display: flex; flex-wrap: wrap; align-items: center; gap: var(--gp-space-2) var(--gp-space-3); padding: 10px 0; border-bottom: 1px solid var(--gp-line); }
    .acciones li:last-child { border-bottom: 0; }
    .texto { display: flex; flex-direction: column; gap: 2px; flex: 1 1 14rem; min-width: 0; font-size: var(--gp-text-sm); line-height: 1.4; }
    .desc { font-size: var(--gp-text-md); color: var(--gp-text); overflow-wrap: anywhere; }
    .gp-acciones-fila { margin-left: auto; }
    .vacio { gap: 8px; color: var(--gp-text-muted); font-size: var(--gp-text-sm); }
    .vacio i { color: var(--gp-data); }
  `,
})
export class AccionesSolicitud {
  readonly proyectoId = input.required<number>();
  readonly solicitud = input.required<Solicitud>();
  readonly usuarios = input.required<{ label: string; value: number }[]>();
  readonly actualizado = output<Solicitud>();

  private readonly servicio = inject(CambiosService);
  private readonly mensajes = inject(MessageService);
  private readonly confirmacion = inject(ConfirmationService);
  protected readonly hoy = hoyIso();

  protected abierta(): boolean {
    const e = this.solicitud().estado;
    return e !== 'CERRADO' && e !== 'RECHAZADO';
  }

  protected readonly dialogo = signal(false);
  protected readonly editando = signal<AccionCorrectiva | null>(null);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly errores = signal<Record<string, string>>({});
  protected f = { descripcion: '', responsableId: null as number | null, fechaCompromiso: hoyIso(), fechaCierre: '' };

  protected abrir(a: AccionCorrectiva | null): void {
    this.editando.set(a);
    this.error.set(null);
    this.errores.set({});
    this.f = a
      ? { descripcion: a.descripcion, responsableId: a.responsableId, fechaCompromiso: a.fechaCompromiso, fechaCierre: a.fechaCierre ?? '' }
      : { descripcion: '', responsableId: this.solicitud().responsableId, fechaCompromiso: hoyIso(), fechaCierre: '' };
    this.dialogo.set(true);
  }

  private enviar(a: AccionCorrectiva | null, datos: { descripcion: string; responsableId: number; fechaCompromiso: string; fechaCierre: string | null }, alTerminar?: () => void): void {
    this.guardando.set(true);
    this.error.set(null);
    this.servicio.guardarAccion(this.proyectoId(), this.solicitud().id, a?.id ?? null, datos).subscribe({
      next: (s) => {
        this.guardando.set(false);
        alTerminar?.();
        this.actualizado.emit(s);
      },
      error: (e) => {
        this.guardando.set(false);
        this.errores.set(erroresDeCampos(e));
        if (alTerminar) this.error.set(mensajeDeError(e));
        else this.mensajes.add({ severity: 'error', summary: 'No se pudo guardar', detail: mensajeDeError(e) });
      },
    });
  }

  protected guardar(): void {
    this.enviar(
      this.editando(),
      { descripcion: this.f.descripcion, responsableId: this.f.responsableId as number, fechaCompromiso: this.f.fechaCompromiso, fechaCierre: this.f.fechaCierre || null },
      () => this.dialogo.set(false),
    );
  }

  protected cerrarAccion(a: AccionCorrectiva): void {
    this.enviar(a, { descripcion: a.descripcion, responsableId: a.responsableId, fechaCompromiso: a.fechaCompromiso, fechaCierre: hoyIso() });
  }

  protected eliminar(a: AccionCorrectiva): void {
    this.confirmacion.confirm({
      header: 'Eliminar acción',
      message: `¿Eliminar la acción «${a.descripcion}»?`,
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { outlined: true },
      accept: () =>
        this.servicio.eliminarAccion(this.proyectoId(), this.solicitud().id, a.id).subscribe({
          next: (s) => this.actualizado.emit(s),
          error: (e) => this.mensajes.add({ severity: 'error', summary: 'No se pudo eliminar', detail: mensajeDeError(e) }),
        }),
    });
  }
}

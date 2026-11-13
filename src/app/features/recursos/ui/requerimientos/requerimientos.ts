import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ClpPipe } from '../../../../shared/pipes/clp.pipe';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { erroresDeCampos, mensajeDeError } from '../../../../core/api/api-error';
import { RecursosService } from '../../data/recursos.service';
import { Costos, Requerimiento, TipoProfesional } from '../../models/recurso.model';

/** Requerimientos de personal por tipo de profesional: cantidad requerida vs. profesionales asignados. */
@Component({
  selector: 'gp-requerimientos',
  imports: [FormsModule, TableModule, ButtonModule, DialogModule, SelectModule, InputNumberModule, MessageModule, ClpPipe, StatusBadge],
  template: `
    <section class="gp-seccion">
      <div class="gp-seccion-cabecera">
        <div>
          <h2>Requerimientos de personal</h2>
          <p>Cuántos profesionales de cada tipo necesita el proyecto y cuántos tiene asignados.</p>
        </div>
        <p-button label="Agregar requerimiento" icon="pi pi-plus" (onClick)="abrir(null)" />
      </div>
      <p-table [value]="costos().requerimientos" styleClass="gp-tabla" [tableStyle]="{ 'min-width': '760px' }" dataKey="id">
        <ng-template #header>
          <tr>
            <th>Tipo de profesional</th>
            <th class="num">Requeridos</th>
            <th class="num">Asignados</th>
            <th>Estado</th>
            <th class="num">Tarifa hora</th>
            <th>Profesionales</th>
            <th><span class="sr-only">Acciones</span></th>
          </tr>
        </ng-template>
        <ng-template #body let-r>
          <tr>
            <td>{{ r.categoria }}</td>
            <td class="num">{{ r.cantidadRequerida }}</td>
            <td class="num">{{ r.asignados }}</td>
            <td>
              <gp-status-badge [tono]="r.cubierto ? 'ok' : 'warn'">{{ r.cubierto ? 'Cubierto' : 'Faltan ' + (r.cantidadRequerida - r.asignados) }}</gp-status-badge>
            </td>
            <td class="num">{{ r.tarifaHora | clp }}</td>
            <td class="nombres" [class.gp-tenue]="!r.profesionales.length">{{ r.profesionales.length ? r.profesionales.join(', ') : '—' }}</td>
            <td>
              <div class="gp-acciones-fila">
                <p-button icon="pi pi-pencil" [text]="true" size="small" [ariaLabel]="'Editar requerimiento ' + r.categoria" (onClick)="abrir(r)" />
                <p-button icon="pi pi-trash" [text]="true" size="small" severity="danger" [ariaLabel]="'Eliminar requerimiento ' + r.categoria" (onClick)="eliminar(r)" />
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="7">
              <div class="gp-vacio">
                <i class="pi pi-id-card" aria-hidden="true"></i>
                <p>Sin requerimientos registrados.</p>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </section>

    <p-dialog [header]="editando() ? 'Editar requerimiento' : 'Nuevo requerimiento'" [visible]="dialogo()" (visibleChange)="dialogo.set($event)" [modal]="true" [draggable]="false" [style]="{ width: 'min(520px, calc(100vw - 32px))' }">
      <form class="gp-form" id="form-req" (ngSubmit)="guardar()">
        <div class="gp-campo gp-completo">
          <label for="q-tipo">Tipo de profesional</label>
          <p-select inputId="q-tipo" name="tipo" [options]="opcionesTipos()" optionLabel="label" optionValue="value" [(ngModel)]="form.tipoProfesionalId" (ngModelChange)="tarifaSugerida()" placeholder="Elige un tipo" appendTo="body" />
          @if (errores()['tipoProfesionalId']; as e) { <p class="gp-error-campo">{{ e }}</p> }
        </div>
        <div class="gp-campo">
          <label for="q-cant">Cantidad requerida</label>
          <p-inputnumber inputId="q-cant" name="cantidad" [(ngModel)]="form.cantidadRequerida" [min]="1" [max]="50" [showButtons]="true" />
        </div>
        <div class="gp-campo">
          <label for="q-tar">Tarifa hora (CLP)</label>
          <p-inputnumber inputId="q-tar" name="tarifa" [(ngModel)]="form.tarifaHora" mode="currency" currency="CLP" locale="es-CL" [min]="0" [maxFractionDigits]="0" />
        </div>
      </form>
      @if (errorForm(); as e) {
        <p-message severity="error" [text]="e" styleClass="gp-msg" />
      }
      <ng-template #footer>
        <div class="gp-pie-dialogo">
          <p-button label="Cancelar" [outlined]="true" (onClick)="dialogo.set(false)" />
          <p-button label="Guardar" icon="pi pi-check" type="submit" form="form-req" [loading]="guardando()" />
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: `
    .nombres {
      white-space: normal;
      max-width: 32ch;
    }
  `,
})
export class Requerimientos {
  readonly proyectoId = input.required<number>();
  readonly costos = input.required<Costos>();
  readonly tipos = input.required<TipoProfesional[]>();
  readonly actualizado = output<Costos>();

  private readonly servicio = inject(RecursosService);
  private readonly mensajes = inject(MessageService);
  private readonly confirmacion = inject(ConfirmationService);

  protected readonly opcionesTipos = computed(() => this.tipos().map((t) => ({ label: t.categoria, value: t.id })));
  protected readonly dialogo = signal(false);
  protected readonly editando = signal<Requerimiento | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorForm = signal<string | null>(null);
  protected readonly errores = signal<Record<string, string>>({});
  protected form: { tipoProfesionalId: number | null; cantidadRequerida: number | null; tarifaHora: number | null } = {
    tipoProfesionalId: null,
    cantidadRequerida: 1,
    tarifaHora: null,
  };

  protected abrir(r: Requerimiento | null): void {
    this.editando.set(r);
    this.errorForm.set(null);
    this.errores.set({});
    this.form = r
      ? { tipoProfesionalId: r.tipoProfesionalId, cantidadRequerida: r.cantidadRequerida, tarifaHora: r.tarifaHora }
      : { tipoProfesionalId: null, cantidadRequerida: 1, tarifaHora: null };
    this.dialogo.set(true);
  }

  protected tarifaSugerida(): void {
    if (this.form.tarifaHora == null) {
      this.form.tarifaHora = this.tipos().find((t) => t.id === this.form.tipoProfesionalId)?.tarifaHoraRef ?? null;
    }
  }

  protected guardar(): void {
    const r = this.editando();
    this.guardando.set(true);
    this.errorForm.set(null);
    this.servicio
      .guardarRequerimiento(this.proyectoId(), r?.id ?? null, {
        tipoProfesionalId: this.form.tipoProfesionalId!,
        cantidadRequerida: this.form.cantidadRequerida!,
        tarifaHora: this.form.tarifaHora!,
      })
      .subscribe({
        next: (c) => {
          this.guardando.set(false);
          this.dialogo.set(false);
          this.actualizado.emit(c);
          this.mensajes.add({ severity: 'success', summary: r ? 'Requerimiento actualizado' : 'Requerimiento agregado' });
        },
        error: (e) => {
          this.guardando.set(false);
          this.errores.set(erroresDeCampos(e));
          this.errorForm.set(mensajeDeError(e));
        },
      });
  }

  protected eliminar(r: Requerimiento): void {
    this.confirmacion.confirm({
      header: 'Eliminar requerimiento',
      message: `¿Eliminar el requerimiento de ${r.categoria}?`,
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { outlined: true },
      accept: () =>
        this.servicio.eliminarRequerimiento(this.proyectoId(), r.id).subscribe({
          next: (c) => this.actualizado.emit(c),
          error: (e) => this.mensajes.add({ severity: 'error', summary: 'No se pudo eliminar', detail: mensajeDeError(e) }),
        }),
    });
  }
}

import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { mensajeDeError } from '../../../../core/api/api-error';
import { CambiosService } from '../../data/cambios.service';
import { ENTIDAD, Modificacion, OpcionModificacion, Solicitud } from '../../models/cambio.model';
import { fmtValorCambio } from '../../util/valores';

/** Modificaciones concretas que la solicitud hará al plan al aprobarse (duración, fechas, recursos, vínculos…). */
@Component({
  selector: 'gp-modificaciones-solicitud',
  imports: [FormsModule, TableModule, ButtonModule, DialogModule, InputNumberModule, InputTextModule, MessageModule, SelectModule, StatusBadge],
  template: `
    <div class="gp-seccion">
      <div class="gp-seccion-cabecera">
        <div>
          <h2>Modificaciones al plan</h2>
          <p>
            @if (editable()) {
              Define qué cambia; se aplican todas juntas al aprobar la solicitud.
            } @else {
              Cambios que la solicitud aplicó (o aplicaría) sobre el plan.
            }
          </p>
        </div>
        @if (editable()) {
          <p-button label="Agregar modificación" icon="pi pi-plus" [outlined]="true" (onClick)="abrir()" />
        }
      </div>
      <p-table [value]="solicitud().modificaciones" styleClass="gp-tabla tabla-mods" [tableStyle]="{ 'min-width': '760px' }" dataKey="id">
        <ng-template #header>
          <tr>
            <th>Elemento</th>
            <th>Campo</th>
            <th class="num">Valor {{ editable() ? 'actual' : 'anterior' }}</th>
            <th class="c-flecha" aria-hidden="true"></th>
            <th class="num">Valor nuevo</th>
            <th>Estado</th>
            <th class="c-acciones"><span class="sr-only">Acciones</span></th>
          </tr>
        </ng-template>
        <ng-template #body let-m>
          <tr>
            <td>
              <span class="elemento">{{ m.entidadNombre }}</span>
              <span class="gp-tenue tipo">{{ entidad[$any(m.entidad)] }}</span>
            </td>
            <td>{{ m.campoNombre }}</td>
            <td class="num antes">{{ fmt(m.aplicada ? m.valorAnterior : m.valorActual) }}</td>
            <td class="c-flecha" aria-hidden="true"><i class="pi pi-arrow-right"></i></td>
            <td class="num despues"><strong>{{ fmt(m.valorNuevo) }}</strong></td>
            <td><gp-status-badge [tono]="m.aplicada ? 'ok' : 'neutral'">{{ m.aplicada ? 'Aplicada' : 'Pendiente' }}</gp-status-badge></td>
            <td>
              @if (editable()) {
                <div class="gp-acciones-fila">
                  <p-button icon="pi pi-trash" [text]="true" size="small" severity="danger" [ariaLabel]="'Quitar modificación de ' + m.entidadNombre" (onClick)="eliminar(m)" />
                </div>
              }
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="7">
              <div class="gp-vacio vacio">
                <i class="pi pi-sliders-h" aria-hidden="true"></i>
                <p>Sin modificaciones: la aprobación no cambiará el plan.</p>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog header="Agregar modificación" [visible]="dialogo()" (visibleChange)="dialogo.set($event)" [modal]="true" [draggable]="false" [style]="{ width: 'min(620px, calc(100vw - 32px))' }">
      <form class="gp-form" id="form-mod" (ngSubmit)="guardar()">
        <div class="gp-campo gp-completo">
          <label for="md-el">Elemento</label>
          <p-select inputId="md-el" name="elemento" [options]="opcionesElemento()" optionLabel="label" optionValue="value" [ngModel]="elemento()" (ngModelChange)="elegirElemento($event)" [filter]="true" [group]="true" placeholder="Elige qué modificar" appendTo="body" />
        </div>
        @if (opcion(); as o) {
          <div class="gp-campo">
            <label for="md-campo">Campo</label>
            <p-select inputId="md-campo" name="campo" [options]="o.campos" optionLabel="etiqueta" optionValue="campo" [ngModel]="campo()" (ngModelChange)="elegirCampo($event)" placeholder="Elige el campo" appendTo="body" />
          </div>
          @if (campoSel(); as c) {
            <div class="gp-campo">
              <span class="gp-etiqueta">Valor actual</span>
              <strong class="valor-actual">{{ fmt(c.valorActual) }}</strong>
            </div>
            <div class="gp-campo gp-completo">
              <label for="md-val">Valor nuevo</label>
              @switch (c.tipo) {
                @case ('FECHA') {
                  <input pInputText type="date" id="md-val" name="valor" [(ngModel)]="valorTexto" />
                }
                @case ('LISTA') {
                  <p-select inputId="md-val" name="valor" [options]="c.opciones ?? []" [(ngModel)]="valorTexto" appendTo="body" />
                }
                @default {
                  <p-inputnumber inputId="md-val" name="valor" [(ngModel)]="valorNumero" [maxFractionDigits]="c.tipo === 'DECIMAL' ? 2 : 0" locale="es-CL" />
                }
              }
            </div>
          }
        }
      </form>
      @if (error(); as e) {
        <p-message severity="error" [text]="e" styleClass="gp-msg" />
      }
      <ng-template #footer>
        <div class="gp-pie-dialogo">
          <p-button label="Cancelar" [outlined]="true" (onClick)="dialogo.set(false)" />
          <p-button label="Agregar" icon="pi pi-check" type="submit" form="form-mod" [loading]="guardando()" [disabled]="!campoSel()" />
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: `
    .elemento, .tipo { display: block; line-height: 1.35; }
    .tipo { margin-top: 2px; font-size: var(--gp-text-sm); }
    .antes { color: var(--gp-text-muted); }
    .despues strong { font-size: var(--gp-text-lg); letter-spacing: -0.01em; }
    .c-flecha { width: 1.5rem; padding-inline: 0; text-align: center; color: var(--gp-text-subtle); }
    .c-flecha i { font-size: 0.75rem; }
    .c-acciones { width: 3.5rem; }
    .vacio { padding-block: var(--gp-space-5); }
    .valor-actual { display: flex; align-items: center; min-height: 2.5rem; font-size: var(--gp-text-lg); font-variant-numeric: tabular-nums; }
  `,
})
export class ModificacionesSolicitud {
  readonly proyectoId = input.required<number>();
  readonly solicitud = input.required<Solicitud>();
  readonly actualizado = output<Solicitud>();

  private readonly servicio = inject(CambiosService);
  private readonly mensajes = inject(MessageService);
  protected readonly entidad = ENTIDAD;
  protected readonly fmt = fmtValorCambio;

  protected readonly editable = computed(() => {
    const e = this.solicitud().estado;
    return e === 'ABIERTO' || e === 'EN_EVALUACION';
  });

  protected readonly dialogo = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly opciones = signal<OpcionModificacion[]>([]);
  protected readonly elemento = signal<string | null>(null);
  protected readonly campo = signal<string | null>(null);
  protected valorTexto = '';
  protected valorNumero: number | null = null;

  protected readonly opcionesElemento = computed(() => {
    const grupos = new Map<string, { label: string; value: string }[]>();
    for (const o of this.opciones()) {
      const g = ENTIDAD[o.entidad];
      if (!grupos.has(g)) grupos.set(g, []);
      grupos.get(g)!.push({ label: o.nombre, value: `${o.entidad}:${o.entidadId}` });
    }
    return [...grupos.entries()].map(([label, items]) => ({ label, items }));
  });
  protected readonly opcion = computed(() => this.opciones().find((o) => `${o.entidad}:${o.entidadId}` === this.elemento()) ?? null);
  protected readonly campoSel = computed(() => this.opcion()?.campos.find((c) => c.campo === this.campo()) ?? null);

  protected abrir(): void {
    this.error.set(null);
    this.elemento.set(null);
    this.campo.set(null);
    this.dialogo.set(true);
    this.servicio.opcionesModificacion(this.proyectoId()).subscribe({
      next: (o) => this.opciones.set(o),
      error: (e) => this.error.set(mensajeDeError(e)),
    });
  }

  protected elegirElemento(v: string | null): void {
    this.elemento.set(v);
    const campos = this.opcion()?.campos ?? [];
    this.elegirCampo(campos.length === 1 ? campos[0].campo : null);
  }

  protected elegirCampo(c: string | null): void {
    this.campo.set(c);
    const sel = this.campoSel();
    this.valorTexto = sel?.valorActual ?? '';
    this.valorNumero = sel?.valorActual != null && sel.tipo !== 'FECHA' && sel.tipo !== 'LISTA' ? Number(sel.valorActual) : null;
  }

  protected guardar(): void {
    const o = this.opcion();
    const c = this.campoSel();
    if (!o || !c) return;
    const valor = c.tipo === 'FECHA' || c.tipo === 'LISTA' ? this.valorTexto : this.valorNumero == null ? '' : String(this.valorNumero);
    if (!valor) {
      this.error.set('Indica el valor nuevo.');
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    this.servicio.agregarModificacion(this.proyectoId(), this.solicitud().id, { entidad: o.entidad, entidadId: o.entidadId, campo: c.campo, valorNuevo: valor }).subscribe({
      next: (s) => {
        this.guardando.set(false);
        this.dialogo.set(false);
        this.actualizado.emit(s);
      },
      error: (e) => {
        this.guardando.set(false);
        this.error.set(mensajeDeError(e));
      },
    });
  }

  protected eliminar(m: Modificacion): void {
    this.servicio.eliminarModificacion(this.proyectoId(), this.solicitud().id, m.id).subscribe({
      next: (s) => this.actualizado.emit(s),
      error: (e) => this.mensajes.add({ severity: 'error', summary: 'No se pudo quitar', detail: mensajeDeError(e) }),
    });
  }
}

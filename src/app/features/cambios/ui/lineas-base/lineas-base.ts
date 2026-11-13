import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ClpPipe } from '../../../../shared/pipes/clp.pipe';
import { mensajeDeError } from '../../../../core/api/api-error';
import { CambiosService } from '../../data/cambios.service';
import { Comparacion, LineaBase } from '../../models/cambio.model';

/** Líneas base del proyecto (una inicial y una por cada cambio aprobado) y su comparación con el plan vigente. */
@Component({
  selector: 'gp-lineas-base',
  imports: [DatePipe, FormsModule, TableModule, MessageModule, SkeletonModule, ToggleSwitchModule, ClpPipe],
  template: `
    <section class="gp-seccion">
      <div class="gp-seccion-cabecera">
        <div>
          <h2>Líneas base</h2>
          <p>Fotografías del plan: la inicial y una al aprobar cada solicitud. Elige una para compararla con el plan vigente.</p>
        </div>
      </div>
      @if (error(); as e) {
        <p-message severity="error" [text]="e" styleClass="msg" />
      }
      @if (cargandoLineas()) {
        <div class="lbs" aria-busy="true">
          @for (i of [1, 2, 3]; track i) {
            <p-skeleton width="13rem" height="5.75rem" />
          }
        </div>
      } @else {
        <div class="lbs" role="listbox" aria-label="Líneas base">
          @for (lb of lineas(); track lb.id) {
            <button type="button" role="option" class="lb" [class.sel]="lb.id === seleccion()" [attr.aria-selected]="lb.id === seleccion()" (click)="elegir(lb.id)">
              <span class="lb-cab">
                <strong>{{ lb.codigo }}</strong>
                <span>{{ lb.solicitud ? 'Tras ' + lb.solicitud : 'Plan inicial' }}</span>
              </span>
              <span class="gp-tenue gp-tnum">{{ lb.creadaEn | date: 'dd-MM-yyyy HH:mm' }}</span>
              <span class="gp-tenue gp-tnum">Término {{ lb.fechaTermino | date: 'dd-MM-yyyy' }} · {{ lb.costoTotal | clp }}</span>
            </button>
          } @empty {
            <div class="gp-vacio vacio">
              <i class="pi pi-images" aria-hidden="true"></i>
              <p>Aún no hay líneas base.</p>
            </div>
          }
        </div>
      }
    </section>

    @if (cargando()) {
      <div class="gp-seccion carga" aria-busy="true">
        <p-skeleton height="5.5rem" />
        <p-skeleton height="2rem" width="16rem" />
        <p-skeleton height="8rem" />
      </div>
    } @else if (comparacion(); as c) {
      <section class="gp-seccion">
        <dl class="gp-cifras">
          <div class="gp-cifra">
            <dt>Término en {{ c.lineaBase.codigo }}</dt>
            <dd>{{ c.terminoBase | date: 'dd-MM-yyyy' }}</dd>
          </div>
          <div class="gp-cifra">
            <dt>Término vigente</dt>
            <dd>{{ c.terminoActual ? (c.terminoActual | date: 'dd-MM-yyyy') : '—' }}</dd>
            <span class="gp-cifra-nota delta" [class.gp-negativo]="c.variacionTermino > 0" [class.gp-positivo]="c.variacionTermino < 0">
              @if (c.variacionTermino !== 0) {
                <i [class]="c.variacionTermino > 0 ? 'pi pi-arrow-up-right' : 'pi pi-arrow-down-right'" aria-hidden="true"></i>
              }
              {{ c.variacionTermino === 0 ? 'Sin variación' : (c.variacionTermino > 0 ? '+' : '') + c.variacionTermino + ' días hábiles' }}
            </span>
          </div>
          <div class="gp-cifra">
            <dt>Costo en {{ c.lineaBase.codigo }}</dt>
            <dd>{{ c.costoBase | clp }}</dd>
          </div>
          <div class="gp-cifra">
            <dt>Costo vigente</dt>
            <dd>{{ c.costoActual | clp }}</dd>
            <span class="gp-cifra-nota delta" [class.gp-negativo]="c.costoActual > c.costoBase" [class.gp-positivo]="c.costoActual < c.costoBase">
              @if (c.costoActual !== c.costoBase) {
                <i [class]="c.costoActual > c.costoBase ? 'pi pi-arrow-up-right' : 'pi pi-arrow-down-right'" aria-hidden="true"></i>
              }
              {{ c.costoActual === c.costoBase ? 'Sin variación' : (c.costoActual > c.costoBase ? '+' : '') + (c.costoActual - c.costoBase | clp) }}
            </span>
          </div>
        </dl>
        <div class="gp-seccion-cabecera actividades">
          <h3>Actividades</h3>
          <label class="solo" [class.activo]="soloCambios">
            <p-toggleswitch [(ngModel)]="soloCambios" inputId="lb-solo" />
            <span>Solo las que cambiaron <span class="cuenta gp-tnum">({{ cambiadas() }})</span></span>
          </label>
        </div>
        <p-table [value]="filas()" styleClass="gp-tabla tabla-lb" [tableStyle]="{ 'min-width': '900px' }" [rows]="25" [paginator]="filas().length > 25">
          <ng-template #header>
            <tr>
              <th>Actividad</th>
              <th>Término base</th>
              <th>Término vigente</th>
              <th class="num">Variación</th>
              <th class="num">Duración</th>
              <th class="num">Costo base</th>
              <th class="num">Costo vigente</th>
            </tr>
          </ng-template>
          <ng-template #body let-a>
            <tr [class.gp-fila-grupo]="a.nivel === 0">
              <td>
                <span class="actividad" [style.padding-left.px]="a.nivel * 16"><span class="gp-codigo">{{ a.codigoEdt }}</span> {{ a.nombre }}</span>
                @if (a.nueva) {
                  <span class="marca">nueva</span>
                }
              </td>
              <td class="gp-fecha">{{ a.terminoBase ? (a.terminoBase | date: 'dd-MM-yyyy') : '—' }}</td>
              <td class="gp-fecha vigente">{{ a.terminoActual ? (a.terminoActual | date: 'dd-MM-yyyy') : '—' }}</td>
              <td class="num variacion" [class.gp-negativo]="(a.variacionTermino ?? 0) > 0" [class.gp-positivo]="(a.variacionTermino ?? 0) < 0">
                {{ a.variacionTermino == null || a.variacionTermino === 0 ? '—' : (a.variacionTermino > 0 ? '+' : '') + a.variacionTermino + ' d' }}
              </td>
              <td class="num">
                @if (a.duracionBase != null && a.duracionBase !== a.duracionActual) {
                  <span class="gp-tenue">{{ a.duracionBase }} →</span>
                }
                {{ a.duracionActual }} d
              </td>
              <td class="num base">{{ a.costoBase == null ? '—' : (a.costoBase | clp) }}</td>
              <td class="num" [class.gp-negativo]="a.costoBase != null && a.costoActual > a.costoBase">{{ a.costoActual | clp }}</td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="7">
                <div class="gp-vacio">
                  <i class="pi pi-check-circle" aria-hidden="true"></i>
                  <p>El plan vigente coincide con esta línea base.</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </section>
    }
  `,
  styles: `
    :host ::ng-deep .msg { margin-bottom: var(--gp-space-3); }
    .lbs { display: flex; gap: var(--gp-space-2); overflow-x: auto; padding: 2px 2px 4px; }
    .lb {
      all: unset; box-sizing: border-box; cursor: pointer; display: flex; flex-direction: column; gap: 2px; flex: 0 0 auto;
      min-width: 208px; padding: var(--gp-space-3) var(--gp-space-4); border: 1px solid var(--gp-line); border-radius: var(--gp-radius-md);
      background: var(--gp-surface); font-size: var(--gp-text-sm);
    }
    .lb:hover { border-color: var(--gp-control-border); }
    .lb:focus-visible { box-shadow: var(--gp-focus); }
    .lb.sel { border-color: var(--gp-accent); background: var(--gp-accent-soft); }
    .lb-cab { display: flex; align-items: baseline; gap: var(--gp-space-2); margin-bottom: 2px; }
    .lb-cab strong { font-size: var(--gp-text-lg); font-variant-numeric: tabular-nums; }
    .lb.sel .lb-cab strong { color: var(--gp-accent); }
    .vacio { width: 100%; padding-block: var(--gp-space-5); }
    .carga { display: flex; flex-direction: column; gap: var(--gp-space-4); }
    .delta { display: inline-flex; align-items: center; gap: 4px; font-weight: 500; font-variant-numeric: tabular-nums; }
    .delta i { font-size: 0.7rem; }
    .actividades { margin-top: var(--gp-space-2); }
    h3 { font-size: var(--gp-text-md); }
    .solo {
      display: inline-flex; align-items: center; gap: 10px; padding: 6px 12px 6px 8px; cursor: pointer;
      border: 1px solid var(--gp-line); border-radius: var(--gp-radius-md); font-size: var(--gp-text-sm); font-weight: 500;
    }
    .solo.activo { border-color: var(--gp-accent); background: var(--gp-accent-soft); }
    .cuenta { font-weight: 400; color: var(--gp-text-muted); }
    .actividad .gp-codigo { margin-right: 4px; }
    .base { color: var(--gp-text-muted); }
    .vigente { color: var(--gp-text); }
    .variacion { font-weight: 700; }
    .marca { margin-left: 6px; padding: 1px 6px; border-radius: var(--gp-radius-sm); background: var(--gp-accent-soft); color: var(--gp-accent); font-size: var(--gp-text-xs); font-weight: 500; }
  `,
})
export class LineasBase {
  readonly proyectoId = input.required<number>();
  private readonly servicio = inject(CambiosService);

  protected readonly lineas = signal<LineaBase[]>([]);
  protected readonly seleccion = signal<number | null>(null);
  protected readonly comparacion = signal<Comparacion | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Visual: distingue «cargando la lista» de «aún no hay líneas base». */
  protected readonly cargandoLineas = signal(true);
  protected soloCambiosValor = true;
  private readonly solo = signal(true);

  protected get soloCambios(): boolean {
    return this.soloCambiosValor;
  }
  protected set soloCambios(v: boolean) {
    this.soloCambiosValor = v;
    this.solo.set(v);
  }

  constructor() {
    effect(() => {
      const pid = this.proyectoId();
      untracked(() => {
        this.comparacion.set(null);
        this.cargandoLineas.set(true);
        this.servicio.lineasBase(pid).subscribe({
          next: (ls) => {
            this.cargandoLineas.set(false);
            this.lineas.set(ls);
            const ultima = ls.at(-1);
            if (ultima) this.elegir(ls.length > 1 ? ls[0].id : ultima.id);
          },
          error: (e) => {
            this.cargandoLineas.set(false);
            this.error.set(mensajeDeError(e));
          },
        });
      });
    });
  }

  protected elegir(id: number): void {
    this.seleccion.set(id);
    this.cargando.set(true);
    this.servicio.comparar(this.proyectoId(), id).subscribe({
      next: (c) => {
        this.comparacion.set(c);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  protected readonly cambiadas = computed(() => this.comparacion()?.actividades.filter((a) => a.cambio || a.nueva).length ?? 0);
  protected readonly filas = computed(() => {
    const c = this.comparacion();
    if (!c) return [];
    return this.solo() ? c.actividades.filter((a) => a.cambio || a.nueva) : c.actividades;
  });
}

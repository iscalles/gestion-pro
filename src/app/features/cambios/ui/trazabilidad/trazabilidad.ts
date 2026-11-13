import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { ClpPipe } from '../../../../shared/pipes/clp.pipe';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { mensajeDeError } from '../../../../core/api/api-error';
import { CambiosService } from '../../data/cambios.service';
import { ENTIDAD, ESTADO_SOLICITUD, EstadoSolicitud, Trazabilidad as Traza } from '../../models/cambio.model';
import { fmtValorCambio } from '../../util/valores';
import { KpiAfectados } from '../kpi-afectados/kpi-afectados';

/** Qué cambió cada solicitud aprobada: elementos modificados, línea base generada, impacto real y KPI afectados. */
@Component({
  selector: 'gp-trazabilidad',
  imports: [DatePipe, RouterLink, MessageModule, SkeletonModule, ClpPipe, StatusBadge, KpiAfectados],
  template: `
    <section class="gp-seccion">
      <div class="gp-seccion-cabecera">
        <div>
          <h2>Trazabilidad de cambios aprobados</h2>
          <p>Cada solicitud aprobada con lo que modificó y su efecto en plazo, costo e indicadores.</p>
        </div>
      </div>
      @if (error(); as e) {
        <p-message severity="error" [text]="e" />
      } @else if (cargando()) {
        <p-skeleton height="10rem" />
      } @else {
        @for (t of items(); track t.solicitudId) {
          <article class="traza">
            <header>
              <h3>
                <a [routerLink]="['/cambios', t.solicitudId]" [queryParams]="{ proyecto: proyectoId() }"><span class="gp-codigo">{{ t.codigo }}</span> {{ t.titulo }}</a>
              </h3>
              <gp-status-badge [tono]="estado(t.estado).tono">{{ estado(t.estado).etiqueta }}</gp-status-badge>
            </header>
            <dl class="gp-ficha">
              <div><dt>Aprobada por</dt><dd>{{ t.aprobadoPor ?? '—' }} · {{ t.fechaDecision ? (t.fechaDecision | date: 'dd-MM-yyyy') : '' }}</dd></div>
              <div><dt>Línea base</dt><dd>{{ t.lineaBase ?? '—' }}</dd></div>
              <div>
                <dt>Impacto real en plazo</dt>
                <dd [class.gp-negativo]="(t.impactoPlazoReal ?? 0) > 0">{{ t.impactoPlazoReal == null ? '—' : (t.impactoPlazoReal > 0 ? '+' : '') + t.impactoPlazoReal + ' días hábiles' }}</dd>
              </div>
              <div>
                <dt>Impacto real en costo</dt>
                <dd [class.gp-negativo]="(t.impactoCostoReal ?? 0) > 0">{{ t.impactoCostoReal == null ? '—' : (t.impactoCostoReal | clp) }}</dd>
              </div>
            </dl>
            <div class="gp-rejilla dos">
              <div>
                <h4>Elementos modificados</h4>
                <ul class="mods">
                  @for (m of t.modificaciones; track m.id) {
                    <li>
                      <span class="gp-tenue">{{ entidad[m.entidad] }}</span>
                      <span>{{ m.entidadNombre }} · {{ m.campoNombre }}</span>
                      <span>{{ fmt(m.valorAnterior) }} <i class="pi pi-arrow-right" aria-label="a"></i> <strong>{{ fmt(m.valorNuevo) }}</strong></span>
                    </li>
                  } @empty {
                    <li class="gp-tenue">Sin modificaciones al plan.</li>
                  }
                </ul>
              </div>
              <div>
                <h4>KPI afectados</h4>
                <gp-kpi-afectados [items]="t.kpiAfectados" />
              </div>
            </div>
          </article>
        } @empty {
          <p class="gp-vacio">Todavía no hay solicitudes aprobadas en este proyecto.</p>
        }
      }
    </section>
  `,
  styles: `
    .traza { border: 1px solid var(--gp-line); border-radius: var(--gp-radius-md); padding: var(--gp-space-4); margin-bottom: var(--gp-space-4); }
    header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: var(--gp-space-2); margin-bottom: var(--gp-space-3); }
    h3 { font-size: var(--gp-text-md); }
    h3 a { color: inherit; text-decoration: none; }
    h3 a:hover { color: var(--gp-accent); text-decoration: underline; }
    h4 { font-size: var(--gp-text-sm); color: var(--gp-text-muted); font-weight: 500; margin: var(--gp-space-3) 0 var(--gp-space-2); }
    .dos { margin: 0; }
    .mods { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; font-size: var(--gp-text-sm); }
    .mods li { display: flex; flex-direction: column; gap: 2px; padding-left: 10px; border-left: 2px solid var(--gp-line-strong); }
    .mods i { font-size: 0.7rem; color: var(--gp-text-muted); }
  `,
})
export class Trazabilidad {
  readonly proyectoId = input.required<number>();
  private readonly servicio = inject(CambiosService);
  protected readonly items = signal<Traza[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly entidad = ENTIDAD;
  protected readonly fmt = fmtValorCambio;
  protected readonly estado = (e: string) => ESTADO_SOLICITUD[e as EstadoSolicitud] ?? { etiqueta: e, tono: 'neutral' as const };

  constructor() {
    effect(() => {
      const pid = this.proyectoId();
      untracked(() => {
        this.cargando.set(true);
        this.servicio.trazabilidad(pid).subscribe({
          next: (t) => {
            this.items.set(t);
            this.cargando.set(false);
          },
          error: (e) => {
            this.error.set(mensajeDeError(e));
            this.cargando.set(false);
          },
        });
      });
    });
  }
}

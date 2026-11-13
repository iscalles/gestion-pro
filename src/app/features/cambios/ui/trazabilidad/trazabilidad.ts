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
        <div class="carga" aria-busy="true">
          @for (i of [1, 2]; track i) {
            <div class="sk-traza">
              <p-skeleton width="min(24rem, 70%)" height="1.25rem" />
              <p-skeleton height="2.5rem" />
              <div class="sk-dos"><p-skeleton height="5rem" /><p-skeleton height="5rem" /></div>
            </div>
          }
        </div>
      } @else {
        @for (t of items(); track t.solicitudId) {
          <article class="traza">
            <header>
              <h3>
                <a [routerLink]="['/cambios', t.solicitudId]" [queryParams]="{ proyecto: proyectoId() }"><span class="gp-codigo">{{ t.codigo }}</span> {{ t.titulo }}</a>
              </h3>
              <gp-status-badge [tono]="estado(t.estado).tono">{{ estado(t.estado).etiqueta }}</gp-status-badge>
            </header>
            <dl class="gp-ficha resumen">
              <div><dt>Aprobada por</dt><dd>{{ t.aprobadoPor ?? '—' }} · <span class="gp-tnum">{{ t.fechaDecision ? (t.fechaDecision | date: 'dd-MM-yyyy') : '' }}</span></dd></div>
              <div><dt>Línea base</dt><dd class="lb">{{ t.lineaBase ?? '—' }}</dd></div>
              <div>
                <dt>Impacto real en plazo</dt>
                <dd class="cifra" [class.gp-negativo]="(t.impactoPlazoReal ?? 0) > 0" [class.gp-positivo]="(t.impactoPlazoReal ?? 0) < 0">{{ t.impactoPlazoReal == null ? '—' : (t.impactoPlazoReal > 0 ? '+' : '') + t.impactoPlazoReal + ' días hábiles' }}</dd>
              </div>
              <div>
                <dt>Impacto real en costo</dt>
                <dd class="cifra" [class.gp-negativo]="(t.impactoCostoReal ?? 0) > 0" [class.gp-positivo]="(t.impactoCostoReal ?? 0) < 0">{{ t.impactoCostoReal == null ? '—' : (t.impactoCostoReal | clp) }}</dd>
              </div>
            </dl>
            <div class="dos">
              <div>
                <h4>Elementos modificados</h4>
                <ul class="mods">
                  @for (m of t.modificaciones; track m.id) {
                    <li>
                      <span class="que">
                        <span class="gp-tenue tipo">{{ entidad[m.entidad] }}</span>
                        <span>{{ m.entidadNombre }} · {{ m.campoNombre }}</span>
                      </span>
                      <span class="valores">{{ fmt(m.valorAnterior) }} <i class="pi pi-arrow-right" aria-label="a"></i> <strong>{{ fmt(m.valorNuevo) }}</strong></span>
                    </li>
                  } @empty {
                    <li class="gp-tenue sin">Sin modificaciones al plan.</li>
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
          <div class="gp-vacio">
            <i class="pi pi-sitemap" aria-hidden="true"></i>
            <p>Todavía no hay solicitudes aprobadas en este proyecto.</p>
          </div>
        }
      }
    </section>
  `,
  styles: `
    .traza { padding: var(--gp-space-5) 0; border-top: 1px solid var(--gp-line); }
    .traza:last-child { padding-bottom: 0; }
    header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: var(--gp-space-2); margin-bottom: var(--gp-space-4); }
    h3 { font-size: var(--gp-text-lg); }
    h3 a { color: inherit; text-decoration: none; }
    h3 a:hover { color: var(--gp-accent); text-decoration: underline; }
    h3 .gp-codigo { margin-right: 4px; font-weight: 500; }
    .resumen { margin-bottom: var(--gp-space-5); }
    .cifra, .lb { font-size: var(--gp-text-lg); font-weight: 700; font-variant-numeric: tabular-nums; }
    h4 { margin: 0 0 var(--gp-space-2); font-size: var(--gp-text-sm); font-weight: 500; color: var(--gp-text-muted); }
    .dos { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); gap: var(--gp-space-4) var(--gp-space-8); }
    .mods { margin: 0; padding: 0; list-style: none; font-size: var(--gp-text-sm); border-top: 1px solid var(--gp-line-strong); }
    .mods li { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 4px var(--gp-space-4); padding: 8px 0; border-bottom: 1px solid var(--gp-line); }
    .mods li:last-child { border-bottom: 0; }
    .que { display: flex; flex-direction: column; min-width: 0; }
    .tipo { font-size: var(--gp-text-xs); }
    .valores { white-space: nowrap; font-variant-numeric: tabular-nums; color: var(--gp-text-muted); }
    .valores strong { color: var(--gp-text); }
    .mods i { margin: 0 4px; font-size: 0.7rem; color: var(--gp-text-subtle); }
    .sin { padding: 8px 0; }
    .carga { display: flex; flex-direction: column; gap: var(--gp-space-6); }
    .sk-traza { display: flex; flex-direction: column; gap: var(--gp-space-3); }
    .sk-dos { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gp-space-6); }
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

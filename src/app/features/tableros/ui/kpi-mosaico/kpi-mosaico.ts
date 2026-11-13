import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SemaforoBadge } from '../../../../shared/ui/semaforo/semaforo';
import { Sparkline } from '../../../../shared/graficos/sparkline';
import { fmtValorKpi } from '../../../../shared/util/formato';
import { Kpi } from '../../../kpi/models/kpi.model';

/** Mosaico de KPI: valor, semáforo (con ícono y texto), meta y tendencia. */
@Component({
  selector: 'gp-kpi-mosaico',
  imports: [RouterLink, SemaforoBadge, Sparkline],
  template: `
    @if (kpis().length === 0) {
      <p class="gp-tenue vacio">Sin indicadores activos.</p>
    } @else {
      <ul class="mosaico">
        @for (k of kpis(); track k.id) {
          <li class="kpi" [class.rojo]="k.semaforo === 'ROJO'">
            <div class="cab">
              <span class="gp-codigo">{{ k.codigo }}</span>
              <gp-semaforo [valor]="k.semaforo" />
            </div>
            <a class="nombre" routerLink="/kpi" [queryParams]="{ proyecto: proyectoId() }" [title]="k.objetivo ?? ''">{{ k.nombre }}</a>
            <div class="valor">
              <strong>{{ fmt(k.valor, k.unidad) }}</strong>
              @if (k.historial.length > 1) {
                <gp-sparkline [valores]="tendencia(k)" />
              }
            </div>
            <span class="meta">Meta {{ fmt(k.meta, k.unidad) }}{{ k.ambitoNombre ? ' · ' + k.ambitoNombre : '' }}</span>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .mosaico { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: var(--gp-space-3); }
    .kpi { display: flex; flex-direction: column; gap: 4px; padding: var(--gp-space-3); border: 1px solid var(--gp-line); border-radius: var(--gp-radius-md); background: var(--gp-surface); min-width: 0; }
    .kpi.rojo { border-color: color-mix(in srgb, var(--gp-danger) 45%, var(--gp-line)); }
    .cab { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
    .nombre { font-size: var(--gp-text-sm); color: var(--gp-text); text-decoration: none; line-height: 1.3; min-height: 2.6em; }
    .nombre:hover { color: var(--gp-accent); text-decoration: underline; }
    .valor { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .valor strong { font-size: var(--gp-text-xl); font-variant-numeric: tabular-nums; }
    .meta { font-size: var(--gp-text-xs); color: var(--gp-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .vacio { margin: 0; }
  `,
})
export class KpiMosaico {
  readonly kpis = input.required<Kpi[]>();
  readonly proyectoId = input<number | null>(null);
  protected readonly fmt = fmtValorKpi;

  protected tendencia(k: Kpi): number[] {
    return [...k.historial]
      .sort((a, b) => a.medidoEn.localeCompare(b.medidoEn))
      .slice(-12)
      .map((m) => m.valor);
  }
}

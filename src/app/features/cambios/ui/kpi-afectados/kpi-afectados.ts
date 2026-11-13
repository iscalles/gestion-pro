import { Component, input } from '@angular/core';
import { SemaforoBadge } from '../../../../shared/ui/semaforo/semaforo';
import { fmtValorKpi } from '../../../../shared/util/formato';
import { MedicionGatillada } from '../../../kpi/models/kpi.model';

/** KPI que se volvieron a medir por un cambio: valor y semáforo antes y después. */
@Component({
  selector: 'gp-kpi-afectados',
  imports: [SemaforoBadge],
  template: `
    @if (items().length === 0) {
      <p class="vacio"><i class="pi pi-chart-line" aria-hidden="true"></i> Ningún KPI cambió de valor.</p>
    } @else {
      <div class="tabla">
        <table>
          <caption class="sr-only">KPI afectados</caption>
          <thead>
            <tr>
              <th scope="col">KPI</th>
              <th scope="col" class="num">Antes</th>
              <th class="flecha" aria-hidden="true"></th>
              <th scope="col" class="num">Después</th>
              <th scope="col">Semáforo</th>
            </tr>
          </thead>
          <tbody>
            @for (k of items(); track k.kpiId + k.medidoEn; let i = $index) {
              <tr [class.escalonada]="escalonar()" [style.--i]="i">
                <td class="kpi"><span class="gp-codigo">{{ k.kpi }}</span> {{ k.nombre }}</td>
                <td class="num antes">{{ fmt(k.valorAnterior, k.unidad) }}</td>
                <td class="flecha" aria-hidden="true"><i class="pi pi-arrow-right"></i></td>
                <td class="num despues"><strong>{{ fmt(k.valor, k.unidad) }}</strong></td>
                <td>
                  <span class="semaforos">
                    @if (k.semaforoAnterior && k.semaforoAnterior !== k.semaforo) {
                      <gp-semaforo [valor]="k.semaforoAnterior" />
                      <i class="pi pi-arrow-right" aria-label="pasa a"></i>
                    }
                    <gp-semaforo [valor]="k.semaforo" />
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: `
    .tabla { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: var(--gp-text-sm); }
    th, td { padding: 8px; border-bottom: 1px solid var(--gp-line); text-align: left; vertical-align: middle; }
    th { color: var(--gp-text-muted); font-weight: 500; white-space: nowrap; border-bottom-color: var(--gp-line-strong); }
    th:first-child, td:first-child { padding-left: 0; }
    th:last-child, td:last-child { padding-right: 0; }
    tbody tr:last-child td { border-bottom: 0; }
    .kpi { min-width: 12rem; line-height: 1.35; }
    .gp-codigo { margin-right: 4px; }
    .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .antes { color: var(--gp-text-muted); }
    .despues strong { font-size: var(--gp-text-md); color: var(--gp-text); }
    .flecha { width: 1.25rem; padding-inline: 0; text-align: center; color: var(--gp-text-subtle); }
    .flecha i, .semaforos i { font-size: 0.7rem; }
    .semaforos { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .semaforos i { color: var(--gp-text-subtle); }
    .vacio { display: flex; align-items: center; gap: 8px; margin: 0; font-size: var(--gp-text-sm); color: var(--gp-text-muted); }
    .vacio i { color: var(--gp-data); }

    /* En el diálogo «Cambio aprobado y aplicado»: después de las filas antes→después, una fila cada 40 ms,
       con tope (la cuarta y siguientes entran juntas) para terminar antes de 500 ms tras abrir. */
    .escalonada {
      animation: gp-entrar var(--gp-dur-fast) var(--gp-ease-out) both;
      animation-delay: calc(220ms + min(var(--i, 0), 3) * 40ms);
    }
    @media (prefers-reduced-motion: reduce) {
      .escalonada { animation-delay: 0ms; }
    }
  `,
})
export class KpiAfectados {
  readonly items = input.required<MedicionGatillada[]>();
  /** Visual: las filas entran escalonadas (solo en el diálogo de aprobación). */
  readonly escalonar = input(false);
  protected readonly fmt = fmtValorKpi;
}

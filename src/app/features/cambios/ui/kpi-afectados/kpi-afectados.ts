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
      <p class="gp-tenue vacio">Ningún KPI cambió de valor.</p>
    } @else {
      <div class="tabla">
        <table>
          <caption class="sr-only">KPI afectados</caption>
          <thead>
            <tr>
              <th scope="col">KPI</th>
              <th scope="col" class="num">Antes</th>
              <th scope="col" class="num">Después</th>
              <th scope="col">Semáforo</th>
            </tr>
          </thead>
          <tbody>
            @for (k of items(); track k.kpiId + k.medidoEn) {
              <tr>
                <td><span class="gp-codigo">{{ k.kpi }}</span> {{ k.nombre }}</td>
                <td class="num">{{ fmt(k.valorAnterior, k.unidad) }}</td>
                <td class="num"><strong>{{ fmt(k.valor, k.unidad) }}</strong></td>
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
    th, td { padding: 6px 8px; border-bottom: 1px solid var(--gp-line); text-align: left; }
    th { color: var(--gp-text-muted); font-weight: 500; white-space: nowrap; }
    .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .semaforos { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .semaforos i { font-size: 0.7rem; color: var(--gp-text-muted); }
    .vacio { margin: 0; font-size: var(--gp-text-sm); }
  `,
})
export class KpiAfectados {
  readonly items = input.required<MedicionGatillada[]>();
  protected readonly fmt = fmtValorKpi;
}

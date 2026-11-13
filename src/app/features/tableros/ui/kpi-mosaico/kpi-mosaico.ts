import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SemaforoBadge } from '../../../../shared/ui/semaforo/semaforo';
import { Resaltar } from '../../../../shared/ui/movimiento/resaltar';
import { Sparkline } from '../../../../shared/graficos/sparkline';
import { fmtValorKpi } from '../../../../shared/util/formato';
import { Kpi } from '../../../kpi/models/kpi.model';
import { partirUnidad } from '../unidad';

/**
 * Indicadores en una regleta de filas (no tarjetas): nombre y ámbito, valor grande con su meta debajo,
 * tendencia y semáforo (con ícono y texto). En paneles anchos se reparte en dos columnas.
 */
@Component({
  selector: 'gp-kpi-mosaico',
  imports: [RouterLink, SemaforoBadge, Resaltar, Sparkline],
  template: `
    @if (kpis().length === 0) {
      <p class="gp-tenue vacio">Sin indicadores activos.</p>
    } @else {
      <ul class="lista">
        @for (k of kpis(); track k.id) {
          @let v = valor(k);
          <li class="kpi" [class.rojo]="k.semaforo === 'ROJO'">
            <div class="ident">
              <span class="titulo">
                <span class="gp-codigo">{{ k.codigo }}</span>
                <a class="nombre" routerLink="/kpi" [queryParams]="{ proyecto: proyectoId() }" [title]="k.objetivo ?? ''">{{ k.nombre }}</a>
              </span>
              @if (k.ambitoNombre) {
                <span class="ambito">{{ k.ambitoNombre }}</span>
              }
            </div>
            <div class="cifra">
              <strong class="valor" [class.sin-dato]="k.valor == null" gpResaltar>{{ v.valor }}<span class="gp-unidad">{{ v.unidad }}</span></strong>
              <span class="meta">Meta {{ fmt(k.meta, k.unidad) }}</span>
            </div>
            <div class="tendencia">
              @if (k.historial.length > 1) {
                <gp-sparkline [valores]="tendencia(k)" />
              }
            </div>
            <gp-semaforo class="semaforo" [valor]="k.semaforo" />
          </li>
        }
      </ul>
    }
  `,
  styles: `
    :host { display: block; container-type: inline-size; }
    .lista {
      list-style: none; margin: 0; padding: 0;
      display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 500px), 1fr)); column-gap: var(--gp-space-8);
    }
    .kpi {
      display: grid; grid-template-columns: minmax(0, 1fr) minmax(6.5rem, auto) 96px 8.5rem;
      grid-template-areas: 'ident cifra tendencia semaforo';
      align-items: center; column-gap: var(--gp-space-4);
      min-height: 60px; padding: var(--gp-space-2) 0; border-bottom: 1px solid var(--gp-line);
    }
    .ident { grid-area: ident; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .titulo { display: flex; align-items: baseline; gap: var(--gp-space-2); min-width: 0; font-size: var(--gp-text-sm); line-height: 1.35; }
    .gp-codigo { flex: none; font-size: var(--gp-text-xs); }
    .nombre {
      color: var(--gp-text); font-weight: 500; text-decoration: none;
    }
    .nombre:hover { color: var(--gp-accent); text-decoration: underline; }
    .ambito { font-size: var(--gp-text-xs); color: var(--gp-text-muted); }
    .cifra { grid-area: cifra; display: flex; flex-direction: column; align-items: flex-end; text-align: right; }
    .valor { font-size: var(--gp-text-xl); font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .kpi.rojo .valor { color: var(--gp-danger); }
    .valor.sin-dato { font-size: var(--gp-text-sm); font-weight: 500; color: var(--gp-text-muted); }
    .meta { font-size: var(--gp-text-xs); color: var(--gp-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
    .tendencia { grid-area: tendencia; display: flex; align-items: center; }
    .semaforo { grid-area: semaforo; justify-self: start; }
    .vacio { margin: 0; }
    /* Angosto, o dos columnas que aún no dan espacio al nombre: el nombre ocupa la fila y debajo van semáforo y tendencia */
    @container (max-width: 559px) or ((min-width: 1032px) and (max-width: 1279px)) {
      .kpi {
        grid-template-columns: minmax(0, 1fr) auto;
        grid-template-areas: 'ident cifra' 'semaforo tendencia';
        row-gap: var(--gp-space-2);
      }
      .tendencia { justify-content: flex-end; }
    }
  `,
})
export class KpiMosaico {
  readonly kpis = input.required<Kpi[]>();
  readonly proyectoId = input<number | null>(null);
  protected readonly fmt = fmtValorKpi;

  protected valor(k: Kpi) {
    return partirUnidad(fmtValorKpi(k.valor, k.unidad));
  }

  protected tendencia(k: Kpi): number[] {
    return [...k.historial]
      .sort((a, b) => a.medidoEn.localeCompare(b.medidoEn))
      .slice(-12)
      .map((m) => m.valor);
  }
}

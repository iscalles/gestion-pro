import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ClpPipe } from '../../../../shared/pipes/clp.pipe';
import { Aprobacion } from '../../models/cambio.model';
import { KpiAfectados } from '../kpi-afectados/kpi-afectados';

/**
 * Contenido del diálogo «Cambio aprobado y aplicado» (solo presentación).
 * Secuencia: el diálogo entra en 320 ms; las filas antes→después aparecen cada 50 ms desde los 60 ms y luego los
 * KPI afectados cada 40 ms desde los 220 ms (con tope), todo terminado antes de 500 ms tras abrir.
 * Con movimiento reducido las mismas animaciones son un fundido corto y sin retardos.
 */
@Component({
  selector: 'gp-resultado-aprobacion',
  imports: [DatePipe, ClpPipe, KpiAfectados],
  template: `
    @let a = aprobacion();
    <dl class="antes-despues">
      <div class="fila" style="--i: 0">
        <dt>Término del proyecto</dt>
        <dd>
          <span class="antes">Antes <span class="gp-tnum">{{ a.terminoAntes ? (a.terminoAntes | date: 'dd-MM-yyyy') : '—' }}</span></span>
          <i class="pi pi-arrow-right flecha" role="img" aria-label="pasa a"></i>
          <span class="despues">{{ a.terminoDespues ? (a.terminoDespues | date: 'dd-MM-yyyy') : '—' }}</span>
          <span class="delta" [class.gp-negativo]="a.diasHabilesDesplazados > 0" [class.gp-positivo]="a.diasHabilesDesplazados < 0">
            ({{ a.diasHabilesDesplazados > 0 ? '+' : '' }}{{ a.diasHabilesDesplazados }} días hábiles)
          </span>
        </dd>
      </div>
      <div class="fila" style="--i: 1">
        <dt>Costo planificado</dt>
        <dd>
          <span class="antes">Antes <span class="gp-tnum">{{ a.costoAntes | clp }}</span></span>
          <i class="pi pi-arrow-right flecha" [class.gp-negativo]="a.costoDespues > a.costoAntes" role="img" aria-label="pasa a"></i>
          <span class="despues">{{ a.costoDespues | clp }}</span>
        </dd>
      </div>
      <div class="fila" style="--i: 2">
        <dt>Actividades reprogramadas</dt>
        <dd>
          <span class="despues">{{ a.recalculadas.length }}</span>
          <span class="nota">Línea base {{ a.lineaBase }}</span>
        </dd>
      </div>
    </dl>
    <h3>KPI afectados <span class="gp-tenue gp-tnum">({{ a.kpiAfectados.length }})</span></h3>
    <gp-kpi-afectados [items]="a.kpiAfectados" [escalonar]="true" />
  `,
  styles: `
    :host { display: block; }
    .antes-despues { margin: 0 0 var(--gp-space-5); border-top: 1px solid var(--gp-line); }
    .fila {
      display: grid;
      grid-template-columns: minmax(9rem, 13rem) minmax(0, 1fr);
      align-items: baseline;
      gap: var(--gp-space-1) var(--gp-space-4);
      padding: var(--gp-space-3) 0;
      border-bottom: 1px solid var(--gp-line);
      animation: gp-entrar var(--gp-dur-fast) var(--gp-ease-out) both;
      animation-delay: calc(60ms + var(--i, 0) * 50ms);
    }
    dt { font-size: var(--gp-text-sm); color: var(--gp-text-muted); }
    dd { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px var(--gp-space-3); margin: 0; }
    .antes { color: var(--gp-text-muted); }
    .flecha { align-self: center; font-size: 0.8rem; color: var(--gp-text-subtle); }
    .despues { font-size: var(--gp-text-xl); font-weight: 700; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; }
    .delta { font-size: var(--gp-text-sm); font-weight: 500; font-variant-numeric: tabular-nums; }
    .nota { font-size: var(--gp-text-sm); color: var(--gp-text-muted); }
    h3 {
      margin: 0 0 var(--gp-space-2);
      font-size: var(--gp-text-md);
      animation: gp-aparecer var(--gp-dur-fast) var(--gp-ease-out) 200ms both;
    }
    @media (max-width: 560px) {
      .fila { grid-template-columns: 1fr; }
    }
    @media (prefers-reduced-motion: reduce) {
      .fila, h3 { animation-delay: 0ms; }
    }
  `,
})
export class ResultadoAprobacion {
  readonly aprobacion = input.required<Aprobacion>();
}

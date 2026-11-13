import { Component, computed, input } from '@angular/core';
import { SERIE } from './paleta';

/** Línea mínima de tendencia (historial de un KPI). Decorativa: el valor y el semáforo van en texto al lado. */
@Component({
  selector: 'gp-sparkline',
  template: `
    @if (geo(); as g) {
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" aria-hidden="true">
        <line class="base" x1="0" [attr.x2]="W" [attr.y1]="H - 1" [attr.y2]="H - 1" />
        <path [attr.d]="g.d" fill="none" [attr.stroke]="color()" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
        <circle [attr.cx]="g.fx" [attr.cy]="g.fy" r="3" [attr.fill]="color()" class="fin" />
      </svg>
    }
  `,
  styles: `
    :host { display: inline-block; width: 96px; height: 28px; vertical-align: middle; }
    svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .base { stroke: var(--gp-line); stroke-width: 1; shape-rendering: crispEdges; }
    .fin { stroke: var(--gp-surface); stroke-width: 1.5; }
  `,
})
export class Sparkline {
  readonly valores = input.required<number[]>();
  readonly color = input<string>(SERIE.plan);
  protected readonly W = 96;
  protected readonly H = 28;

  protected readonly geo = computed(() => {
    const v = this.valores();
    if (v.length < 2) return null;
    const min = Math.min(...v);
    const max = Math.max(...v);
    const rango = max - min || 1;
    const pts = v.map((x, i) => [(i / (v.length - 1)) * (this.W - 6) + 3, this.H - 5 - ((x - min) / rango) * (this.H - 9)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const [fx, fy] = pts[pts.length - 1];
    return { d, fx, fy };
  });
}

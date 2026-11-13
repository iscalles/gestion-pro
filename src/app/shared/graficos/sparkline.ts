import { Component, computed, input } from '@angular/core';

/** Línea mínima de tendencia (historial de un KPI). Decorativa: el valor y el semáforo van en texto al lado. */
@Component({
  selector: 'gp-sparkline',
  template: `
    @if (geo(); as g) {
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" aria-hidden="true">
        <path [attr.d]="g.d" fill="none" [attr.stroke]="color()" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
        <circle [attr.cx]="g.fx" [attr.cy]="g.fy" r="3.5" [attr.fill]="color()" stroke="#fff" stroke-width="1.5" />
      </svg>
    }
  `,
  styles: `
    :host { display: inline-block; width: 96px; height: 28px; }
    svg { width: 100%; height: 100%; overflow: visible; }
  `,
})
export class Sparkline {
  readonly valores = input.required<number[]>();
  readonly color = input('#009490');
  protected readonly W = 96;
  protected readonly H = 28;

  protected readonly geo = computed(() => {
    const v = this.valores();
    if (v.length < 2) return null;
    const min = Math.min(...v);
    const max = Math.max(...v);
    const rango = max - min || 1;
    const pts = v.map((x, i) => [(i / (v.length - 1)) * (this.W - 6) + 3, this.H - 4 - ((x - min) / rango) * (this.H - 8)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const [fx, fy] = pts[pts.length - 1];
    return { d, fx, fy };
  });
}

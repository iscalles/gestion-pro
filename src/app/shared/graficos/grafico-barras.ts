import { Component, computed, input, signal } from '@angular/core';
import { escala } from './paleta';

export interface SerieBarras {
  nombre: string;
  color: string;
  valores: (number | null)[];
}

/**
 * Columnas agrupadas en SVG: barras de máx. 24 px con extremo redondeado y base recta, 2 px entre barras
 * vecinas, leyenda para 2+ series, tooltip por categoría y tabla con los datos.
 */
@Component({
  selector: 'gp-grafico-barras',
  template: `
    @if (series().length > 1) {
      <ul class="gp-leyenda">
        @for (s of series(); track s.nombre) {
          <li><span class="gp-muestra" [style.background]="s.color"></span>{{ s.nombre }}</li>
        }
      </ul>
    }
    <div class="lienzo" (mouseleave)="activo.set(null)">
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" role="img" [attr.aria-label]="titulo()">
        @for (t of geo().ticks; track t) {
          <line class="grid" [attr.x1]="M.l" [attr.x2]="W - M.r" [attr.y1]="y(t)" [attr.y2]="y(t)" />
          <text class="eje" [attr.x]="M.l - 8" [attr.y]="y(t) + 4" text-anchor="end">{{ formatoEje()(t) }}</text>
        }
        @for (c of geo().grupos; track c.i) {
          <rect
            class="banda"
            [class.on]="activo() === c.i"
            [attr.x]="c.x0"
            [attr.y]="M.t"
            [attr.width]="c.ancho"
            [attr.height]="H - M.t - M.b"
            (mouseenter)="activo.set(c.i)"
            (focus)="activo.set(c.i)"
            (blur)="activo.set(null)"
            tabindex="0"
            [attr.aria-label]="resumen(c.i)"
          />
          @for (b of c.barras; track b.serie) {
            <path [attr.d]="b.d" [attr.fill]="b.color" pointer-events="none" />
          }
          <text class="eje cat" [attr.x]="c.centro" [attr.y]="H - 10" text-anchor="middle">{{ corta(categorias()[c.i]) }}</text>
        }
      </svg>
      @if (activo() != null) {
        <div class="tip" [style.left.%]="(geo().grupos[activo()!].centro / W) * 100" [class.izq]="activo()! > categorias().length / 2">
          <strong>{{ categorias()[activo()!] }}</strong>
          @for (s of series(); track s.nombre) {
            <span><i [style.background]="s.color"></i>{{ s.nombre }}: {{ formato()(s.valores[activo()!]) }}</span>
          }
        </div>
      }
    </div>
    <details class="gp-datos-grafico">
      <summary>Ver datos en tabla</summary>
      <table>
        <thead>
          <tr>
            <th>{{ nombreCategoria() }}</th>
            @for (s of series(); track s.nombre) {
              <th class="num">{{ s.nombre }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (c of categorias(); track $index; let i = $index) {
            <tr>
              <td>{{ c }}</td>
              @for (s of series(); track s.nombre) {
                <td class="num">{{ formato()(s.valores[i]) }}</td>
              }
            </tr>
          }
        </tbody>
      </table>
    </details>
  `,
  styles: `
    :host { display: block; }
    .lienzo { position: relative; }
    svg { display: block; width: 100%; height: auto; }
    .grid { stroke: var(--gp-line); stroke-width: 1; }
    .eje { font-size: 11px; fill: var(--gp-text-muted); font-variant-numeric: tabular-nums; }
    .banda { fill: transparent; outline: none; }
    .banda.on { fill: var(--gp-canvas); }
    .tip {
      position: absolute; top: 0; transform: translateX(16px); pointer-events: none;
      display: flex; flex-direction: column; gap: 2px; min-width: 170px;
      padding: 8px 10px; background: var(--gp-surface); border: 1px solid var(--gp-line-strong);
      border-radius: var(--gp-radius-md); box-shadow: 0 4px 12px rgba(12, 49, 51, 0.12);
      font-size: var(--gp-text-sm); white-space: nowrap; z-index: 2;
    }
    .tip.izq { transform: translateX(calc(-100% - 16px)); }
    .tip i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; }
  `,
})
export class GraficoBarras {
  readonly titulo = input.required<string>();
  readonly categorias = input.required<string[]>();
  readonly series = input.required<SerieBarras[]>();
  readonly formato = input<(v: number | null | undefined) => string>((v) => (v == null ? '—' : String(v)));
  readonly formatoEje = input<(v: number) => string>((v) => String(v));
  readonly nombreCategoria = input('Categoría');
  /** Valores enteros (conteos, días): el eje no muestra marcas fraccionarias. */
  readonly enteros = input(false);

  protected readonly W = 640;
  protected readonly H = 240;
  protected readonly M = { t: 12, r: 12, b: 30, l: 60 };
  protected readonly activo = signal<number | null>(null);
  private max = 1;

  protected readonly geo = computed(() => {
    const todos = this.series().flatMap((s) => s.valores.filter((v): v is number => v != null));
    const { max, ticks } = escala(Math.max(0, ...todos), 4, this.enteros());
    this.max = max;
    const n = Math.max(this.categorias().length, 1);
    const ancho = (this.W - this.M.l - this.M.r) / n;
    const k = this.series().length;
    const barra = Math.min(24, (ancho * 0.7 - (k - 1) * 2) / k);
    const grupos = this.categorias().map((_, i) => {
      const x0 = this.M.l + i * ancho;
      const total = k * barra + (k - 1) * 2;
      const inicio = x0 + (ancho - total) / 2;
      const barras = this.series().map((s, j) => {
        const v = s.valores[i] ?? 0;
        const bx = inicio + j * (barra + 2);
        return { serie: s.nombre, color: s.color, d: columna(bx, this.y(Math.max(v, 0)), barra, this.y(0)) };
      });
      return { i, x0, ancho, centro: x0 + ancho / 2, barras };
    });
    return { ticks, grupos };
  });

  protected y(v: number): number {
    return this.H - this.M.b - (v / this.max) * (this.H - this.M.t - this.M.b);
  }

  /** Recorta la etiqueta según el ancho de su banda (≈ 6,2 unidades por carácter a 11 px). */
  protected corta(t: string): string {
    const ancho = (this.W - this.M.l - this.M.r) / Math.max(this.categorias().length, 1);
    const lim = Math.max(4, Math.floor(ancho / 6.2));
    return t.length > lim ? t.slice(0, lim - 1) + '…' : t;
  }

  protected resumen(i: number): string {
    return (
      this.categorias()[i] + ': ' + this.series().map((s) => `${s.nombre} ${this.formato()(s.valores[i])}`).join(', ')
    );
  }
}

/** Columna con extremo superior redondeado (4 px) y base recta. */
function columna(x: number, yTop: number, w: number, yBase: number): string {
  const h = yBase - yTop;
  if (h <= 0.5) return '';
  const r = Math.min(4, w / 2, h);
  return `M${x} ${yBase} L${x} ${yTop + r} Q${x} ${yTop} ${x + r} ${yTop} L${x + w - r} ${yTop} Q${x + w} ${yTop} ${x + w} ${yTop + r} L${x + w} ${yBase} Z`;
}

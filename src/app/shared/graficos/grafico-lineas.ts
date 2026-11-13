import { Component, computed, input, signal } from '@angular/core';
import { escala } from './paleta';

export interface SerieLinea {
  nombre: string;
  color: string;
  valores: (number | null)[];
  discontinua?: boolean;
  /** Relleno suave bajo la línea (solo para una serie). */
  area?: boolean;
}

/**
 * Gráfico de líneas en SVG: un solo eje Y, líneas de 2 px, leyenda siempre visible para 2+ series,
 * cruz y tooltip al pasar el mouse o con el teclado, y tabla con los datos.
 */
@Component({
  selector: 'gp-grafico-lineas',
  template: `
    @if (series().length > 1) {
      <ul class="gp-leyenda">
        @for (s of series(); track s.nombre) {
          <li>
            <span class="gp-muestra gp-linea" [class.gp-discontinua]="s.discontinua" [style.background]="s.color" [style.color]="s.color"></span>
            {{ s.nombre }}
          </li>
        }
      </ul>
    }
    <div class="lienzo" (mouseleave)="activo.set(null)">
      <svg
        [attr.viewBox]="'0 0 ' + W + ' ' + H"
        role="img"
        [attr.aria-label]="titulo()"
        tabindex="0"
        (keydown)="teclado($event)"
        (blur)="activo.set(null)"
      >
        @for (t of geo().ticks; track t) {
          <line class="grid" [attr.x1]="M.l" [attr.x2]="W - M.r" [attr.y1]="y(t)" [attr.y2]="y(t)" />
          <text class="eje" [attr.x]="M.l - 8" [attr.y]="y(t) + 4" text-anchor="end">{{ formatoEje()(t) }}</text>
        }
        @for (e of etiquetasX(); track e.i) {
          <text class="eje" [attr.x]="x(e.i)" [attr.y]="H - 8" text-anchor="middle">{{ e.texto }}</text>
        }
        @if (marca() != null) {
          <line class="hoy" [attr.x1]="x(marca()!)" [attr.x2]="x(marca()!)" [attr.y1]="M.t" [attr.y2]="H - M.b" />
          <text class="eje hoy-txt" [attr.x]="x(marca()!) + 4" [attr.y]="M.t + 10">{{ marcaTexto() }}</text>
        }
        @for (s of geo().trazos; track s.nombre) {
          @if (s.area) {
            <path [attr.d]="s.area" [attr.fill]="s.color" fill-opacity="0.1" />
          }
          <path
            [attr.d]="s.d"
            fill="none"
            [attr.stroke]="s.color"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
            [attr.stroke-dasharray]="s.discontinua ? '6 4' : null"
          />
          @if (s.fin; as f) {
            <circle [attr.cx]="f.x" [attr.cy]="f.y" r="4" [attr.fill]="s.color" stroke="#fff" stroke-width="2" />
          }
        }
        @if (activo() != null) {
          <line class="cruz" [attr.x1]="x(activo()!)" [attr.x2]="x(activo()!)" [attr.y1]="M.t" [attr.y2]="H - M.b" />
          @for (s of series(); track s.nombre) {
            @if (s.valores[activo()!] != null) {
              <circle [attr.cx]="x(activo()!)" [attr.cy]="y(s.valores[activo()!]!)" r="4" [attr.fill]="s.color" stroke="#fff" stroke-width="2" />
            }
          }
        }
        <rect
          class="captura"
          [attr.x]="M.l"
          [attr.y]="M.t"
          [attr.width]="W - M.l - M.r"
          [attr.height]="H - M.t - M.b"
          (mousemove)="mover($event)"
        />
      </svg>
      @if (activo() != null) {
        <div class="tip" [style.left.%]="(x(activo()!) / W) * 100" [class.izq]="activo()! > etiquetas().length / 2">
          <strong>{{ etiquetas()[activo()!] }}</strong>
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
            <th>{{ nombreX() }}</th>
            @for (s of series(); track s.nombre) {
              <th class="num">{{ s.nombre }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (e of etiquetas(); track $index; let i = $index) {
            <tr>
              <td>{{ e }}</td>
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
    svg { display: block; width: 100%; height: auto; overflow: visible; }
    svg:focus-visible { outline: none; box-shadow: var(--gp-focus); border-radius: 4px; }
    .grid { stroke: var(--gp-line); stroke-width: 1; }
    .eje { font-size: 11px; fill: var(--gp-text-muted); font-variant-numeric: tabular-nums; }
    .hoy { stroke: var(--gp-text-muted); stroke-width: 1; }
    .hoy-txt { font-weight: 600; }
    .cruz { stroke: var(--gp-text-muted); stroke-width: 1; }
    .captura { fill: transparent; }
    .tip {
      position: absolute; top: 0; transform: translateX(12px); pointer-events: none;
      display: flex; flex-direction: column; gap: 2px; min-width: 160px;
      padding: 8px 10px; background: var(--gp-surface); border: 1px solid var(--gp-line-strong);
      border-radius: var(--gp-radius-md); box-shadow: 0 4px 12px rgba(12, 49, 51, 0.12);
      font-size: var(--gp-text-sm); white-space: nowrap; z-index: 2;
    }
    .tip.izq { transform: translateX(calc(-100% - 12px)); }
    .tip i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; }
  `,
})
export class GraficoLineas {
  readonly titulo = input.required<string>();
  readonly etiquetas = input.required<string[]>();
  readonly series = input.required<SerieLinea[]>();
  readonly formato = input<(v: number | null | undefined) => string>((v) => (v == null ? '—' : String(v)));
  readonly formatoEje = input<(v: number) => string>((v) => String(v));
  readonly nombreX = input('Fecha');
  /** Índice a marcar con una línea vertical (por ejemplo, hoy). */
  readonly marca = input<number | null>(null);
  readonly marcaTexto = input('Hoy');
  readonly maximo = input<number | null>(null);

  protected readonly W = 640;
  protected readonly H = 260;
  protected readonly M = { t: 12, r: 16, b: 28, l: 56 };
  protected readonly activo = signal<number | null>(null);

  protected readonly geo = computed(() => {
    const todos = this.series().flatMap((s) => s.valores.filter((v): v is number => v != null));
    const { max, ticks } = escala(this.maximo() ?? Math.max(0, ...todos));
    this.max = max;
    const trazos = this.series().map((s) => {
      let d = '';
      let ultimo: { x: number; y: number } | null = null;
      let primeroX: number | null = null;
      s.valores.forEach((v, i) => {
        if (v == null) return;
        const px = this.x(i);
        const py = this.y(v);
        d += (d ? ' L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1);
        primeroX ??= px;
        ultimo = { x: px, y: py };
      });
      const fin = ultimo as { x: number; y: number } | null;
      const area =
        s.area && fin && primeroX != null ? `${d} L${fin.x.toFixed(1)} ${this.y(0)} L${primeroX} ${this.y(0)} Z` : null;
      return { nombre: s.nombre, color: s.color, discontinua: !!s.discontinua, d, area, fin };
    });
    return { ticks, trazos };
  });

  private max = 1;

  protected readonly etiquetasX = computed(() => {
    const n = this.etiquetas().length;
    const cada = Math.max(1, Math.ceil(n / 8));
    return this.etiquetas()
      .map((texto, i) => ({ i, texto }))
      .filter((e) => e.i % cada === 0 || e.i === n - 1);
  });

  protected x(i: number): number {
    const n = Math.max(this.etiquetas().length - 1, 1);
    return this.M.l + (i / n) * (this.W - this.M.l - this.M.r);
  }

  protected y(v: number): number {
    return this.H - this.M.b - (v / this.max) * (this.H - this.M.t - this.M.b);
  }

  protected mover(ev: MouseEvent): void {
    const rect = (ev.target as SVGRectElement).ownerSVGElement!.getBoundingClientRect();
    const px = ((ev.clientX - rect.left) / rect.width) * this.W;
    const n = this.etiquetas().length - 1;
    const i = Math.round(((px - this.M.l) / (this.W - this.M.l - this.M.r)) * n);
    this.activo.set(Math.max(0, Math.min(n, i)));
  }

  protected teclado(ev: KeyboardEvent): void {
    const n = this.etiquetas().length - 1;
    const a = this.activo() ?? -1;
    if (ev.key === 'ArrowRight') this.activo.set(Math.min(n, a + 1));
    else if (ev.key === 'ArrowLeft') this.activo.set(Math.max(0, a < 0 ? n : a - 1));
    else if (ev.key === 'Escape') this.activo.set(null);
    else return;
    ev.preventDefault();
  }
}

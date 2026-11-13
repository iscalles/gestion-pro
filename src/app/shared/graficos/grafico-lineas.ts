import { Component, OnInit, computed, input, signal } from '@angular/core';
import { EntradaGrafico, anchoDelHost } from './entrada';
import { escala } from './paleta';

export interface SerieLinea {
  nombre: string;
  color: string;
  valores: (number | null)[];
  discontinua?: boolean;
  /** Relleno suave bajo la línea (solo para una serie). */
  area?: boolean;
}

let secuencia = 0;

/**
 * Gráfico de líneas en SVG: un solo eje Y, líneas de 2 px, leyenda siempre visible para 2+ series,
 * cruz y tooltip al pasar el mouse o con el teclado, y tabla con los datos.
 *
 * El SVG se dibuja al ancho real de su contenedor (el texto de los ejes no se escala). En la primera carga
 * las series se revelan de izquierda a derecha con un recorte que escala en X; `[animar]="false"` lo omite.
 */
@Component({
  selector: 'gp-grafico-lineas',
  template: `
    @let g = geo();
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
        [attr.viewBox]="'0 0 ' + g.W + ' ' + g.H"
        role="img"
        [attr.aria-label]="titulo()"
        tabindex="0"
        (keydown)="teclado($event)"
        (blur)="activo.set(null)"
      >
        @if (entrada.activa()) {
          <defs>
            <clipPath [attr.id]="idRecorte">
              <rect class="gp-anim-desplegar-x" [attr.x]="g.M.l - 6" y="0" [attr.width]="g.W - g.M.l - g.M.r + 12" [attr.height]="g.H" />
            </clipPath>
          </defs>
        }
        @for (t of g.ticks; track t) {
          <line class="grid" [class.base]="t === 0" [attr.x1]="g.M.l" [attr.x2]="g.W - g.M.r" [attr.y1]="g.y(t)" [attr.y2]="g.y(t)" />
          <text class="eje" [attr.x]="g.M.l - 8" [attr.y]="g.y(t) + 4" text-anchor="end">{{ formatoEje()(t) }}</text>
        }
        @for (e of g.etiquetasX; track e.i) {
          <text class="eje" [attr.x]="g.x(e.i)" [attr.y]="g.H - 8" [attr.text-anchor]="e.ancla">{{ e.texto }}</text>
        }
        @if (marca() != null) {
          <line class="hoy" [attr.x1]="g.x(marca()!)" [attr.x2]="g.x(marca()!)" [attr.y1]="g.M.t - 4" [attr.y2]="g.H - g.M.b" />
          <text class="hoy-txt" [attr.x]="g.x(marca()!)" [attr.y]="g.M.t - 9" text-anchor="middle">{{ marcaTexto() }}</text>
        }
        <g [attr.clip-path]="entrada.activa() ? 'url(#' + idRecorte + ')' : null">
          @for (s of g.trazos; track s.nombre) {
            @if (s.area) {
              <path class="area" [attr.d]="s.area" [attr.fill]="s.color" />
            }
            <path class="trazo" [attr.d]="s.d" [attr.stroke]="s.color" [attr.stroke-dasharray]="s.discontinua ? '6 4' : null" />
            @if (s.fin; as f) {
              <circle class="punto" [attr.cx]="f.x" [attr.cy]="f.y" r="3.5" [attr.fill]="s.color" />
            }
          }
        </g>
        @if (activo() != null) {
          <line class="cruz" [attr.x1]="g.x(activo()!)" [attr.x2]="g.x(activo()!)" [attr.y1]="g.M.t" [attr.y2]="g.H - g.M.b" />
          @for (s of series(); track s.nombre) {
            @if (s.valores[activo()!] != null) {
              <circle class="punto" [attr.cx]="g.x(activo()!)" [attr.cy]="g.y(s.valores[activo()!]!)" r="4" [attr.fill]="s.color" />
            }
          }
        }
        <rect
          class="captura"
          [attr.x]="g.M.l"
          [attr.y]="g.M.t"
          [attr.width]="g.W - g.M.l - g.M.r"
          [attr.height]="g.H - g.M.t - g.M.b"
          (mousemove)="mover($event)"
        />
      </svg>
      @if (activo() != null) {
        <div class="tip" [style.left.%]="(g.x(activo()!) / g.W) * 100" [class.izq]="activo()! > etiquetas().length / 2">
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
    :host { display: block; min-width: 0; }
    .lienzo { position: relative; }
    svg { display: block; width: 100%; height: auto; overflow: visible; }
    svg:focus-visible { outline: none; box-shadow: var(--gp-focus); border-radius: var(--gp-radius-sm); }
    .grid { stroke: var(--gp-line); stroke-width: 1; shape-rendering: crispEdges; }
    .grid.base { stroke: var(--gp-line-strong); }
    .eje { font-size: 12px; fill: var(--gp-text-subtle); font-variant-numeric: tabular-nums; }
    .hoy { stroke: var(--gp-accent); stroke-width: 1.5; }
    .hoy-txt { font-size: 12px; font-weight: 700; fill: var(--gp-accent); }
    .area { fill-opacity: 0.08; }
    .trazo { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
    .punto { stroke: var(--gp-surface); stroke-width: 2; }
    .cruz { stroke: var(--gp-text-subtle); stroke-width: 1; stroke-dasharray: 3 3; }
    .captura { fill: transparent; }
    .tip {
      position: absolute; top: 0; transform: translateX(12px); pointer-events: none;
      display: flex; flex-direction: column; gap: 2px; min-width: 160px;
      padding: 8px 10px; background: var(--gp-surface); border: 1px solid var(--gp-line);
      border-radius: var(--gp-radius-md); box-shadow: var(--gp-shadow-overlay);
      font-size: var(--gp-text-sm); font-variant-numeric: tabular-nums; white-space: nowrap; z-index: 2;
    }
    .tip.izq { transform: translateX(calc(-100% - 12px)); }
    .tip i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; }
  `,
})
export class GraficoLineas implements OnInit {
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
  /** Revela las series de izquierda a derecha la primera vez que se dibuja esta instancia. */
  readonly animar = input(true);

  protected readonly activo = signal<number | null>(null);
  protected readonly entrada = new EntradaGrafico();
  protected readonly idRecorte = `gp-recorte-curva-${++secuencia}`;
  private readonly ancho = anchoDelHost();

  ngOnInit(): void {
    this.entrada.iniciar(this.animar());
  }

  protected readonly geo = computed(() => {
    const W = Math.max(240, this.ancho());
    const H = Math.round(Math.min(300, Math.max(240, W * 0.38)));
    const todos = this.series().flatMap((s) => s.valores.filter((v): v is number => v != null));
    const { max, ticks } = escala(this.maximo() ?? Math.max(0, ...todos));
    const fmtEje = this.formatoEje();
    const largo = Math.max(1, ...ticks.map((t) => fmtEje(t).length));
    const M = { t: this.marca() != null ? 26 : 14, r: 16, b: 30, l: Math.max(36, Math.ceil(largo * 6.8) + 14) };
    const n = Math.max(this.etiquetas().length - 1, 1);
    const util = W - M.l - M.r;
    const x = (i: number) => M.l + (i / n) * util;
    const y = (v: number) => H - M.b - (v / max) * (H - M.t - M.b);

    const trazos = this.series().map((s) => {
      let d = '';
      let fin: { x: number; y: number } | null = null;
      let primeroX: number | null = null;
      s.valores.forEach((v, i) => {
        if (v == null) return;
        const px = x(i);
        const py = y(v);
        d += (d ? ' L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1);
        primeroX ??= px;
        fin = { x: px, y: py };
      });
      const f = fin as { x: number; y: number } | null;
      const area = s.area && f && primeroX != null ? `${d} L${f.x.toFixed(1)} ${y(0)} L${primeroX} ${y(0)} Z` : null;
      return { nombre: s.nombre, color: s.color, discontinua: !!s.discontinua, d, area, fin: f };
    });

    // Etiquetas del eje X: tantas como quepan (≈ 72 px cada una), sin chocar con la última.
    const total = this.etiquetas().length;
    const cada = Math.max(1, Math.ceil(total / Math.max(2, Math.floor(util / 72))));
    const etiquetasX = this.etiquetas()
      .map((texto, i) => ({ i, texto, ancla: i === 0 ? 'start' : i === total - 1 ? 'end' : 'middle' }))
      .filter((e) => e.i === total - 1 || (e.i % cada === 0 && total - 1 - e.i >= cada * 0.6));

    return { W, H, M, x, y, ticks, trazos, etiquetasX };
  });

  protected mover(ev: MouseEvent): void {
    const g = this.geo();
    const rect = (ev.target as SVGRectElement).ownerSVGElement!.getBoundingClientRect();
    const px = ((ev.clientX - rect.left) / rect.width) * g.W;
    const n = this.etiquetas().length - 1;
    const i = Math.round(((px - g.M.l) / (g.W - g.M.l - g.M.r)) * n);
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

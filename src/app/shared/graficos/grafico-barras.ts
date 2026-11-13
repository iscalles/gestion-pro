import { Component, OnInit, computed, input, signal } from '@angular/core';
import { EntradaGrafico, anchoDelHost, escalonado } from './entrada';
import { escala } from './paleta';

export interface SerieBarras {
  nombre: string;
  color: string;
  valores: (number | null)[];
}

/**
 * Columnas agrupadas en SVG: barras finas (máx. 16 px) con extremo redondeado de 4 px y base recta, 2 px
 * entre barras vecinas, leyenda para 2+ series, tooltip por categoría y tabla con los datos. Con una sola
 * serie, cada columna lleva su valor encima.
 *
 * El SVG se dibuja al ancho real de su contenedor. Si los nombres de las categorías no caben bajo sus
 * columnas (ni en dos líneas), el gráfico pasa a barras horizontales con los nombres completos a la
 * izquierda: mismos datos, tooltip, teclado y tabla. En la primera carga las barras crecen desde la base,
 * escalonadas 40 ms por categoría; `[animar]="false"` lo omite.
 */
@Component({
  selector: 'gp-grafico-barras',
  template: `
    @let g = geo();
    @if (series().length > 1) {
      <ul class="gp-leyenda">
        @for (s of series(); track s.nombre) {
          <li><span class="gp-muestra" [style.background]="s.color"></span>{{ s.nombre }}</li>
        }
      </ul>
    }
    <div class="lienzo" (mouseleave)="activo.set(null)">
      <svg [attr.viewBox]="'0 0 ' + g.W + ' ' + g.H" role="img" [attr.aria-label]="titulo()">
        @for (m of g.marcas; track m.v) {
          <line class="grid" [class.base]="m.v === 0" [attr.x1]="m.x1" [attr.x2]="m.x2" [attr.y1]="m.y1" [attr.y2]="m.y2" />
          <text class="eje" [attr.x]="m.tx" [attr.y]="m.ty" [attr.text-anchor]="m.ancla">{{ formatoEje()(m.v) }}</text>
        }
        @for (c of g.grupos; track c.i) {
          <rect
            class="banda"
            [class.on]="activo() === c.i"
            [attr.x]="c.banda.x"
            [attr.y]="c.banda.y"
            [attr.width]="c.banda.w"
            [attr.height]="c.banda.h"
            (mouseenter)="activo.set(c.i)"
            (focus)="activo.set(c.i)"
            (blur)="activo.set(null)"
            tabindex="0"
            [attr.aria-label]="resumen(c.i)"
          />
          @for (b of c.barras; track b.serie) {
            <path
              class="barra"
              [class.gp-anim-crecer-y]="entrada.activa() && !g.horizontal"
              [class.gp-anim-desplegar-x]="entrada.activa() && g.horizontal"
              [style.animation-delay.ms]="c.retraso"
              [attr.d]="b.d"
              [attr.fill]="b.color"
              pointer-events="none"
            />
            @if (b.rotulo; as r) {
              <text
                class="rotulo"
                [class.gp-anim-aparecer]="entrada.activa()"
                [style.animation-delay.ms]="c.retraso + 240"
                [attr.x]="r.x"
                [attr.y]="r.y"
                [attr.text-anchor]="r.ancla"
                pointer-events="none"
              >{{ r.texto }}</text>
            }
          }
          <text class="eje" [class.cat]="g.horizontal" [attr.text-anchor]="c.etiqueta.ancla" pointer-events="none">
            @for (l of c.etiqueta.lineas; track $index) {
              <tspan [attr.x]="c.etiqueta.x" [attr.y]="c.etiqueta.y + $index * 14">{{ l }}</tspan>
            }
          </text>
        }
      </svg>
      @if (activo() != null) {
        <div class="tip" [style.left.%]="g.grupos[activo()!].tip.x" [style.top.px]="g.grupos[activo()!].tip.y" [class.izq]="g.grupos[activo()!].tip.izq" [class.horiz]="g.horizontal">
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
    :host { display: block; min-width: 0; }
    .lienzo { position: relative; }
    svg { display: block; width: 100%; height: auto; overflow: visible; }
    .grid { stroke: var(--gp-line); stroke-width: 1; shape-rendering: crispEdges; }
    .grid.base { stroke: var(--gp-line-strong); }
    .eje { font-size: 12px; fill: var(--gp-text-subtle); font-variant-numeric: tabular-nums; }
    .rotulo { font-size: 12px; font-weight: 700; fill: var(--gp-text); font-variant-numeric: tabular-nums; }
    .banda { fill: transparent; outline: none; }
    .banda.on { fill: var(--gp-hover); }
    .banda:focus-visible { fill: var(--gp-accent-soft); stroke: var(--gp-accent); stroke-width: 2; }
    .tip {
      position: absolute; top: 0; transform: translateX(16px); pointer-events: none;
      display: flex; flex-direction: column; gap: 2px; min-width: 170px;
      padding: 8px 10px; background: var(--gp-surface); border: 1px solid var(--gp-line);
      border-radius: var(--gp-radius-md); box-shadow: var(--gp-shadow-overlay);
      font-size: var(--gp-text-sm); font-variant-numeric: tabular-nums; white-space: nowrap; z-index: 2;
    }
    .tip.izq { transform: translateX(calc(-100% - 16px)); }
    .tip.horiz { transform: translate(0, 4px); }
    .cat { fill: var(--gp-text-muted); }
    .tip i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; }
  `,
})
export class GraficoBarras implements OnInit {
  readonly titulo = input.required<string>();
  readonly categorias = input.required<string[]>();
  readonly series = input.required<SerieBarras[]>();
  readonly formato = input<(v: number | null | undefined) => string>((v) => (v == null ? '—' : String(v)));
  readonly formatoEje = input<(v: number) => string>((v) => String(v));
  readonly nombreCategoria = input('Categoría');
  /** Valores enteros (conteos, días): el eje no muestra marcas fraccionarias. */
  readonly enteros = input(false);
  /** Las columnas crecen desde la base la primera vez que se dibuja esta instancia. */
  readonly animar = input(true);

  protected readonly activo = signal<number | null>(null);
  protected readonly entrada = new EntradaGrafico();
  private readonly ancho = anchoDelHost();
  protected readonly H = 240;

  ngOnInit(): void {
    this.entrada.iniciar(this.animar());
  }

  protected readonly geo = computed<Geometria>(() => {
    const W = Math.max(220, this.ancho());
    const series = this.series();
    const cats = this.categorias();
    const todos = series.flatMap((s) => s.valores.filter((v): v is number => v != null));
    const { max, ticks } = escala(Math.max(0, ...todos), 4, this.enteros());
    const fmtEje = this.formatoEje();
    const unaSerie = series.length === 1;
    const k = Math.max(series.length, 1);
    const n = Math.max(cats.length, 1);
    const rotulo = (v: number | null | undefined) => (unaSerie && v != null ? this.formato()(v) : null);

    // ¿Caben los nombres bajo sus columnas, en a lo más dos líneas? Si no, barras horizontales.
    const largoEje = Math.max(1, ...ticks.map((t) => fmtEje(t).length));
    const izq = Math.max(32, Math.ceil(largoEje * PX) + 14);
    const ancho = (W - izq - 8) / n;
    const lineas = cats.map((c) => partir(c, Math.floor((ancho - 6) / PX), 2));
    if (lineas.every((l) => l != null)) {
      return this.vertical(W, max, ticks, izq, ancho, lineas as string[][], k, unaSerie, rotulo);
    }
    return this.horizontal(W, max, ticks, k, unaSerie, rotulo);
  });

  private vertical(
    W: number,
    max: number,
    ticks: number[],
    izq: number,
    ancho: number,
    lineas: string[][],
    k: number,
    unaSerie: boolean,
    rotulo: (v: number | null | undefined) => string | null,
  ): Geometria {
    const series = this.series();
    const extra = (Math.max(1, ...lineas.map((l) => l.length)) - 1) * 14;
    const M = { t: unaSerie ? 24 : 12, r: 8, b: 30 + extra, l: izq };
    const H = this.H + extra;
    const y = (v: number) => H - M.b - (v / max) * (H - M.t - M.b);
    const barra = Math.max(3, Math.min(16, (ancho * 0.62 - (k - 1) * 2) / k));
    const n = lineas.length;
    const marcas = ticks.map((v) => ({ v, x1: M.l, x2: W - M.r, y1: y(v), y2: y(v), tx: M.l - 8, ty: y(v) + 4, ancla: 'end' }));
    const grupos = lineas.map((lin, i) => {
      const x0 = M.l + i * ancho;
      const inicio = x0 + (ancho - (k * barra + (k - 1) * 2)) / 2;
      const barras = series.map((s, j) => {
        const bruto = s.valores[i];
        const bx = inicio + j * (barra + 2);
        const cima = y(Math.max(bruto ?? 0, 0));
        const texto = rotulo(bruto);
        return {
          serie: s.nombre,
          color: s.color,
          d: columna(bx, cima, barra, y(0)),
          rotulo: texto == null ? null : { x: bx + barra / 2, y: cima - 6, ancla: 'middle', texto },
        };
      });
      return {
        i,
        banda: { x: x0, y: M.t, w: ancho, h: H - M.t - M.b },
        retraso: escalonado(i, n),
        barras,
        etiqueta: { x: x0 + ancho / 2, y: H - M.b + 18, ancla: 'middle', lineas: lin },
        tip: { x: ((x0 + ancho / 2) / W) * 100, y: 0, izq: i > n / 2 },
      };
    });
    return { W, H, horizontal: false, marcas, grupos };
  }

  /** Barras horizontales: nombres completos a la izquierda (hasta dos líneas) y eje de valores abajo. */
  private horizontal(
    W: number,
    max: number,
    ticks: number[],
    k: number,
    unaSerie: boolean,
    rotulo: (v: number | null | undefined) => string | null,
  ): Geometria {
    const series = this.series();
    const cats = this.categorias();
    const n = cats.length;
    const tope = Math.floor((W * 0.42 - 12) / PX);
    const lineas = cats.map((c) => partir(c, tope, 2) ?? [recortar(c, tope)]);
    const izq = Math.max(64, Math.ceil(Math.max(1, ...lineas.flat().map((l) => l.length)) * PX) + 14);
    const textos = series.flatMap((s) => s.valores.map((v) => rotulo(v) ?? ''));
    const der = unaSerie ? Math.ceil(Math.max(1, ...textos.map((t) => t.length)) * 7.2) + 12 : 16;
    const barra = unaSerie ? 12 : 10;
    const grupo = k * barra + (k - 1) * 2;
    const alto = Math.max(grupo + 14, Math.max(1, ...lineas.map((l) => l.length)) * 14 + 12, 30);
    const M = { t: 4, r: der, b: 24, l: izq };
    const H = M.t + n * alto + M.b;
    const x = (v: number) => M.l + (v / max) * (W - M.l - M.r);
    const marcas = ticks.map((v) => ({ v, x1: x(v), x2: x(v), y1: M.t, y2: H - M.b, tx: x(v), ty: H - 6, ancla: 'middle' }));
    const grupos = lineas.map((lin, i) => {
      const y0 = M.t + i * alto;
      const inicio = y0 + (alto - grupo) / 2;
      const barras = series.map((s, j) => {
        const bruto = s.valores[i];
        const by = inicio + j * (barra + 2);
        const finBarra = x(Math.max(bruto ?? 0, 0));
        const texto = rotulo(bruto);
        return {
          serie: s.nombre,
          color: s.color,
          d: fila(x(0), by, finBarra - x(0), barra),
          rotulo: texto == null ? null : { x: finBarra + 6, y: by + barra / 2 + 4, ancla: 'start', texto },
        };
      });
      return {
        i,
        banda: { x: 0, y: y0, w: W, h: alto },
        retraso: escalonado(i, n),
        barras,
        etiqueta: { x: M.l - 10, y: y0 + alto / 2 + 4 - ((lin.length - 1) * 14) / 2, ancla: 'end', lineas: lin },
        tip: { x: (M.l / W) * 100, y: y0 + alto, izq: false },
      };
    });
    return { W, H, horizontal: true, marcas, grupos };
  }

  protected resumen(i: number): string {
    return (
      this.categorias()[i] + ': ' + this.series().map((s) => `${s.nombre} ${this.formato()(s.valores[i])}`).join(', ')
    );
  }
}

/** Ancho medio de un carácter del eje (12 px, Atkinson Hyperlegible Next). */
const PX = 6.6;

interface Geometria {
  W: number;
  H: number;
  horizontal: boolean;
  marcas: { v: number; x1: number; x2: number; y1: number; y2: number; tx: number; ty: number; ancla: string }[];
  grupos: {
    i: number;
    banda: { x: number; y: number; w: number; h: number };
    retraso: number;
    barras: { serie: string; color: string; d: string; rotulo: { x: number; y: number; ancla: string; texto: string } | null }[];
    etiqueta: { x: number; y: number; ancla: string; lineas: string[] };
    tip: { x: number; y: number; izq: boolean };
  }[];
}

/** Reparte un nombre en líneas de a lo más `max` caracteres, por palabras; null si no cabe. */
function partir(texto: string, max: number, lineas: number): string[] | null {
  if (max < 3) return null;
  const out: string[] = [];
  for (const palabra of texto.split(' ')) {
    if (palabra.length > max) return null;
    const ultima = out.at(-1);
    if (ultima != null && ultima.length + 1 + palabra.length <= max) out[out.length - 1] = ultima + ' ' + palabra;
    else out.push(palabra);
  }
  return out.length <= lineas ? out : null;
}

function recortar(texto: string, max: number): string {
  return texto.length > max ? texto.slice(0, Math.max(1, max - 1)) + '…' : texto;
}

/** Barra horizontal con extremo derecho redondeado (4 px) y base recta, anclada al eje. */
function fila(x: number, y: number, largo: number, h: number): string {
  if (largo <= 0.5) return '';
  const r = Math.min(4, h / 2, largo);
  const f = x + largo;
  return `M${x} ${y} L${f - r} ${y} Q${f} ${y} ${f} ${y + r} L${f} ${y + h - r} Q${f} ${y + h} ${f - r} ${y + h} L${x} ${y + h} Z`;
}

/** Columna con extremo superior redondeado (4 px) y base recta, anclada a la línea base. */
function columna(x: number, yTop: number, w: number, yBase: number): string {
  const h = yBase - yTop;
  if (h <= 0.5) return '';
  const r = Math.min(4, w / 2, h);
  return `M${x} ${yBase} L${x} ${yTop + r} Q${x} ${yTop} ${x + r} ${yTop} L${x + w - r} ${yTop} Q${x + w} ${yTop} ${x + w} ${yTop + r} L${x + w} ${yBase} Z`;
}

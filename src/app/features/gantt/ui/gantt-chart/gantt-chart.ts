import { SlicePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  Actividad,
  Dependencia,
  TIPO_ACTIVIDAD,
  TIPO_DEPENDENCIA,
} from '../../../actividades/models/planificacion.model';
import { DiaSemana } from '../../../actividades/models/calendario.model';
import { ESTADO_HITO, Hito } from '../../../hitos/models/hito.model';
import {
  ZOOM,
  Zoom,
  diaDe,
  diaSemana,
  hoyDia,
  inicioMes,
  lunesDe,
  mesSiguiente,
  nombreMes,
  textoCorto,
  textoFecha,
} from '../../models/gantt.model';

const FILA = 36;
const DOW: Record<DiaSemana, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

type Fila =
  | { clase: 'actividad'; y: number; a: Actividad }
  | { clase: 'grupo-hitos'; y: number }
  | { clase: 'hito'; y: number; h: Hito };

interface Barra {
  a: Actividad;
  y: number;
  x1: number;
  x2: number;
  progreso: number;
  real: { x1: number; x2: number; abierta: boolean; desviada: boolean } | null;
}

interface Diamante {
  h: Hito;
  y: number;
  x: number;
  /** Plan contra real/previsto: diamante hueco en la fecha comprometida y línea hasta la real o prevista. */
  fantasma: { x: number; desvio: boolean } | null;
  clase: string;
}

interface Vinculo {
  id: number;
  d: string;
  activo: boolean;
}

interface Celda {
  x: number;
  ancho: number;
  texto: string;
  tenue?: boolean;
}

export interface Tooltip {
  x: number;
  y: number;
  titulo: string;
  subtitulo: string;
  lineas: { etiqueta: string; valor: string; tono?: 'danger' | 'warn' | 'ok' }[];
}

/**
 * Carta Gantt en SVG, solo de lectura: la generan los datos del backend y se redibuja cuando cambian.
 * Grilla jerárquica plegable a la izquierda (fija al desplazar) y línea de tiempo a la derecha con
 * barras planificadas y reales, avance, atrasos, hitos y flechas FS/SS/FF/SF.
 */
@Component({
  selector: 'gp-gantt-chart',
  imports: [SlicePipe],
  templateUrl: './gantt-chart.html',
  styleUrl: './gantt-chart.scss',
})
export class GanttChart {
  readonly actividades = input.required<Actividad[]>();
  readonly dependencias = input.required<Dependencia[]>();
  readonly hitos = input<Hito[]>([]);
  readonly noLaborables = input<string[]>([]);
  readonly diasLaborables = input<DiaSemana[]>([
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
  ]);
  readonly zoom = input<Zoom>('semana');
  readonly mostrarReal = input(true);
  readonly mostrarVinculos = input(true);
  readonly seleccionId = input<number | null>(null);

  readonly seleccionar = output<number>();

  private readonly contenedor = viewChild.required<ElementRef<HTMLElement>>('contenedor');

  protected readonly FILA = FILA;
  protected readonly Math = Math;
  protected readonly plegadas = signal<Set<number>>(new Set());
  protected readonly hitosPlegados = signal(false);
  protected readonly hoverId = signal<number | null>(null);
  protected readonly tooltip = signal<Tooltip | null>(null);
  protected readonly tipoEtiqueta = TIPO_ACTIVIDAD;
  protected readonly textoCorto = textoCorto;

  private readonly hoy = hoyDia();

  constructor() {
    // Al cambiar de escala o de proyecto, la vista se centra en hoy (o en el inicio si hoy queda fuera).
    let claveAnterior = '';
    effect(() => {
      const clave = `${this.zoom()}|${this.rango().inicio}|${this.rango().fin}`;
      if (clave !== claveAnterior) {
        claveAnterior = clave;
        untracked(() => setTimeout(() => this.irAHoy(), 0));
      }
    });
  }

  irAHoy(): void {
    const el = this.contenedor().nativeElement;
    const grilla = el.querySelector<HTMLElement>('.esquina')?.offsetWidth ?? 0;
    const visible = el.clientWidth - grilla;
    const { inicio, fin } = this.rango();
    const objetivo = this.hoy >= inicio && this.hoy <= fin ? this.x(this.hoy) : 0;
    el.scrollTo({ left: Math.max(0, objetivo - visible / 3), behavior: 'auto' });
  }

  // ------------------------------------------------------------------ escala

  protected readonly pxDia = computed(() => ZOOM[this.zoom()].pxDia);

  protected readonly rango = computed(() => {
    const dias: number[] = [this.hoy];
    for (const a of this.actividades()) {
      for (const f of [
        a.fechaInicioPlan,
        a.fechaTerminoPlan,
        a.fechaInicioReal,
        a.fechaTerminoReal,
      ])
        if (f) dias.push(diaDe(f));
    }
    for (const h of this.hitos()) {
      for (const f of [h.fechaComprometida, h.fechaReal, h.fechaPrevista])
        if (f) dias.push(diaDe(f));
    }
    const margen = ZOOM[this.zoom()].margen;
    let inicio = Math.min(...dias) - margen;
    let fin = Math.max(...dias) + margen;
    if (this.zoom() === 'mes') {
      inicio = inicioMes(inicio);
      fin = mesSiguiente(fin) - 1;
    } else {
      inicio = lunesDe(inicio);
      fin = lunesDe(fin) + 6;
    }
    return { inicio, fin };
  });

  protected x(dia: number): number {
    return (dia - this.rango().inicio) * this.pxDia();
  }

  protected readonly ancho = computed(
    () => (this.rango().fin - this.rango().inicio + 1) * this.pxDia(),
  );
  protected readonly xHoy = computed(() => this.x(this.hoy) + this.pxDia() / 2);

  /** Dos niveles de escala: arriba meses (o años), abajo días, semanas o meses. */
  protected readonly escala = computed(() => {
    const { inicio, fin } = this.rango();
    const px = this.pxDia();
    const z = this.zoom();
    const superior: Celda[] = [];
    const inferior: Celda[] = [];
    if (z === 'mes') {
      for (let d = inicio; d <= fin;) {
        const anio = new Date(d * 86_400_000).getUTCFullYear();
        const sig = Math.min(Date.UTC(anio + 1, 0, 1) / 86_400_000, fin + 1);
        superior.push({ x: this.x(d), ancho: (sig - d) * px, texto: String(anio) });
        d = sig;
      }
      for (let d = inicio; d <= fin; d = mesSiguiente(d)) {
        inferior.push({
          x: this.x(d),
          ancho: (Math.min(mesSiguiente(d), fin + 1) - d) * px,
          texto: nombreMes(d),
        });
      }
    } else {
      for (let d = inicio; d <= fin;) {
        const sig = Math.min(mesSiguiente(d), fin + 1);
        const anio = new Date(d * 86_400_000).getUTCFullYear();
        superior.push({
          x: this.x(d),
          ancho: (sig - d) * px,
          texto: `${nombreMes(d, true)} ${anio}`,
        });
        d = sig;
      }
      if (z === 'dia') {
        for (let d = inicio; d <= fin; d++) {
          inferior.push({
            x: this.x(d),
            ancho: px,
            texto: String(new Date(d * 86_400_000).getUTCDate()),
            tenue: !this.esLaborable(d),
          });
        }
      } else {
        for (let d = inicio; d <= fin; d += 7)
          inferior.push({ x: this.x(d), ancho: 7 * px, texto: textoCorto(d) });
      }
    }
    return { superior, inferior };
  });

  private readonly feriados = computed(() => new Set(this.noLaborables().map(diaDe)));
  private readonly laborables = computed(() => new Set(this.diasLaborables().map((d) => DOW[d])));

  private esLaborable(dia: number): boolean {
    return this.laborables().has(diaSemana(dia)) && !this.feriados().has(dia);
  }

  /** Franjas de días no laborables (fines de semana y feriados), agrupando días seguidos. */
  protected readonly franjas = computed(() => {
    if (this.zoom() === 'mes') return [];
    const { inicio, fin } = this.rango();
    const franjas: { x: number; ancho: number; feriado: boolean }[] = [];
    for (let d = inicio; d <= fin; d++) {
      if (this.esLaborable(d)) continue;
      const feriado = this.feriados().has(d);
      const ultima = franjas.at(-1);
      const x = this.x(d);
      if (ultima && !feriado && !ultima.feriado && Math.abs(ultima.x + ultima.ancho - x) < 0.01)
        ultima.ancho += this.pxDia();
      else franjas.push({ x, ancho: this.pxDia(), feriado });
    }
    return franjas;
  });

  // ------------------------------------------------------------------ filas

  private readonly porId = computed(() => new Map(this.actividades().map((a) => [a.id, a])));

  protected readonly filas = computed<Fila[]>(() => {
    const plegadas = this.plegadas();
    const porId = this.porId();
    const filas: Fila[] = [];
    for (const a of this.actividades()) {
      let oculta = false;
      for (let p = a.padreId; p != null; p = porId.get(p)?.padreId ?? null) {
        if (plegadas.has(p)) {
          oculta = true;
          break;
        }
      }
      if (!oculta) filas.push({ clase: 'actividad', y: filas.length * FILA, a });
    }
    if (this.hitos().length) {
      filas.push({ clase: 'grupo-hitos', y: filas.length * FILA });
      if (!this.hitosPlegados())
        for (const h of this.hitos()) filas.push({ clase: 'hito', y: filas.length * FILA, h });
    }
    return filas;
  });

  protected readonly alto = computed(() => Math.max(this.filas().length * FILA, FILA));

  private readonly yPorActividad = computed(() => {
    const m = new Map<number, number>();
    for (const f of this.filas()) if (f.clase === 'actividad') m.set(f.a.id, f.y);
    return m;
  });

  // ------------------------------------------------------------------ barras

  protected readonly barras = computed<Barra[]>(() => {
    const px = this.pxDia();
    const real = this.mostrarReal();
    const barras: Barra[] = [];
    for (const f of this.filas()) {
      if (f.clase !== 'actividad' || !f.a.fechaInicioPlan || !f.a.fechaTerminoPlan) continue;
      const a = f.a;
      const x1 = this.x(diaDe(a.fechaInicioPlan));
      const x2 = this.x(diaDe(a.fechaTerminoPlan)) + px;
      let r: Barra['real'] = null;
      if (real && a.fechaInicioReal) {
        const ini = diaDe(a.fechaInicioReal);
        const abierta = !a.fechaTerminoReal;
        const fin = a.fechaTerminoReal ? diaDe(a.fechaTerminoReal) : Math.max(ini, this.hoy);
        r = {
          x1: this.x(ini),
          x2: this.x(fin) + px,
          abierta,
          desviada: fin > diaDe(a.fechaTerminoPlan),
        };
      }
      barras.push({ a, y: f.y, x1, x2, progreso: ((x2 - x1) * Number(a.avance)) / 100, real: r });
    }
    return barras;
  });

  protected readonly diamantes = computed<Diamante[]>(() => {
    const medio = this.pxDia() / 2;
    const out: Diamante[] = [];
    for (const f of this.filas()) {
      if (f.clase !== 'hito') continue;
      const h = f.h;
      const comprometida = diaDe(h.fechaComprometida);
      let principal = comprometida;
      let fantasma: Diamante['fantasma'] = null;
      if (h.estado === 'CUMPLIDO' && h.fechaReal && diaDe(h.fechaReal) !== comprometida) {
        principal = diaDe(h.fechaReal);
        fantasma = { x: this.x(comprometida) + medio, desvio: principal > comprometida };
      } else if (
        h.estado === 'PENDIENTE' &&
        h.fechaPrevista &&
        diaDe(h.fechaPrevista) > comprometida
      ) {
        fantasma = { x: this.x(diaDe(h.fechaPrevista)) + medio, desvio: true };
      }
      const clase =
        h.estadoCalculado === 'PENDIENTE' && h.enRiesgo
          ? 'riesgo'
          : h.estadoCalculado.toLowerCase();
      out.push({ h, y: f.y, x: this.x(principal) + medio, fantasma, clase });
    }
    return out;
  });

  /**
   * Flechas ortogonales. Ancla de salida: término (FS, FF) o inicio (SS, SF) de la predecesora;
   * ancla de llegada: inicio (FS, SS) o término (FF, SF) de la sucesora.
   */
  protected readonly vinculos = computed<Vinculo[]>(() => {
    if (!this.mostrarVinculos()) return [];
    const barras = new Map(this.barras().map((b) => [b.a.id, b]));
    const activo = this.hoverId() ?? this.seleccionId();
    const out: Vinculo[] = [];
    for (const d of this.dependencias()) {
      const p = barras.get(d.predecesoraId);
      const s = barras.get(d.sucesoraId);
      if (!p || !s) continue;
      const desdeFin = d.tipo === 'FS' || d.tipo === 'FF';
      const haciaInicio = d.tipo === 'FS' || d.tipo === 'SS';
      const yMedioP = p.y + this.yBarra(p.a) + this.altoBarra(p.a) / 2;
      const yMedioS = s.y + this.yBarra(s.a) + this.altoBarra(s.a) / 2;
      const x0 = desdeFin ? p.x2 : p.x1;
      const x1 = x0 + (desdeFin ? 8 : -8);
      const xF = haciaInicio ? s.x1 : s.x2;
      const xA = xF + (haciaInicio ? -8 : 8);
      // Vertical que quede del lado de salida de la predecesora y del lado de llegada de la sucesora.
      let xv: number | null;
      if (desdeFin && haciaInicio)
        xv = x1 <= xA ? x1 : null; // FS
      else if (!desdeFin && haciaInicio)
        xv = Math.min(x1, xA); // SS
      else if (desdeFin && !haciaInicio)
        xv = Math.max(x1, xA); // FF
      else xv = xA <= x1 ? x1 : null; // SF
      // Si no existe, la flecha rodea por el borde entre filas para no cruzar las barras.
      const yCorredor = s.y > p.y ? s.y : s.y + FILA;
      const camino =
        xv != null
          ? `M${x0},${yMedioP} H${xv} V${yMedioS} H${xF}`
          : `M${x0},${yMedioP} H${x1} V${yCorredor} H${xA} V${yMedioS} H${xF}`;
      out.push({
        id: d.id,
        d: camino,
        activo: activo === d.predecesoraId || activo === d.sucesoraId,
      });
    }
    // Las activas se dibujan al final para quedar encima.
    return out.sort((a, b) => Number(a.activo) - Number(b.activo));
  });

  protected yBarra(a: Actividad): number {
    if (!a.esHoja) return 12;
    return this.mostrarReal() ? 7 : 10;
  }

  protected altoBarra(a: Actividad): number {
    if (!a.esHoja) return 8;
    return this.mostrarReal() ? 14 : 16;
  }

  // ------------------------------------------------------------------ interacción

  protected alternar(id: number, ev?: Event): void {
    ev?.stopPropagation();
    this.plegadas.update((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  plegarTodo(plegar: boolean): void {
    this.plegadas.set(
      plegar
        ? new Set(
            this.actividades()
              .filter((a) => a.tipo === 'ETAPA' && !a.esHoja)
              .map((a) => a.id),
          )
        : new Set(),
    );
    this.hitosPlegados.set(false);
  }

  protected entrar(ev: MouseEvent, b: Barra): void {
    this.hoverId.set(b.a.id);
    this.mover(ev, this.tooltipActividad(b.a));
  }

  protected entrarHito(ev: MouseEvent, d: Diamante): void {
    this.mover(ev, this.tooltipHito(d.h));
  }

  protected mover(ev: MouseEvent, contenido?: Omit<Tooltip, 'x' | 'y'>): void {
    const actual = contenido ?? this.tooltip();
    if (!actual) return;
    // Se ubica a la derecha del puntero, o a la izquierda si no cabe.
    const ancho = 340;
    const x =
      ev.clientX + 16 + ancho > window.innerWidth ? ev.clientX - 16 - ancho : ev.clientX + 16;
    this.tooltip.set({
      ...actual,
      x: Math.max(8, x),
      y: Math.min(ev.clientY + 12, window.innerHeight - 220),
    });
  }

  protected salir(): void {
    this.hoverId.set(null);
    this.tooltip.set(null);
  }

  private nombre(id: number): string {
    return this.porId().get(id)?.nombre ?? '';
  }

  private tooltipActividad(a: Actividad): Omit<Tooltip, 'x' | 'y'> {
    const ini = a.fechaInicioPlan ? diaDe(a.fechaInicioPlan) : null;
    const fin = a.fechaTerminoPlan ? diaDe(a.fechaTerminoPlan) : null;
    const lineas: Tooltip['lineas'] = [
      {
        etiqueta: 'Planificado',
        valor: `${textoFecha(ini)} → ${textoFecha(fin)} · ${a.duracionPlan} d`,
      },
    ];
    if (a.fechaInicioReal) {
      const rf = a.fechaTerminoReal ? diaDe(a.fechaTerminoReal) : null;
      const desvio = rf != null && fin != null && rf > fin;
      lineas.push({
        etiqueta: 'Real',
        valor: `${textoFecha(diaDe(a.fechaInicioReal))} → ${rf != null ? textoFecha(rf) : 'en curso'}${a.duracionReal != null ? ' · ' + a.duracionReal + ' d' : ''}`,
        tono: desvio ? 'warn' : undefined,
      });
    }
    lineas.push({
      etiqueta: 'Avance',
      valor: `${a.avance} %`,
      tono: Number(a.avance) >= 100 ? 'ok' : undefined,
    });
    if (a.atrasada)
      lineas.push({
        etiqueta: 'Estado',
        valor: 'Atrasada: el término planificado ya pasó',
        tono: 'danger',
      });
    const preds = this.dependencias().filter((d) => d.sucesoraId === a.id);
    if (preds.length) {
      lineas.push({
        etiqueta: 'Predecesoras',
        valor: preds
          .map(
            (d) =>
              `${this.nombre(d.predecesoraId)} (${d.tipo}${d.desfaseDias ? (d.desfaseDias > 0 ? ' +' : ' ') + d.desfaseDias + ' d' : ''})`,
          )
          .join(', '),
      });
    }
    return {
      titulo: a.nombre,
      subtitulo: `${TIPO_ACTIVIDAD[a.tipo]}${a.responsable ? ' · ' + a.responsable : ''}`,
      lineas,
    };
  }

  private tooltipHito(h: Hito): Omit<Tooltip, 'x' | 'y'> {
    const e = ESTADO_HITO[h.estadoCalculado];
    const lineas: Tooltip['lineas'] = [
      { etiqueta: 'Comprometida', valor: textoFecha(diaDe(h.fechaComprometida)) },
    ];
    if (h.fechaReal) {
      lineas.push({
        etiqueta: 'Real',
        valor: `${textoFecha(diaDe(h.fechaReal))}${h.cumplidoEnPlazo ? ' · en plazo' : ' · fuera de plazo'}`,
        tono: h.cumplidoEnPlazo ? 'ok' : 'warn',
      });
    } else if (h.fechaPrevista) {
      lineas.push({
        etiqueta: 'Prevista',
        valor: `${textoFecha(diaDe(h.fechaPrevista))}${h.enRiesgo ? ' · después de lo comprometido' : ''}`,
        tono: h.enRiesgo ? 'warn' : undefined,
      });
    }
    lineas.push({
      etiqueta: 'Estado',
      valor: e.etiqueta,
      tono: e.tono === 'danger' ? 'danger' : e.tono === 'ok' ? 'ok' : undefined,
    });
    if (h.actividadIds.length)
      lineas.push({
        etiqueta: 'Actividades',
        valor: h.actividadIds.map((id) => this.nombre(id)).join(', '),
      });
    return {
      titulo: `${h.codigo} · ${h.descripcion}`,
      subtitulo: `Hito · ${h.responsable}`,
      lineas,
    };
  }

  protected etiquetaEstadoHito(h: Hito): string {
    if (h.estadoCalculado === 'PENDIENTE' && h.enRiesgo) return 'En riesgo';
    return ESTADO_HITO[h.estadoCalculado].etiqueta;
  }

  protected tipoDependencia = TIPO_DEPENDENCIA;
}

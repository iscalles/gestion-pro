import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { SelectorProyecto } from '../../../../shared/ui/selector-proyecto/selector-proyecto';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { ClpPipe } from '../../../../shared/pipes/clp.pipe';
import { GraficoBarras, SerieBarras } from '../../../../shared/graficos/grafico-barras';
import { BarraApilada, Segmento } from '../../../../shared/graficos/barra-apilada';
import { ESTADO, RAMPA, SERIE, tintaSobre } from '../../../../shared/graficos/paleta';
import { contextoProyecto } from '../../../../shared/util/contexto-proyecto';
import { fmtEntero, fmtPesos, fmtPesosEje } from '../../../../shared/util/formato';
import { mensajeDeError } from '../../../../core/api/api-error';
import { PRIORIDAD, TIPO_CAMBIO, opciones } from '../../../cambios/models/cambio.model';
import { TablerosService } from '../../data/tableros.service';
import { Conteo, TableroCambio as Tablero } from '../../models/tablero.model';
import { KpiMosaico } from '../../ui/kpi-mosaico/kpi-mosaico';
import { ListaAlertas } from '../../ui/lista-alertas/lista-alertas';

@Component({
  selector: 'gp-tablero-cambio',
  imports: [
    DatePipe, DecimalPipe, RouterLink, FormsModule, ButtonModule, InputTextModule, MessageModule, SelectModule,
    SkeletonModule, TableModule, TooltipModule, PageHeader, SelectorProyecto, StatusBadge, ClpPipe, GraficoBarras,
    BarraApilada, KpiMosaico, ListaAlertas,
  ],
  templateUrl: './tablero-cambio.html',
  styleUrl: './tablero-cambio.scss',
})
export class TableroCambio {
  protected readonly ctx = contextoProyecto();
  private readonly servicio = inject(TablerosService);

  protected readonly datos = signal<Tablero | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected filtro = { tipo: null as string | null, prioridad: null as string | null, desde: '', hasta: '' };
  protected readonly hayFiltro = signal(false);

  protected readonly opTipo = [{ label: 'Todos los tipos', value: null as string | null }, ...opciones(TIPO_CAMBIO)];
  protected readonly opPrioridad = [{ label: 'Todas las prioridades', value: null as string | null }, ...opciones(PRIORIDAD)];
  protected readonly fmtPesos = fmtPesos;
  protected readonly fmtPesosEje = fmtPesosEje;
  protected readonly fmtDias = (v: number | null | undefined) => (v == null ? '—' : `${fmtEntero(v)} d`);
  protected readonly fmtEjeDias = (v: number) => `${v} d`;
  protected readonly fmtCantidad = (v: number | null | undefined) => (v == null ? '—' : fmtEntero(v));
  protected readonly fmtEjeCantidad = (v: number) => String(v);

  /** Matriz de riesgo: filas de impacto (alto arriba) × columnas de probabilidad. */
  protected readonly impactos = [
    { clave: 'ALTO', nombre: 'Alto' },
    { clave: 'MEDIO', nombre: 'Medio' },
    { clave: 'BAJO', nombre: 'Bajo' },
  ];
  protected readonly probabilidades = [
    { clave: 'BAJA', nombre: 'Baja' },
    { clave: 'MEDIA', nombre: 'Media' },
    { clave: 'ALTA', nombre: 'Alta' },
  ];

  constructor() {
    effect(() => {
      const id = this.ctx.proyectoId();
      if (id != null) untracked(() => this.cargar());
    });
  }

  protected cargar(): void {
    const pid = this.ctx.proyectoId();
    if (pid == null) return;
    this.cargando.set(true);
    this.error.set(null);
    const f = this.filtro;
    this.hayFiltro.set(!!f.tipo || !!f.prioridad || !!f.desde || !!f.hasta);
    this.servicio.cambio({ proyectoId: pid, tipo: f.tipo, prioridad: f.prioridad, desde: f.desde || null, hasta: f.hasta || null }).subscribe({
      next: (d) => {
        this.datos.set(d);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  protected limpiar(): void {
    this.filtro = { tipo: null, prioridad: null, desde: '', hasta: '' };
    this.cargar();
  }

  protected celda(p: string, i: string) {
    return this.datos()?.matrizRiesgo.find((m) => m.probabilidad === p && m.impacto === i) ?? { probabilidad: p, impacto: i, cantidad: 0, solicitudes: [] };
  }

  private readonly maxMatriz = computed(() => Math.max(1, ...(this.datos()?.matrizRiesgo.map((m) => m.cantidad) ?? [0])));

  protected fondo(cantidad: number): string {
    if (cantidad <= 0) return 'transparent';
    const i = Math.max(1, Math.round((cantidad / this.maxMatriz()) * (RAMPA.length - 1)));
    return RAMPA[i];
  }

  protected tinta(cantidad: number): string {
    return cantidad <= 0 ? 'var(--gp-text-muted)' : tintaSobre(this.fondo(cantidad));
  }

  protected critica(p: string, i: string): boolean {
    const v = ({ BAJA: 1, MEDIA: 2, ALTA: 3 } as Record<string, number>)[p] * ({ BAJO: 1, MEDIO: 2, ALTO: 3 } as Record<string, number>)[i];
    return v >= 6;
  }

  private barras(c: Conteo[], nombre: string) {
    return { categorias: c.map((x) => x.nombre), series: [{ nombre, color: SERIE.plan, valores: c.map((x) => x.cantidad) }] as SerieBarras[] };
  }

  protected readonly porEstado = computed(() => (this.datos() ? this.barras(this.datos()!.porEstado, 'Solicitudes') : null));
  protected readonly porTipo = computed(() => (this.datos() ? this.barras(this.datos()!.porTipo, 'Solicitudes') : null));
  protected readonly porEtapa = computed(() => (this.datos() ? this.barras(this.datos()!.porEtapa.filter((e) => e.cantidad > 0), 'Solicitudes') : null));

  protected readonly tiempos = computed(() => {
    const d = this.datos();
    if (!d || d.tiempos.length === 0) return null;
    return {
      categorias: d.tiempos.map((t) => t.codigo),
      series: [
        { nombre: 'Evaluación (registro → decisión)', color: SERIE.plan, valores: d.tiempos.map((t) => t.diasEvaluacion) },
        { nombre: 'Implementación (decisión → cierre)', color: SERIE.real, valores: d.tiempos.map((t) => t.diasImplementacion) },
      ] as SerieBarras[],
    };
  });

  protected readonly costos = computed(() => {
    const d = this.datos();
    if (!d || d.costos.length === 0) return null;
    return {
      categorias: d.costos.map((t) => t.codigo),
      series: [
        { nombre: 'Estimado', color: SERIE.plan, valores: d.costos.map((t) => t.estimado) },
        { nombre: 'Real', color: SERIE.real, valores: d.costos.map((t) => t.real) },
      ] as SerieBarras[],
    };
  });

  protected readonly etapas = computed(() => {
    const d = this.datos();
    if (!d) return { filas: [] as { etiqueta: string; segmentos: Segmento[] }[], escala: 1 };
    const filas = d.cumplimientoEtapas.map((e) => ({
      etiqueta: `${e.numero}. ${e.nombre}`,
      segmentos: [
        { nombre: 'A tiempo', color: ESTADO.ok, valor: e.aTiempo },
        { nombre: 'Fuera de plazo', color: ESTADO.warn, valor: e.tarde },
        { nombre: 'Vencida en curso', color: ESTADO.danger, valor: e.vencidas },
        { nombre: 'En curso a tiempo', color: '#a9c8c9', valor: e.enCurso },
      ],
    }));
    const escala = Math.max(1, ...filas.map((f) => f.segmentos.reduce((a, s) => a + s.valor, 0)));
    return { filas, escala };
  });
}

import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { SelectorProyecto } from '../../../../shared/ui/selector-proyecto/selector-proyecto';
import { StatusBadge, Tono } from '../../../../shared/ui/status-badge/status-badge';
import { ClpPipe } from '../../../../shared/pipes/clp.pipe';
import { GraficoLineas, SerieLinea } from '../../../../shared/graficos/grafico-lineas';
import { GraficoBarras, SerieBarras } from '../../../../shared/graficos/grafico-barras';
import { SERIE } from '../../../../shared/graficos/paleta';
import { contextoProyecto } from '../../../../shared/util/contexto-proyecto';
import { fmtFechaCorta, fmtPesos, fmtPesosEje, fmtPorcentaje, hoyIso } from '../../../../shared/util/formato';
import { mensajeDeError } from '../../../../core/api/api-error';
import { TablerosService } from '../../data/tableros.service';
import { TableroProyecto as Tablero } from '../../models/tablero.model';
import { KpiMosaico } from '../../ui/kpi-mosaico/kpi-mosaico';
import { ListaAlertas } from '../../ui/lista-alertas/lista-alertas';

@Component({
  selector: 'gp-tablero-proyecto',
  imports: [
    DatePipe, DecimalPipe, RouterLink, FormsModule, ButtonModule, InputTextModule, MessageModule, ProgressBarModule,
    SelectModule, SkeletonModule, TableModule, PageHeader, SelectorProyecto, StatusBadge, ClpPipe, GraficoLineas,
    GraficoBarras, KpiMosaico, ListaAlertas,
  ],
  templateUrl: './tablero-proyecto.html',
  styleUrl: './tablero-proyecto.scss',
})
export class TableroProyecto {
  protected readonly ctx = contextoProyecto();
  private readonly servicio = inject(TablerosService);

  protected readonly datos = signal<Tablero | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected filtro = { etapaId: null as number | null, responsableId: null as number | null, desde: '', hasta: '' };
  protected readonly hayFiltro = signal(false);

  protected readonly fmtPct = fmtPorcentaje;
  protected readonly fmtPesos = fmtPesos;
  protected readonly fmtPesosEje = fmtPesosEje;
  protected readonly fmtEjePct = (v: number) => `${v} %`;

  constructor() {
    effect(() => {
      const id = this.ctx.proyectoId();
      if (id != null)
        untracked(() => {
          this.filtro = { etapaId: null, responsableId: null, desde: '', hasta: '' };
          this.cargar();
        });
    });
  }

  protected cargar(): void {
    const pid = this.ctx.proyectoId();
    if (pid == null) return;
    this.cargando.set(true);
    this.error.set(null);
    const f = this.filtro;
    this.hayFiltro.set(f.etapaId != null || f.responsableId != null || !!f.desde || !!f.hasta);
    this.servicio.proyecto({ proyectoId: pid, etapaId: f.etapaId, responsableId: f.responsableId, desde: f.desde || null, hasta: f.hasta || null }).subscribe({
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
    this.filtro = { etapaId: null, responsableId: null, desde: '', hasta: '' };
    this.cargar();
  }

  protected readonly opEtapa = computed(() => [{ label: 'Todas las etapas', value: null as number | null }, ...(this.datos()?.opcionesEtapa ?? []).map((o) => ({ label: o.nombre, value: o.id as number | null }))]);
  protected readonly opResponsable = computed(() => [
    { label: 'Todos los responsables', value: null as number | null },
    ...(this.datos()?.opcionesResponsable ?? []).map((o) => ({ label: o.nombre, value: o.id as number | null })),
  ]);

  protected readonly curva = computed(() => {
    const d = this.datos();
    if (!d || d.curva.length < 2) return null;
    const hoy = hoyIso();
    const marca = d.curva.reduce((m, p, i) => (p.semana <= hoy ? i : m), -1);
    const series: SerieLinea[] = [
      { nombre: 'Avance planificado', color: SERIE.plan, valores: d.curva.map((p) => p.avancePlanificado), area: true },
      { nombre: 'Avance real', color: SERIE.real, valores: d.curva.map((p) => p.avanceReal) },
    ];
    return { etiquetas: d.curva.map((p) => fmtFechaCorta(p.semana)), series, marca: marca >= 0 && marca < d.curva.length - 1 ? marca : null };
  });

  protected readonly avanceEtapas = computed(() => {
    const d = this.datos();
    if (!d) return null;
    return {
      categorias: d.etapas.map((e) => `${e.codigoEdt}. ${e.nombre}`),
      series: [
        { nombre: 'Planificado a hoy', color: SERIE.plan, valores: d.etapas.map((e) => e.avancePlanificado) },
        { nombre: 'Real', color: SERIE.real, valores: d.etapas.map((e) => e.avance) },
      ] as SerieBarras[],
    };
  });

  protected readonly costoEtapas = computed(() => {
    const d = this.datos();
    if (!d) return null;
    return {
      categorias: d.etapas.map((e) => `${e.codigoEdt}. ${e.nombre}`),
      series: [
        { nombre: 'Planificado', color: SERIE.plan, valores: d.etapas.map((e) => e.costoPlan) },
        { nombre: 'Real', color: SERIE.real, valores: d.etapas.map((e) => e.costoReal) },
      ] as SerieBarras[],
    };
  });

  protected readonly actividadesFoco = computed(() => {
    const d = this.datos();
    if (!d) return [];
    const orden = { ATRASADA: 0, EN_CURSO: 1, PENDIENTE: 2, TERMINADA: 3 } as const;
    return [...d.actividades].filter((a) => a.estado !== 'TERMINADA').sort((a, b) => orden[a.estado] - orden[b.estado] || b.diasAtraso - a.diasAtraso);
  });

  protected readonly cargaResumen = computed(() => {
    const d = this.datos();
    if (!d) return [];
    return d.carga
      .map((p) => {
        const pico = p.semanas.reduce((m, s) => Math.max(m, s.disponibles > 0 ? (s.horas / s.disponibles) * 100 : 0), 0);
        return { id: p.profesionalId, nombre: p.nombre, pico, sobre: p.semanas.filter((s) => s.sobreasignada).length };
      })
      .sort((a, b) => b.sobre - a.sobre || b.pico - a.pico);
  });

  protected estadoActividad(e: string): { etiqueta: string; tono: Tono } {
    return (
      {
        ATRASADA: { etiqueta: 'Atrasada', tono: 'danger' as Tono },
        EN_CURSO: { etiqueta: 'En curso', tono: 'accent' as Tono },
        PENDIENTE: { etiqueta: 'Por iniciar', tono: 'neutral' as Tono },
        TERMINADA: { etiqueta: 'Terminada', tono: 'ok' as Tono },
      } as Record<string, { etiqueta: string; tono: Tono }>
    )[e];
  }

  protected estadoHito(e: string): { etiqueta: string; tono: Tono } {
    return (
      {
        PENDIENTE: { etiqueta: 'Pendiente', tono: 'accent' as Tono },
        ATRASADO: { etiqueta: 'Atrasado', tono: 'danger' as Tono },
        CUMPLIDO: { etiqueta: 'Cumplido', tono: 'ok' as Tono },
        CANCELADO: { etiqueta: 'Cancelado', tono: 'neutral' as Tono },
      } as Record<string, { etiqueta: string; tono: Tono }>
    )[e] ?? { etiqueta: e, tono: 'neutral' };
  }
}

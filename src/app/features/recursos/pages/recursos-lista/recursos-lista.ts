import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { SelectorProyecto } from '../../../../shared/ui/selector-proyecto/selector-proyecto';
import { ClpPipe } from '../../../../shared/pipes/clp.pipe';
import { GraficoBarras, SerieBarras } from '../../../../shared/graficos/grafico-barras';
import { SERIE } from '../../../../shared/graficos/paleta';
import { fmtPesos, fmtPesosEje } from '../../../../shared/util/formato';
import { contextoProyecto } from '../../../../shared/util/contexto-proyecto';
import { mensajeDeError } from '../../../../core/api/api-error';
import { AuthService } from '../../../../core/auth/auth.service';
import { RecursosService } from '../../data/recursos.service';
import { Costos, ProfesionalFicha, TIPO_COSTO, TipoProfesional } from '../../models/recurso.model';
import { AsignacionesProfesional } from '../../ui/asignaciones-profesional/asignaciones-profesional';
import { RecursosMateriales } from '../../ui/recursos-materiales/recursos-materiales';
import { Requerimientos } from '../../ui/requerimientos/requerimientos';
import { CargaSemanal } from '../../ui/carga-semanal/carga-semanal';
import { CatalogoProfesionales } from '../../ui/catalogo-profesionales/catalogo-profesionales';

@Component({
  selector: 'gp-recursos-lista',
  imports: [
    DecimalPipe, RouterLink, ButtonModule, MessageModule, SkeletonModule, TabsModule, TableModule, ToastModule,
    ConfirmDialogModule, PageHeader, SelectorProyecto, ClpPipe, GraficoBarras, AsignacionesProfesional,
    RecursosMateriales, Requerimientos, CargaSemanal, CatalogoProfesionales,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './recursos-lista.html',
  styleUrl: './recursos-lista.scss',
})
export class RecursosLista {
  protected readonly ctx = contextoProyecto();
  private readonly servicio = inject(RecursosService);
  protected readonly esAdmin = inject(AuthService).esAdmin;

  protected readonly costos = signal<Costos | null>(null);
  protected readonly profesionales = signal<ProfesionalFicha[]>([]);
  protected readonly tipos = signal<TipoProfesional[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly pestana = signal<string | number | undefined>('costos');
  protected readonly soloEtapas = signal(false);

  protected readonly fmtPesos = fmtPesos;
  protected readonly fmtPesosEje = fmtPesosEje;

  constructor() {
    effect(() => {
      const id = this.ctx.proyectoId();
      if (id != null) untracked(() => this.cargar(id));
    });
    this.cargarCatalogo();
  }

  protected cargar(id: number): void {
    this.cargando.set(true);
    this.error.set(null);
    this.servicio.costos(id).subscribe({
      next: (c) => {
        this.costos.set(c);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  protected cargarCatalogo(): void {
    this.servicio.profesionales(true).subscribe({ next: (p) => this.profesionales.set(p), error: () => {} });
    this.servicio.tipos().subscribe({ next: (t) => this.tipos.set(t), error: () => {} });
  }

  protected actualizado(c: Costos): void {
    this.costos.set(c);
  }

  protected readonly porTipo = computed(() => {
    const c = this.costos();
    if (!c) return null;
    const filas = c.porTipo.filter((t) => t.costoPlan > 0 || t.costoReal > 0);
    return {
      categorias: filas.map((t) => TIPO_COSTO[t.tipo] ?? t.tipo),
      series: [
        { nombre: 'Planificado', color: SERIE.plan, valores: filas.map((t) => t.costoPlan) },
        { nombre: 'Real', color: SERIE.real, valores: filas.map((t) => t.costoReal) },
      ] as SerieBarras[],
    };
  });

  protected readonly porEtapa = computed(() => {
    const c = this.costos();
    if (!c) return null;
    const etapas = c.actividades.filter((a) => a.nivel === 0);
    return {
      categorias: etapas.map((e) => `${e.codigoEdt}. ${e.nombre}`),
      series: [
        { nombre: 'Planificado', color: SERIE.plan, valores: etapas.map((e) => e.costoPlan) },
        { nombre: 'Real', color: SERIE.real, valores: etapas.map((e) => e.costoReal) },
      ] as SerieBarras[],
    };
  });

  protected readonly filasCosto = computed(() => {
    const c = this.costos();
    if (!c) return [];
    return this.soloEtapas() ? c.actividades.filter((a) => a.nivel < 2) : c.actividades;
  });

  protected readonly avisos = computed(() => {
    const c = this.costos();
    if (!c) return { sobre: 0, profesionalesSobre: 0, faltantes: 0 };
    return {
      sobre: c.sobreasignaciones.length,
      profesionalesSobre: new Set(c.sobreasignaciones.map((s) => s.profesionalId)).size,
      faltantes: c.requerimientos.filter((r) => !r.cubierto).length,
    };
  });

  /** Desviación de costo (CV invertido): real − valor ganado. Positivo = gasta más de lo que avanza. */
  protected desviacion(a: { costoPlan: number; costoReal: number; avance: number }): number {
    return Math.round(a.costoReal - (a.costoPlan * a.avance) / 100);
  }

  protected usoPresupuesto(c: Costos): number {
    return c.presupuesto > 0 ? (c.costoPlan / c.presupuesto) * 100 : 0;
  }
}

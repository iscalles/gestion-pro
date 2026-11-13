import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { SelectorProyecto } from '../../../../shared/ui/selector-proyecto/selector-proyecto';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { SEMAFORO, Semaforo, SemaforoBadge } from '../../../../shared/ui/semaforo/semaforo';
import { Evidencias } from '../../../../shared/ui/evidencias/evidencias';
import { Resaltar } from '../../../../shared/ui/movimiento/resaltar';
import { DibujoUnico } from '../../../../shared/ui/movimiento/dibujo-unico';
import { contextoProyecto } from '../../../../shared/util/contexto-proyecto';
import { fmtValorKpi, hoyIso } from '../../../../shared/util/formato';
import { erroresDeCampos, mensajeDeError } from '../../../../core/api/api-error';
import { PlanificacionService } from '../../../actividades/data/planificacion.service';
import { Actividad } from '../../../actividades/models/planificacion.model';
import { RecursosService } from '../../../recursos/data/recursos.service';
import { ProfesionalFicha } from '../../../recursos/models/recurso.model';
import { KpiService } from '../../../kpi/data/kpi.service';
import { Kpi } from '../../../kpi/models/kpi.model';
import { HitosService } from '../../data/hitos.service';
import { ESTADO_HITO, EstadoHito, Hito, HitoRequest } from '../../models/hito.model';

interface FormHito {
  codigo: string;
  descripcion: string;
  responsableId: number | null;
  fechaComprometida: string;
  estado: EstadoHito;
  fechaReal: string;
  actividadIds: number[];
  kpiIds: number[];
  criterios: { id: number | null; descripcion: string; cumplido: boolean }[];
}

@Component({
  selector: 'gp-hitos-lista',
  imports: [
    DatePipe, FormsModule, TableModule, ButtonModule, CheckboxModule, DialogModule, InputTextModule, MessageModule,
    MultiSelectModule, ProgressBarModule, SelectModule, SkeletonModule, ToastModule, ConfirmDialogModule, TooltipModule,
    PageHeader, SelectorProyecto, StatusBadge, SemaforoBadge, Evidencias, Resaltar, DibujoUnico,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './hitos-lista.html',
  styleUrl: './hitos-lista.scss',
})
export class HitosLista {
  protected readonly ctx = contextoProyecto();
  private readonly servicio = inject(HitosService);
  private readonly planificacion = inject(PlanificacionService);
  private readonly recursos = inject(RecursosService);
  private readonly kpiServicio = inject(KpiService);
  private readonly mensajes = inject(MessageService);
  private readonly confirmacion = inject(ConfirmationService);

  protected readonly hitos = signal<Hito[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly seleccionId = signal<number | null>(null);
  protected readonly seleccion = computed(() => this.hitos().find((h) => h.id === this.seleccionId()) ?? null);

  private readonly actividades = signal<Actividad[]>([]);
  private readonly profesionales = signal<ProfesionalFicha[]>([]);
  private readonly kpis = signal<Kpi[]>([]);

  protected readonly estado = (h: Hito) => ESTADO_HITO[h.estadoCalculado];
  protected readonly fmtKpi = fmtValorKpi;
  protected readonly hoy = hoyIso();
  protected readonly semaforoTono = (s: Semaforo | null) => (s ? SEMAFORO[s].tono : 'neutral');
  protected readonly semaforoTexto = (s: Semaforo | null) => (s ? SEMAFORO[s].etiqueta : 'Sin datos');

  constructor() {
    effect(() => {
      const id = this.ctx.proyectoId();
      if (id != null) untracked(() => this.cargar(id, true));
    });
    this.recursos.profesionales(true).subscribe({ next: (p) => this.profesionales.set(p), error: () => {} });
  }

  protected cargar(id: number, cambioProyecto = false): void {
    this.cargando.set(true);
    this.error.set(null);
    if (cambioProyecto) {
      this.hitos.set([]);
      this.seleccionId.set(null);
    }
    this.servicio.listar(id).subscribe({
      next: (hs) => {
        this.hitos.set(hs);
        this.cargando.set(false);
        if (this.seleccionId() == null && hs.length) this.seleccionId.set(hs[0].id);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  private reemplazar(h: Hito): void {
    this.hitos.update((hs) => (hs.some((x) => x.id === h.id) ? hs.map((x) => (x.id === h.id ? h : x)) : [...hs, h]));
  }

  protected readonly resumen = computed(() => {
    const hs = this.hitos();
    const cumplidos = hs.filter((h) => h.estado === 'CUMPLIDO');
    return {
      total: hs.length,
      cumplidos: cumplidos.length,
      enPlazo: cumplidos.length ? Math.round((cumplidos.filter((h) => h.cumplidoEnPlazo).length / cumplidos.length) * 100) : null,
      atrasados: hs.filter((h) => h.estadoCalculado === 'ATRASADO').length,
      enRiesgo: hs.filter((h) => h.enRiesgo && h.estadoCalculado !== 'ATRASADO').length,
    };
  });

  // ---------------------------------------------------------------- criterios

  protected marcar(h: Hito, criterioId: number, cumplido: boolean): void {
    this.servicio.marcarCriterio(this.ctx.proyectoId()!, h.id, criterioId, cumplido).subscribe({
      next: (r) => this.reemplazar(r),
      error: (e) => {
        this.mensajes.add({ severity: 'error', summary: 'No se pudo actualizar el criterio', detail: mensajeDeError(e), life: 8000 });
        this.cargar(this.ctx.proyectoId()!);
      },
    });
  }

  // ---------------------------------------------------------------- cumplir

  protected readonly cumplir = signal<Hito | null>(null);
  protected fechaCumplido = hoyIso();
  protected readonly errorCumplir = signal<string | null>(null);

  protected abrirCumplir(h: Hito): void {
    this.fechaCumplido = hoyIso();
    this.errorCumplir.set(null);
    this.cumplir.set(h);
  }

  protected confirmarCumplir(): void {
    const h = this.cumplir();
    if (!h) return;
    this.guardando.set(true);
    this.servicio.guardar(this.ctx.proyectoId()!, h.id, { ...this.requestDe(h), estado: 'CUMPLIDO', fechaReal: this.fechaCumplido }).subscribe({
      next: (r) => {
        this.guardando.set(false);
        this.cumplir.set(null);
        this.reemplazar(r);
        this.mensajes.add({ severity: 'success', summary: `${r.codigo} cumplido`, detail: r.cumplidoEnPlazo ? 'Dentro del plazo comprometido.' : 'Fuera del plazo comprometido.' });
      },
      error: (e) => {
        this.guardando.set(false);
        this.errorCumplir.set(mensajeDeError(e));
      },
    });
  }

  protected reabrir(h: Hito): void {
    this.servicio.guardar(this.ctx.proyectoId()!, h.id, { ...this.requestDe(h), estado: 'PENDIENTE', fechaReal: null }).subscribe({
      next: (r) => {
        this.reemplazar(r);
        this.mensajes.add({ severity: 'info', summary: `${r.codigo} vuelve a pendiente` });
      },
      error: (e) => this.mensajes.add({ severity: 'error', summary: 'No se pudo reabrir', detail: mensajeDeError(e) }),
    });
  }

  private requestDe(h: Hito): HitoRequest {
    return {
      codigo: h.codigo,
      descripcion: h.descripcion,
      responsableId: h.responsableId,
      fechaComprometida: h.fechaComprometida,
      fechaReal: h.fechaReal,
      estado: h.estado,
      actividadIds: h.actividadIds,
      criterios: h.criterios.map((c) => ({ id: c.id, descripcion: c.descripcion, cumplido: c.cumplido })),
      kpiIds: h.kpis.map((k) => k.id),
    };
  }

  // ---------------------------------------------------------------- crear / editar

  protected readonly dialogo = signal(false);
  protected readonly editando = signal<Hito | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorForm = signal<string | null>(null);
  protected readonly errores = signal<Record<string, string>>({});
  protected form: FormHito = this.vacio();

  protected readonly opcionesActividades = computed(() =>
    this.actividades().map((a) => ({ label: `${a.codigoEdt} ${a.nombre}`, value: a.id })),
  );
  protected readonly opcionesResponsables = computed(() =>
    this.profesionales()
      .filter((p) => p.activo || p.id === this.editando()?.responsableId)
      .map((p) => ({ label: `${p.nombre} · ${p.especialidad}`, value: p.id })),
  );
  protected readonly opcionesKpi = computed(() => this.kpis().map((k) => ({ label: `${k.codigo} ${k.nombre}`, value: k.id })));
  protected readonly opcionesEstado = [
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Cumplido', value: 'CUMPLIDO' },
    { label: 'Cancelado', value: 'CANCELADO' },
  ];

  private vacio(): FormHito {
    return {
      codigo: `H-${String(this.hitos().length + 1).padStart(2, '0')}`,
      descripcion: '',
      responsableId: null,
      fechaComprometida: hoyIso(),
      estado: 'PENDIENTE',
      fechaReal: hoyIso(),
      actividadIds: [],
      kpiIds: [],
      criterios: [{ id: null, descripcion: '', cumplido: false }],
    };
  }

  protected abrir(h: Hito | null): void {
    const pid = this.ctx.proyectoId()!;
    this.editando.set(h);
    this.errorForm.set(null);
    this.errores.set({});
    this.form = h
      ? {
          codigo: h.codigo,
          descripcion: h.descripcion,
          responsableId: h.responsableId,
          fechaComprometida: h.fechaComprometida,
          estado: h.estado,
          fechaReal: h.fechaReal ?? hoyIso(),
          actividadIds: [...h.actividadIds],
          kpiIds: h.kpis.map((k) => k.id),
          criterios: h.criterios.map((c) => ({ id: c.id, descripcion: c.descripcion, cumplido: c.cumplido })),
        }
      : this.vacio();
    forkJoin({ plan: this.planificacion.plan(pid), kpis: this.kpiServicio.listar(pid, 'PROYECTO') }).subscribe({
      next: ({ plan, kpis }) => {
        this.actividades.set(plan.actividades);
        this.kpis.set(kpis);
      },
      error: () => {},
    });
    this.dialogo.set(true);
  }

  protected agregarCriterio(): void {
    this.form.criterios = [...this.form.criterios, { id: null, descripcion: '', cumplido: false }];
  }

  protected quitarCriterio(i: number): void {
    this.form.criterios = this.form.criterios.filter((_, j) => j !== i);
  }

  protected guardar(): void {
    const h = this.editando();
    const f = this.form;
    const datos: HitoRequest = {
      codigo: f.codigo,
      descripcion: f.descripcion,
      responsableId: f.responsableId as number,
      fechaComprometida: f.fechaComprometida,
      estado: f.estado,
      fechaReal: f.estado === 'CUMPLIDO' ? f.fechaReal : null,
      actividadIds: f.actividadIds,
      kpiIds: f.kpiIds,
      criterios: f.criterios.filter((c) => c.descripcion.trim()).map((c) => ({ ...c, descripcion: c.descripcion.trim() })),
    };
    this.guardando.set(true);
    this.errorForm.set(null);
    this.errores.set({});
    this.servicio.guardar(this.ctx.proyectoId()!, h?.id ?? null, datos).subscribe({
      next: (r) => {
        this.guardando.set(false);
        this.dialogo.set(false);
        this.reemplazar(r);
        this.hitos.update((hs) => [...hs].sort((a, b) => a.fechaComprometida.localeCompare(b.fechaComprometida) || a.codigo.localeCompare(b.codigo)));
        this.seleccionId.set(r.id);
        this.mensajes.add({ severity: 'success', summary: h ? 'Hito actualizado' : 'Hito creado', detail: `${r.codigo} · ${r.descripcion}` });
      },
      error: (e) => {
        this.guardando.set(false);
        this.errores.set(erroresDeCampos(e));
        this.errorForm.set(mensajeDeError(e));
      },
    });
  }

  protected eliminar(h: Hito): void {
    this.confirmacion.confirm({
      header: 'Eliminar hito',
      message: `¿Eliminar ${h.codigo} · ${h.descripcion}? Se borran sus criterios y evidencias.`,
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { outlined: true },
      accept: () =>
        this.servicio.eliminar(this.ctx.proyectoId()!, h.id).subscribe({
          next: () => {
            this.hitos.update((hs) => hs.filter((x) => x.id !== h.id));
            if (this.seleccionId() === h.id) this.seleccionId.set(this.hitos()[0]?.id ?? null);
            this.mensajes.add({ severity: 'success', summary: 'Hito eliminado', detail: h.codigo });
          },
          error: (e) => this.mensajes.add({ severity: 'error', summary: 'No se pudo eliminar', detail: mensajeDeError(e), life: 8000 }),
        }),
    });
  }

  protected urlEvidencias(h: Hito): string {
    return this.servicio.urlEvidencias(this.ctx.proyectoId()!, h.id);
  }
}

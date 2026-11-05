import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { AuthService } from '../../../../core/auth/auth.service';
import { erroresDeCampos, mensajeDeError } from '../../../../core/api/api-error';
import { ProyectosService } from '../../../proyectos/data/proyectos.service';
import { Proyecto } from '../../../proyectos/models/proyecto.model';
import { PlanificacionService } from '../../data/planificacion.service';
import {
  Actividad,
  Plan,
  PlanCambio,
  Profesional,
  TIPO_ACTIVIDAD,
  tipoHijo,
} from '../../models/planificacion.model';
import { DetalleActividad } from '../../ui/detalle-actividad/detalle-actividad';
import { CalendarioLaboral } from '../../ui/calendario-laboral/calendario-laboral';

@Component({
  selector: 'gp-actividades-lista',
  imports: [
    DatePipe,
    RouterLink,
    FormsModule,
    TableModule,
    ButtonModule,
    SelectModule,
    ProgressBarModule,
    MessageModule,
    SkeletonModule,
    TabsModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    PageHeader,
    DetalleActividad,
    CalendarioLaboral,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './actividades-lista.html',
  styleUrl: './actividades-lista.scss',
})
export class ActividadesLista {
  /** ?proyecto=ID (lo enlaza el router con withComponentInputBinding). */
  readonly proyecto = input<string>();

  private readonly router = inject(Router);
  private readonly proyectosServicio = inject(ProyectosService);
  private readonly servicio = inject(PlanificacionService);
  private readonly mensajes = inject(MessageService);
  private readonly confirmacion = inject(ConfirmationService);
  protected readonly esAdmin = inject(AuthService).esAdmin;

  protected readonly proyectos = signal<Proyecto[]>([]);
  protected readonly profesionales = signal<Profesional[]>([]);
  protected readonly plan = signal<Plan | null>(null);
  protected readonly cargando = signal(true);
  protected readonly cargandoPlan = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly seleccionId = signal<number | null>(null);
  protected readonly plegadas = signal<Set<number>>(new Set());
  protected readonly pestana = signal<'detalle' | 'calendario'>('detalle');

  protected readonly tipoEtiqueta = TIPO_ACTIVIDAD;

  protected readonly proyectoId = computed(() => {
    const ps = this.proyectos();
    const pedido = Number(this.proyecto());
    return ps.some((p) => p.id === pedido) ? pedido : (ps[0]?.id ?? null);
  });
  protected readonly proyectoActual = computed(
    () => this.proyectos().find((p) => p.id === this.proyectoId()) ?? null,
  );
  protected readonly opcionesProyecto = computed(() =>
    this.proyectos().map((p) => ({ label: `${p.codigo} · ${p.nombre}`, value: p.id })),
  );

  constructor() {
    forkJoin([this.proyectosServicio.listar(), this.servicio.profesionales()]).subscribe({
      next: ([ps, profs]) => {
        this.proyectos.set(ps);
        this.profesionales.set(profs);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });

    effect(() => {
      const id = this.proyectoId();
      if (id != null) untracked(() => this.cargarPlan(id, true));
    });
  }

  protected cambiarProyecto(id: number): void {
    this.router.navigate([], { queryParams: { proyecto: id }, replaceUrl: true });
  }

  protected cargarPlan(id: number, reiniciar = false): void {
    this.cargandoPlan.set(true);
    this.error.set(null);
    this.servicio.plan(id).subscribe({
      next: (p) => {
        this.plan.set(p);
        if (reiniciar) {
          this.plegadas.set(new Set());
          this.seleccionId.set(
            p.actividades.find((a) => a.esHoja && !a.fechaTerminoReal)?.id ??
              p.actividades[0]?.id ??
              null,
          );
        }
        this.cargandoPlan.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargandoPlan.set(false);
      },
    });
  }

  protected reintentar(): void {
    const id = this.proyectoId();
    if (id != null) this.cargarPlan(id, true);
    else location.reload();
  }

  // ------------------------------------------------------------- árbol

  protected readonly actividades = computed(() => this.plan()?.actividades ?? []);
  protected readonly dependencias = computed(() => this.plan()?.dependencias ?? []);
  private readonly porId = computed(() => new Map(this.actividades().map((a) => [a.id, a])));

  /** Filas visibles: se ocultan los descendientes de los elementos plegados. */
  protected readonly filas = computed(() => {
    const plegadas = this.plegadas();
    const porId = this.porId();
    return this.actividades().filter((a) => {
      for (let p = a.padreId; p != null; p = porId.get(p)?.padreId ?? null) {
        if (plegadas.has(p)) return false;
      }
      return true;
    });
  });

  protected readonly seleccion = computed(() => {
    const id = this.seleccionId();
    return id == null ? null : (this.porId().get(id) ?? null);
  });
  protected readonly padreSeleccion = computed(() => {
    const p = this.seleccion()?.padreId;
    return p == null ? null : (this.porId().get(p) ?? null);
  });

  protected readonly resumen = computed(() => {
    const as = this.actividades();
    const hojas = as.filter((a) => a.esHoja);
    const inicio =
      as
        .map((a) => a.fechaInicioPlan)
        .filter((f): f is string => !!f)
        .sort()[0] ?? null;
    const termino =
      as
        .map((a) => a.fechaTerminoPlan)
        .filter((f): f is string => !!f)
        .sort()
        .at(-1) ?? null;
    return {
      etapas: as.filter((a) => a.tipo === 'ETAPA').length,
      elementos: as.length,
      atrasadas: hojas.filter((a) => a.atrasada).length,
      inicio,
      termino,
      avance: this.proyectoActual()?.avance ?? 0,
    };
  });

  protected alternar(a: Actividad, evento?: Event): void {
    evento?.stopPropagation();
    this.plegadas.update((s) => {
      const n = new Set(s);
      if (n.has(a.id)) n.delete(a.id);
      else n.add(a.id);
      return n;
    });
  }

  protected plegarTodo(plegar: boolean): void {
    this.plegadas.set(
      plegar
        ? new Set(
            this.actividades()
              .filter((a) => !a.esHoja && a.tipo === 'ETAPA')
              .map((a) => a.id),
          )
        : new Set(),
    );
  }

  protected seleccionar(a: Actividad): void {
    this.seleccionId.set(a.id);
    this.pestana.set('detalle');
  }

  protected cantidadDescendientes(a: Actividad): number {
    const porId = this.porId();
    return this.actividades().filter((x) => {
      for (let p = x.padreId; p != null; p = porId.get(p)?.padreId ?? null)
        if (p === a.id) return true;
      return false;
    }).length;
  }

  // ------------------------------------------------------------- resultados

  protected alAplicar(r: PlanCambio, titulo = 'Cambios guardados'): void {
    this.plan.set(r.plan);
    this.refrescarAvanceProyecto();
    const n = r.recalculadas.length;
    const nombres = r.recalculadas
      .slice(0, 4)
      .map((c) => c.nombre)
      .join(', ');
    this.mensajes.add({
      severity: 'success',
      summary: titulo,
      detail:
        n === 0
          ? 'Las fechas planificadas no cambiaron.'
          : `Se recalcularon ${n === 1 ? '1 actividad' : n + ' actividades'}: ${nombres}${n > 4 ? '…' : '.'}`,
      life: 6000,
    });
  }

  protected alCambiarCalendario(mensaje: string): void {
    const id = this.proyectoId();
    if (id != null) this.cargarPlan(id);
    this.mensajes.add({
      severity: 'success',
      summary: mensaje,
      detail: 'Las fechas del proyecto se recalcularon.',
      life: 5000,
    });
  }

  /** El avance del proyecto lo recalcula el backend; se vuelve a pedir para el resumen. */
  private refrescarAvanceProyecto(): void {
    const id = this.proyectoId();
    if (id == null) return;
    this.proyectosServicio
      .obtener(id)
      .subscribe((p) => this.proyectos.update((ps) => ps.map((x) => (x.id === p.id ? p : x))));
  }

  // ------------------------------------------------------------- nueva actividad

  protected readonly dialogoVisible = signal(false);
  protected readonly nuevaPadreId = signal<number | null>(null);
  protected readonly nuevoNombre = signal('');
  protected readonly nuevoResponsableId = signal<number | null>(null);
  protected readonly nuevaDuracion = signal<number | null>(5);
  protected readonly creando = signal(false);
  protected readonly errorCreacion = signal<string | null>(null);
  protected readonly erroresCreacion = signal<Record<string, string>>({});

  /** Posibles padres: ninguno (etapa), etapas y actividades. Las que tienen dependencias no admiten hijos. */
  protected readonly opcionesPadre = computed(() => {
    const conDeps = new Set(this.dependencias().flatMap((d) => [d.predecesoraId, d.sucesoraId]));
    return [
      { label: 'Ninguno: crear una etapa', value: null, nivel: 0, disabled: false, nota: '' },
      ...this.actividades()
        .filter((a) => a.tipo !== 'SUBACTIVIDAD')
        .map((a) => ({
          label: a.nombre,
          value: a.id,
          nivel: a.nivel,
          disabled: a.esHoja && conDeps.has(a.id),
          nota: a.esHoja && conDeps.has(a.id) ? 'tiene dependencias' : TIPO_ACTIVIDAD[a.tipo],
        })),
    ];
  });

  protected readonly tipoNueva = computed(() => {
    const id = this.nuevaPadreId();
    const t = tipoHijo(id == null ? null : (this.porId().get(id) ?? null));
    return t ? TIPO_ACTIVIDAD[t] : '';
  });

  protected abrirNueva(padre?: Actividad | null): void {
    let p: Actividad | null = padre === undefined ? this.seleccion() : padre;
    // Desde una subactividad se agrega una hermana.
    if (p && p.tipo === 'SUBACTIVIDAD') p = this.porId().get(p.padreId!) ?? null;
    if (
      p &&
      p.esHoja &&
      this.dependencias().some((d) => d.predecesoraId === p!.id || d.sucesoraId === p!.id)
    ) {
      p = p.padreId == null ? null : (this.porId().get(p.padreId) ?? null);
    }
    this.nuevaPadreId.set(p?.id ?? null);
    this.nuevoNombre.set('');
    this.nuevoResponsableId.set(p?.responsableId ?? null);
    this.nuevaDuracion.set(5);
    this.errorCreacion.set(null);
    this.erroresCreacion.set({});
    this.dialogoVisible.set(true);
  }

  protected crear(): void {
    const pid = this.proyectoId();
    if (pid == null) return;
    const antes = new Set(this.actividades().map((a) => a.id));
    this.creando.set(true);
    this.errorCreacion.set(null);
    this.erroresCreacion.set({});
    this.servicio
      .crearActividad(pid, {
        padreId: this.nuevaPadreId(),
        nombre: this.nuevoNombre().trim(),
        responsableId: this.nuevoResponsableId(),
        duracionPlan: this.nuevaDuracion() ?? 0,
      })
      .subscribe({
        next: (r) => {
          this.creando.set(false);
          this.dialogoVisible.set(false);
          const nueva = r.plan.actividades.find((a) => !antes.has(a.id));
          if (nueva?.padreId != null) {
            this.plegadas.update((s) => {
              const n = new Set(s);
              n.delete(nueva.padreId!);
              return n;
            });
          }
          this.alAplicar(r, `${TIPO_ACTIVIDAD[nueva?.tipo ?? 'ACTIVIDAD']} creada`);
          if (nueva) this.seleccionId.set(nueva.id);
        },
        error: (e) => {
          this.creando.set(false);
          this.errorCreacion.set(mensajeDeError(e));
          this.erroresCreacion.set(erroresDeCampos(e));
        },
      });
  }

  protected readonly opcionesResponsable = computed(() => [
    { label: 'Sin responsable', value: null },
    ...this.profesionales().map((p) => ({ label: p.nombre, value: p.id })),
  ]);

  // ------------------------------------------------------------- eliminar

  protected confirmarEliminar(a: Actividad): void {
    const pid = this.proyectoId();
    if (pid == null) return;
    const n = this.cantidadDescendientes(a);
    const tipo = TIPO_ACTIVIDAD[a.tipo].toLowerCase();
    this.confirmacion.confirm({
      header: `Eliminar ${tipo}`,
      message:
        `Se eliminará «${a.nombre}»` +
        (n ? ` junto con ${n === 1 ? 'su elemento hijo' : 'sus ' + n + ' elementos hijos'}` : '') +
        ' y todas sus dependencias. Las sucesoras se recalcularán. Esta acción no se puede deshacer.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: `Eliminar ${tipo}`,
      rejectLabel: 'Conservar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      defaultFocus: 'reject',
      accept: () => {
        this.servicio.eliminarActividad(pid, a.id).subscribe({
          next: (r) => {
            this.seleccionId.set(a.padreId ?? r.plan.actividades[0]?.id ?? null);
            this.alAplicar(r, `«${a.nombre}» eliminada`);
          },
          error: (e) =>
            this.mensajes.add({
              severity: 'error',
              summary: 'No se pudo eliminar',
              detail: mensajeDeError(e),
              life: 8000,
            }),
        });
      },
    });
  }
}

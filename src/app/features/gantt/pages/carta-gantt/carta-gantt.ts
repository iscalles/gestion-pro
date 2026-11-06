import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, switchMap, map } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { DrawerModule } from 'primeng/drawer';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { mensajeDeError } from '../../../../core/api/api-error';
import { ProyectosService } from '../../../proyectos/data/proyectos.service';
import { Proyecto } from '../../../proyectos/models/proyecto.model';
import { PlanificacionService } from '../../../actividades/data/planificacion.service';
import { CalendariosService } from '../../../actividades/data/calendarios.service';
import {
  Plan,
  PlanCambio,
  Profesional,
  TIPO_ACTIVIDAD,
} from '../../../actividades/models/planificacion.model';
import { Calendario } from '../../../actividades/models/calendario.model';
import { DetalleActividad } from '../../../actividades/ui/detalle-actividad/detalle-actividad';
import { HitosService } from '../../../hitos/data/hitos.service';
import { Hito } from '../../../hitos/models/hito.model';
import { GanttChart } from '../../ui/gantt-chart/gantt-chart';
import { ZOOM, Zoom, diaDe, textoFecha } from '../../models/gantt.model';

const CLAVE_PREFERENCIAS = 'gp.gantt';

interface Preferencias {
  zoom: Zoom;
  real: boolean;
  vinculos: boolean;
}

/**
 * Carta Gantt del proyecto. Se genera desde el plan, los hitos y el calendario del backend; al editar
 * una actividad en el panel lateral, el backend recalcula y la carta se vuelve a dibujar.
 */
@Component({
  selector: 'gp-carta-gantt',
  imports: [
    RouterLink,
    FormsModule,
    ButtonModule,
    SelectModule,
    SelectButtonModule,
    ToggleSwitchModule,
    MessageModule,
    SkeletonModule,
    DrawerModule,
    ToastModule,
    TooltipModule,
    PageHeader,
    GanttChart,
    DetalleActividad,
  ],
  providers: [MessageService],
  templateUrl: './carta-gantt.html',
  styleUrl: './carta-gantt.scss',
})
export class CartaGantt {
  /** ?proyecto=ID */
  readonly proyecto = input<string>();

  private readonly router = inject(Router);
  private readonly proyectosServicio = inject(ProyectosService);
  private readonly planificacion = inject(PlanificacionService);
  private readonly calendarios = inject(CalendariosService);
  private readonly hitosServicio = inject(HitosService);
  private readonly mensajes = inject(MessageService);
  private readonly carta = viewChild(GanttChart);

  protected readonly proyectos = signal<Proyecto[]>([]);
  protected readonly profesionales = signal<Profesional[]>([]);
  protected readonly plan = signal<Plan | null>(null);
  protected readonly hitos = signal<Hito[]>([]);
  protected readonly calendario = signal<Calendario | null>(null);
  protected readonly cargando = signal(true);
  protected readonly cargandoPlan = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly seleccionId = signal<number | null>(null);

  private readonly preferencias = leerPreferencias();
  protected readonly zoom = signal<Zoom>(this.preferencias.zoom);
  protected readonly mostrarReal = signal(this.preferencias.real);
  protected readonly mostrarVinculos = signal(this.preferencias.vinculos);
  protected readonly opcionesZoom = (Object.keys(ZOOM) as Zoom[]).map((z) => ({
    label: ZOOM[z].etiqueta,
    value: z,
  }));

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
    forkJoin([this.proyectosServicio.listar(), this.planificacion.profesionales()]).subscribe({
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
      if (id != null) untracked(() => this.cargar(id));
    });

    effect(() => {
      const p: Preferencias = {
        zoom: this.zoom(),
        real: this.mostrarReal(),
        vinculos: this.mostrarVinculos(),
      };
      try {
        localStorage.setItem(CLAVE_PREFERENCIAS, JSON.stringify(p));
      } catch {
        /* sin almacenamiento: las preferencias duran solo esta visita */
      }
    });
  }

  protected cambiarProyecto(id: number): void {
    this.seleccionId.set(null);
    this.router.navigate([], { queryParams: { proyecto: id }, replaceUrl: true });
  }

  /** Plan y luego, con su calendario, hitos y días no laborables. */
  protected cargar(id: number): void {
    this.cargandoPlan.set(true);
    this.error.set(null);
    this.planificacion
      .plan(id)
      .pipe(
        switchMap((plan) =>
          forkJoin([
            this.hitosServicio.listar(id),
            this.calendarios.obtener(plan.calendarioId),
          ]).pipe(map(([hitos, cal]) => ({ plan, hitos, cal }))),
        ),
      )
      .subscribe({
        next: ({ plan, hitos, cal }) => {
          this.plan.set(plan);
          this.hitos.set(hitos);
          this.calendario.set(cal);
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
    if (id != null) this.cargar(id);
    else location.reload();
  }

  // ------------------------------------------------------------- resumen

  protected readonly actividades = computed(() => this.plan()?.actividades ?? []);
  protected readonly noLaborables = computed(
    () => this.calendario()?.diasNoLaborables.map((d) => d.fecha) ?? [],
  );

  protected readonly resumen = computed(() => {
    const as = this.actividades();
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
    const comprometido = this.proyectoActual()?.fechaTermino ?? null;
    return {
      inicio: inicio ? textoFecha(diaDe(inicio)) : '—',
      termino: termino ? textoFecha(diaDe(termino)) : '—',
      comprometido: comprometido ? textoFecha(diaDe(comprometido)) : '—',
      excede: !!termino && !!comprometido && termino > comprometido,
      atrasadas: as.filter((a) => a.esHoja && a.atrasada).length,
      hitosAtrasados: this.hitos().filter((h) => h.estadoCalculado === 'ATRASADO').length,
      avance: this.proyectoActual()?.avance ?? 0,
    };
  });

  // ------------------------------------------------------------- herramientas

  protected irAHoy(): void {
    this.carta()?.irAHoy();
  }

  protected plegar(plegar: boolean): void {
    this.carta()?.plegarTodo(plegar);
  }

  // ------------------------------------------------------------- panel de edición

  protected readonly seleccion = computed(() => {
    const id = this.seleccionId();
    return id == null ? null : (this.actividades().find((a) => a.id === id) ?? null);
  });
  protected readonly padreSeleccion = computed(() => {
    const p = this.seleccion()?.padreId;
    return p == null ? null : (this.actividades().find((a) => a.id === p) ?? null);
  });
  protected readonly tipoEtiqueta = TIPO_ACTIVIDAD;

  protected cerrarPanel(): void {
    this.seleccionId.set(null);
  }

  protected alAplicar(r: PlanCambio): void {
    this.plan.set(r.plan);
    const id = this.proyectoId();
    if (id != null) {
      // Las fechas previstas de los hitos y el avance del proyecto dependen del plan recalculado.
      this.hitosServicio.listar(id).subscribe((h) => this.hitos.set(h));
      this.proyectosServicio
        .obtener(id)
        .subscribe((p) => this.proyectos.update((ps) => ps.map((x) => (x.id === p.id ? p : x))));
    }
    const n = r.recalculadas.length;
    const nombres = r.recalculadas
      .slice(0, 4)
      .map((c) => c.nombre)
      .join(', ');
    this.mensajes.add({
      severity: 'success',
      summary: 'Carta Gantt actualizada',
      detail:
        n === 0
          ? 'Las fechas planificadas no cambiaron.'
          : `Se movieron ${n === 1 ? '1 actividad' : n + ' actividades'}: ${nombres}${n > 4 ? '…' : '.'}`,
      life: 6000,
    });
  }
}

function leerPreferencias(): Preferencias {
  const base: Preferencias = { zoom: 'semana', real: true, vinculos: true };
  try {
    const p = JSON.parse(localStorage.getItem(CLAVE_PREFERENCIAS) ?? '{}') as Partial<Preferencias>;
    return {
      zoom: p.zoom && p.zoom in ZOOM ? p.zoom : base.zoom,
      real: typeof p.real === 'boolean' ? p.real : base.real,
      vinculos: typeof p.vinculos === 'boolean' ? p.vinculos : base.vinculos,
    };
  } catch {
    return base;
  }
}

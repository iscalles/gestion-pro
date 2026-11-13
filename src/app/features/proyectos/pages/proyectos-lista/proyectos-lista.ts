import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { ClpPipe } from '../../../../shared/pipes/clp.pipe';
import { AuthService } from '../../../../core/auth/auth.service';
import { UsuariosService } from '../../../../core/api/usuarios.service';
import { Usuario } from '../../../../core/auth/auth.models';
import { erroresDeCampos, mensajeDeError } from '../../../../core/api/api-error';
import { recordarProyecto } from '../../../../shared/util/contexto-proyecto';
import { hoyIso } from '../../../../shared/util/formato';
import { ProyectosService } from '../../data/proyectos.service';
import { ESTADO_PROYECTO, EstadoProyecto, Proyecto, ProyectoRequest } from '../../models/proyecto.model';

interface FormProyecto {
  codigo: string;
  nombre: string;
  descripcion: string;
  responsableId: number | null;
  calendarioId: number | null;
  fechaInicio: string;
  fechaTermino: string;
  presupuesto: number | null;
  estado: EstadoProyecto;
  miembroIds: number[];
}

@Component({
  selector: 'gp-proyectos-lista',
  imports: [DecimalPipe, 
    DatePipe, RouterLink, FormsModule, TableModule, ButtonModule, InputTextModule, InputNumberModule, TextareaModule,
    SelectModule, MultiSelectModule, ProgressBarModule, IconFieldModule, InputIconModule, MessageModule, SkeletonModule,
    DialogModule, ToastModule, ConfirmDialogModule, MenuModule, TooltipModule, PageHeader, StatusBadge, ClpPipe,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './proyectos-lista.html',
  styleUrl: './proyectos-lista.scss',
})
export class ProyectosLista {
  protected readonly esAdmin = inject(AuthService).esAdmin;
  private readonly servicio = inject(ProyectosService);
  private readonly usuariosServicio = inject(UsuariosService);
  private readonly mensajes = inject(MessageService);
  private readonly confirmacion = inject(ConfirmationService);

  private readonly proyectos = signal<Proyecto[]>([]);
  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly calendarios = signal<{ id: number; nombre: string }[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.cargar();
    this.usuariosServicio.listar().subscribe({ next: (u) => this.usuarios.set(u), error: () => {} });
    this.servicio.calendarios().subscribe({ next: (c) => this.calendarios.set(c), error: () => {} });
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.servicio.listar().subscribe({
      next: (ps) => {
        this.proyectos.set(ps);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  protected est(e: EstadoProyecto) {
    return ESTADO_PROYECTO[e];
  }
  protected readonly opcionesEstado = [
    { label: 'Todos los estados', value: null },
    ...Object.entries(ESTADO_PROYECTO).map(([value, e]) => ({ label: e.etiqueta, value })),
  ];
  /** TERMINADO solo se alcanza con "Cerrar proyecto", que valida actividades y solicitudes. */
  protected readonly estadosEditables = (['PLANIFICADO', 'EN_EJECUCION', 'SUSPENDIDO'] as EstadoProyecto[]).map((value) => ({
    label: ESTADO_PROYECTO[value].etiqueta,
    value,
  }));

  protected readonly busqueda = signal('');
  protected readonly estado = signal<EstadoProyecto | null>(null);

  protected readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const e = this.estado();
    return this.proyectos().filter(
      (p) =>
        (!e || p.estado === e) &&
        (!q || [p.codigo, p.nombre, p.responsable].some((v) => v.toLowerCase().includes(q))),
    );
  });

  protected readonly resumen = computed(() => {
    const ps = this.proyectos();
    const activos = ps.filter((p) => p.estado === 'EN_EJECUCION');
    return {
      activos: activos.length,
      total: ps.length,
      presupuesto: activos.reduce((s, p) => s + p.presupuesto, 0),
      costoPlan: activos.reduce((s, p) => s + p.costoPlan, 0),
      solicitudes: ps.reduce((s, p) => s + p.solicitudesAbiertas, 0),
    };
  });

  protected readonly hayProyectos = computed(() => this.proyectos().length > 0);

  protected limpiarFiltros(): void {
    this.busqueda.set('');
    this.estado.set(null);
  }

  protected recordar(p: Proyecto): void {
    recordarProyecto(p.id);
  }

  protected atrasado(p: Proyecto): boolean {
    return p.estado !== 'TERMINADO' && !!p.terminoPrevisto && p.terminoPrevisto > p.fechaTermino;
  }

  // ---------------------------------------------------------------- menú de fila

  protected menuDe(p: Proyecto): MenuItem[] {
    const items: MenuItem[] = [
      { label: 'Editar', icon: 'pi pi-pencil', command: () => this.abrir(p) },
    ];
    if (p.estado !== 'TERMINADO') {
      items.push({ label: 'Cerrar proyecto', icon: 'pi pi-check-square', command: () => this.abrirCierre(p) });
    }
    if (p.estado === 'PLANIFICADO') {
      items.push({ separator: true }, { label: 'Eliminar', icon: 'pi pi-trash', command: () => this.eliminar(p) });
    }
    return items;
  }

  // ---------------------------------------------------------------- crear / editar

  protected readonly dialogo = signal(false);
  protected readonly editando = signal<Proyecto | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorForm = signal<string | null>(null);
  protected readonly errores = signal<Record<string, string>>({});
  protected form: FormProyecto = this.vacio();

  protected readonly opcionesUsuarios = computed(() => this.usuarios().map((u) => ({ label: u.nombre, value: u.id })));
  protected readonly opcionesMiembros = computed(() =>
    this.usuarios()
      .filter((u) => u.rol === 'USUARIO_PROYECTO')
      .map((u) => ({ label: u.nombre, value: u.id })),
  );

  private vacio(): FormProyecto {
    const hoy = hoyIso();
    return {
      codigo: '',
      nombre: '',
      descripcion: '',
      responsableId: null,
      calendarioId: this.calendarios()[0]?.id ?? null,
      fechaInicio: hoy,
      fechaTermino: hoy,
      presupuesto: null,
      estado: 'PLANIFICADO',
      miembroIds: [],
    };
  }

  protected abrir(p: Proyecto | null): void {
    this.editando.set(p);
    this.errorForm.set(null);
    this.errores.set({});
    this.form = p
      ? {
          codigo: p.codigo,
          nombre: p.nombre,
          descripcion: p.descripcion ?? '',
          responsableId: p.responsableId,
          calendarioId: p.calendarioId,
          fechaInicio: p.fechaInicio,
          fechaTermino: p.fechaTermino,
          presupuesto: p.presupuesto,
          estado: p.estado,
          miembroIds: [...p.miembroIds],
        }
      : this.vacio();
    this.dialogo.set(true);
  }

  protected guardar(): void {
    const f = this.form;
    const datos: ProyectoRequest = {
      codigo: f.codigo,
      nombre: f.nombre,
      descripcion: f.descripcion || null,
      responsableId: f.responsableId as number,
      calendarioId: f.calendarioId as number,
      fechaInicio: f.fechaInicio,
      fechaTermino: f.fechaTermino,
      presupuesto: f.presupuesto as number,
      estado: f.estado,
      miembroIds: f.miembroIds,
    };
    const actual = this.editando();
    this.guardando.set(true);
    this.errorForm.set(null);
    this.errores.set({});
    const peticion = actual ? this.servicio.actualizar(actual.id, datos) : this.servicio.crear(datos);
    peticion.subscribe({
      next: (p) => {
        this.guardando.set(false);
        this.dialogo.set(false);
        this.proyectos.update((ps) => (actual ? ps.map((x) => (x.id === p.id ? p : x)) : [...ps, p].sort((a, b) => a.codigo.localeCompare(b.codigo))));
        this.mensajes.add({ severity: 'success', summary: actual ? 'Proyecto actualizado' : 'Proyecto creado', detail: `${p.codigo} · ${p.nombre}` });
      },
      error: (e) => {
        this.guardando.set(false);
        this.errores.set(erroresDeCampos(e));
        this.errorForm.set(mensajeDeError(e));
      },
    });
  }

  // ---------------------------------------------------------------- cierre

  protected readonly cierre = signal<Proyecto | null>(null);
  protected fechaCierre = hoyIso();
  protected readonly errorCierre = signal<string | null>(null);

  protected abrirCierre(p: Proyecto): void {
    this.cierre.set(p);
    this.fechaCierre = hoyIso();
    this.errorCierre.set(null);
  }

  protected cerrar(): void {
    const p = this.cierre();
    if (!p) return;
    this.guardando.set(true);
    this.servicio.cerrar(p.id, this.fechaCierre || null).subscribe({
      next: (r) => {
        this.guardando.set(false);
        this.cierre.set(null);
        this.proyectos.update((ps) => ps.map((x) => (x.id === r.id ? r : x)));
        this.mensajes.add({ severity: 'success', summary: 'Proyecto cerrado', detail: `${r.codigo} quedó terminado.` });
      },
      error: (e) => {
        this.guardando.set(false);
        this.errorCierre.set(mensajeDeError(e));
      },
    });
  }

  // ---------------------------------------------------------------- eliminar

  private eliminar(p: Proyecto): void {
    this.confirmacion.confirm({
      header: 'Eliminar proyecto',
      message: `Se eliminará ${p.codigo} · ${p.nombre} con todas sus actividades, recursos, hitos y KPI. No se puede deshacer.`,
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { outlined: true },
      accept: () =>
        this.servicio.eliminar(p.id).subscribe({
          next: () => {
            this.proyectos.update((ps) => ps.filter((x) => x.id !== p.id));
            this.mensajes.add({ severity: 'success', summary: 'Proyecto eliminado', detail: p.codigo });
          },
          error: (e) => this.mensajes.add({ severity: 'error', summary: 'No se pudo eliminar', detail: mensajeDeError(e), life: 8000 }),
        }),
    });
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { ClpPipe } from '../../../../shared/pipes/clp.pipe';
import { AuthService } from '../../../../core/auth/auth.service';
import { ProyectosService } from '../../data/proyectos.service';
import { ESTADO_PROYECTO, EstadoProyecto, Proyecto } from '../../models/proyecto.model';
import { mensajeDeError } from '../../../../core/api/api-error';

@Component({
  selector: 'gp-proyectos-lista',
  imports: [
    DatePipe, RouterLink, FormsModule, TableModule, ButtonModule, InputTextModule, SelectModule, ProgressBarModule,
    IconFieldModule, InputIconModule, MessageModule, SkeletonModule, PageHeader, StatusBadge, ClpPipe,
  ],
  templateUrl: './proyectos-lista.html',
  styleUrl: './proyectos-lista.scss',
})
export class ProyectosLista {
  protected readonly esAdmin = inject(AuthService).esAdmin;
  private readonly servicio = inject(ProyectosService);
  private readonly proyectos = signal<Proyecto[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.cargar();
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
    };
  });

  protected readonly hayProyectos = computed(() => this.proyectos().length > 0);

  protected limpiarFiltros(): void {
    this.busqueda.set('');
    this.estado.set(null);
  }
}

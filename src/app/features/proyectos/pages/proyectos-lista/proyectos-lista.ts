import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ProgressBarModule } from 'primeng/progressbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { ClpPipe } from '../../../../shared/pipes/clp.pipe';
import { AuthService } from '../../../../core/auth/auth.service';
import { ProyectosService } from '../../data/proyectos.service';
import { ESTADO_PROYECTO, EstadoProyecto } from '../../models/proyecto.model';

@Component({
  selector: 'gp-proyectos-lista',
  imports: [
    DatePipe, RouterLink, FormsModule, TableModule, ButtonModule, InputTextModule, SelectModule, ProgressBarModule,
    IconFieldModule, InputIconModule, PageHeader, StatusBadge, ClpPipe,
  ],
  templateUrl: './proyectos-lista.html',
  styleUrl: './proyectos-lista.scss',
})
export class ProyectosLista {
  protected readonly esAdmin = inject(AuthService).esAdmin;
  private readonly proyectos = toSignal(inject(ProyectosService).listar(), { initialValue: [] });

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

  protected limpiarFiltros(): void {
    this.busqueda.set('');
    this.estado.set(null);
  }
}

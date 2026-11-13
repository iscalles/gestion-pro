import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { SelectorProyecto } from '../../../../shared/ui/selector-proyecto/selector-proyecto';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { ClpPipe } from '../../../../shared/pipes/clp.pipe';
import { contextoProyecto } from '../../../../shared/util/contexto-proyecto';
import { mensajeDeError } from '../../../../core/api/api-error';
import { CambiosService } from '../../data/cambios.service';
import {
  AccionCorrectiva, ESTADO_SOLICITUD, EstadoSolicitud, PRIORIDAD, Prioridad, Solicitud, SolicitudResumen, TIPO_CAMBIO, TipoCambio, opciones,
} from '../../models/cambio.model';
import { nivelRiesgo } from '../../util/valores';
import { SolicitudFormulario } from '../../ui/solicitud-formulario/solicitud-formulario';
import { LineasBase } from '../../ui/lineas-base/lineas-base';
import { Trazabilidad } from '../../ui/trazabilidad/trazabilidad';

@Component({
  selector: 'gp-cambios-lista',
  imports: [
    DatePipe, RouterLink, FormsModule, TableModule, ButtonModule, InputTextModule, MessageModule, ProgressBarModule,
    SelectModule, SkeletonModule, TabsModule, ToastModule, PageHeader, SelectorProyecto, StatusBadge, ClpPipe,
    SolicitudFormulario, LineasBase, Trazabilidad,
  ],
  providers: [MessageService],
  templateUrl: './cambios-lista.html',
  styleUrl: './cambios-lista.scss',
})
export class CambiosLista {
  protected readonly ctx = contextoProyecto();
  private readonly servicio = inject(CambiosService);
  private readonly router = inject(Router);
  private readonly mensajes = inject(MessageService);

  protected readonly solicitudes = signal<SolicitudResumen[]>([]);
  protected readonly acciones = signal<AccionCorrectiva[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly pestana = signal<string | number | undefined>('solicitudes');
  protected readonly nueva = signal(false);

  protected readonly estadoFiltro = signal<EstadoSolicitud | null>(null);
  protected readonly tipoFiltro = signal<TipoCambio | null>(null);
  protected readonly prioridadFiltro = signal<Prioridad | null>(null);
  protected readonly busqueda = signal('');

  protected readonly opEstado = [{ label: 'Todos los estados', value: null }, ...opciones(ESTADO_SOLICITUD)];
  protected readonly opTipo = [{ label: 'Todos los tipos', value: null }, ...opciones(TIPO_CAMBIO)];
  protected readonly opPrioridad = [{ label: 'Todas las prioridades', value: null }, ...opciones(PRIORIDAD)];

  protected readonly est = (e: EstadoSolicitud) => ESTADO_SOLICITUD[e];
  protected readonly pri = (p: Prioridad) => PRIORIDAD[p];
  protected readonly tipo = TIPO_CAMBIO;
  protected readonly riesgo = nivelRiesgo;

  constructor() {
    effect(() => {
      const id = this.ctx.proyectoId();
      if (id != null) untracked(() => this.cargar(id));
    });
  }

  protected cargar(id: number): void {
    this.cargando.set(true);
    this.error.set(null);
    this.servicio.listar(id).subscribe({
      next: (s) => {
        this.solicitudes.set(s);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
    this.servicio.acciones(id).subscribe({ next: (a) => this.acciones.set(a), error: () => {} });
  }

  protected readonly filtradas = computed(() => {
    const e = this.estadoFiltro();
    const t = this.tipoFiltro();
    const p = this.prioridadFiltro();
    const q = this.busqueda().trim().toLowerCase();
    return this.solicitudes().filter(
      (s) =>
        (!e || s.estado === e) &&
        (!t || s.tipo === t) &&
        (!p || s.prioridad === p) &&
        (!q || [s.codigo, s.titulo, s.solicitante, s.responsable].some((v) => v.toLowerCase().includes(q))),
    );
  });

  protected readonly resumen = computed(() => {
    const ss = this.solicitudes();
    return {
      total: ss.length,
      abiertas: ss.filter((s) => s.estado === 'ABIERTO' || s.estado === 'EN_EVALUACION').length,
      enImplementacion: ss.filter((s) => s.estado === 'APROBADO' || s.estado === 'EN_IMPLEMENTACION').length,
      cerradas: ss.filter((s) => s.estado === 'CERRADO').length,
      rechazadas: ss.filter((s) => s.estado === 'RECHAZADO').length,
      atrasadas: ss.filter((s) => s.atrasada).length,
      criticas: ss.filter((s) => s.riesgoCritico && s.estado !== 'CERRADO' && s.estado !== 'RECHAZADO').length,
    };
  });

  protected readonly accionesAbiertas = computed(() => this.acciones().filter((a) => a.estado === 'ABIERTA').length);

  protected limpiar(): void {
    this.estadoFiltro.set(null);
    this.tipoFiltro.set(null);
    this.prioridadFiltro.set(null);
    this.busqueda.set('');
  }

  protected creada(s: Solicitud): void {
    this.nueva.set(false);
    this.mensajes.add({ severity: 'success', summary: 'Solicitud registrada', detail: `${s.codigo} · ${s.titulo}` });
    this.router.navigate(['/cambios', s.id], { queryParams: { proyecto: this.ctx.proyectoId() } });
  }
}

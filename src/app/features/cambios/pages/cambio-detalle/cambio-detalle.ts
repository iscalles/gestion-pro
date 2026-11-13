import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe, DecimalPipe, LowerCasePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { Evidencias } from '../../../../shared/ui/evidencias/evidencias';
import { ClpPipe } from '../../../../shared/pipes/clp.pipe';
import { contextoProyecto } from '../../../../shared/util/contexto-proyecto';
import { hoyIso } from '../../../../shared/util/formato';
import { mensajeDeError } from '../../../../core/api/api-error';
import { AuthService } from '../../../../core/auth/auth.service';
import { UsuariosService } from '../../../../core/api/usuarios.service';
import { CambiosService } from '../../data/cambios.service';
import {
  Aprobacion, ESTADO_SOLICITUD, EtapaSolicitud, NIVEL, NIVEL_IMPACTO, PRIORIDAD, Solicitud, TIPO_CAMBIO,
} from '../../models/cambio.model';
import { nivelRiesgo } from '../../util/valores';
import { SolicitudFormulario } from '../../ui/solicitud-formulario/solicitud-formulario';
import { ModificacionesSolicitud } from '../../ui/modificaciones-solicitud/modificaciones-solicitud';
import { AccionesSolicitud } from '../../ui/acciones-solicitud/acciones-solicitud';
import { KpiAfectados } from '../../ui/kpi-afectados/kpi-afectados';

type Decision = 'avanzar' | 'aprobar' | 'rechazar';

@Component({
  selector: 'gp-cambio-detalle',
  imports: [
    DatePipe, DecimalPipe, LowerCasePipe, TitleCasePipe, RouterLink, FormsModule, ButtonModule, DialogModule, InputNumberModule, InputTextModule,
    MessageModule, SelectModule, SkeletonModule, TextareaModule, ToastModule, ConfirmDialogModule, TooltipModule,
    StatusBadge, Evidencias, ClpPipe, SolicitudFormulario, ModificacionesSolicitud, AccionesSolicitud, KpiAfectados,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './cambio-detalle.html',
  styleUrl: './cambio-detalle.scss',
})
export class CambioDetalle {
  protected readonly ctx = contextoProyecto();
  private readonly servicio = inject(CambiosService);
  private readonly router = inject(Router);
  private readonly mensajes = inject(MessageService);
  private readonly confirmacion = inject(ConfirmationService);
  protected readonly esAdmin = inject(AuthService).esAdmin;
  private readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => Number(p.get('id')))), { initialValue: 0 });

  protected readonly s = signal<Solicitud | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly etapaSel = signal<number | null>(null);
  protected readonly usuarios = signal<{ label: string; value: number }[]>([]);

  protected readonly est = ESTADO_SOLICITUD;
  protected readonly pri = PRIORIDAD;
  protected readonly tipo = TIPO_CAMBIO;
  protected readonly nivel = NIVEL;
  protected readonly nivelImpacto = NIVEL_IMPACTO;
  protected readonly hoy = hoyIso();

  constructor() {
    effect(() => {
      const pid = this.ctx.proyectoId();
      const id = this.id();
      if (pid != null && id) untracked(() => this.cargar());
    });
    inject(UsuariosService)
      .listar()
      .subscribe({ next: (us) => this.usuarios.set(us.map((u) => ({ label: u.nombre, value: u.id }))) });
  }

  protected cargar(): void {
    this.error.set(null);
    this.servicio.obtener(this.ctx.proyectoId()!, this.id()).subscribe({
      next: (s) => this.poner(s),
      error: (e) => this.error.set(mensajeDeError(e)),
    });
  }

  protected poner(s: Solicitud): void {
    this.s.set(s);
    if (this.etapaSel() == null || this.etapaSel()! > 10) this.etapaSel.set(s.etapaActual);
  }

  protected readonly riesgo = computed(() => {
    const s = this.s();
    return nivelRiesgo(s?.probabilidad ?? null, s?.impacto ?? null);
  });
  protected readonly enCurso = computed(() => {
    const e = this.s()?.estado;
    return e === 'ABIERTO' || e === 'EN_EVALUACION' || e === 'APROBADO' || e === 'EN_IMPLEMENTACION';
  });
  protected readonly editable = computed(() => {
    const e = this.s()?.estado;
    return e === 'ABIERTO' || e === 'EN_EVALUACION';
  });
  protected readonly etapa = computed(() => this.s()?.etapas.find((e) => e.numero === this.etapaSel()) ?? null);
  protected readonly siguiente = computed(() => {
    const s = this.s();
    return s ? (s.etapas.find((e) => e.numero === s.etapaActual + 1) ?? null) : null;
  });

  protected iconoEtapa(e: EtapaSolicitud): string {
    switch (e.estado) {
      case 'COMPLETADA':
        return 'pi pi-check';
      case 'EN_CURSO':
        return 'pi pi-circle-fill';
      case 'OMITIDA':
        return 'pi pi-minus';
      default:
        return '';
    }
  }

  protected textoEstadoEtapa(e: EtapaSolicitud): string {
    return { COMPLETADA: 'completada', EN_CURSO: 'en curso', OMITIDA: 'omitida', PENDIENTE: 'pendiente' }[e.estado];
  }

  // ---------------------------------------------------------------- flujo

  protected readonly decision = signal<Decision | null>(null);
  protected observacion = '';
  protected readonly procesando = signal(false);
  protected readonly errorDecision = signal<string | null>(null);
  protected readonly aprobacion = signal<Aprobacion | null>(null);

  protected abrirDecision(d: Decision): void {
    this.observacion = '';
    this.errorDecision.set(null);
    this.decision.set(d);
  }

  protected confirmarDecision(): void {
    const s = this.s();
    const d = this.decision();
    if (!s || !d) return;
    const pid = this.ctx.proyectoId()!;
    const obs = this.observacion.trim() || null;
    this.procesando.set(true);
    this.errorDecision.set(null);
    const fallo = (e: unknown) => {
      this.procesando.set(false);
      this.errorDecision.set(mensajeDeError(e));
    };
    if (d === 'aprobar') {
      this.servicio.aprobar(pid, s.id, obs).subscribe({
        next: (a) => {
          this.procesando.set(false);
          this.decision.set(null);
          this.etapaSel.set(null);
          this.poner(a.solicitud);
          this.aprobacion.set(a);
        },
        error: fallo,
      });
    } else if (d === 'rechazar') {
      this.servicio.rechazar(pid, s.id, obs ?? '').subscribe({
        next: (r) => {
          this.procesando.set(false);
          this.decision.set(null);
          this.poner(r);
          this.mensajes.add({ severity: 'info', summary: `${r.codigo} rechazada` });
        },
        error: fallo,
      });
    } else {
      this.servicio.avanzar(pid, s.id, obs).subscribe({
        next: (r) => {
          this.procesando.set(false);
          this.decision.set(null);
          this.etapaSel.set(r.etapaActual);
          this.poner(r);
          this.mensajes.add({ severity: 'success', summary: `Etapa ${r.etapaActual} en curso`, detail: r.etapas.find((e) => e.numero === r.etapaActual)?.nombre });
        },
        error: fallo,
      });
    }
  }

  // ---------------------------------------------------------------- cierre

  protected readonly dlgCierre = signal(false);
  protected cierre = { resultado: '', efectividad: null as number | null, adopcion: null as number | null, costoReal: null as number | null, fechaReal: hoyIso() };

  protected abrirCierre(): void {
    const s = this.s()!;
    this.cierre = { resultado: s.resultado ?? '', efectividad: s.efectividad, adopcion: s.adopcion, costoReal: s.costoReal, fechaReal: hoyIso() };
    this.errorDecision.set(null);
    this.dlgCierre.set(true);
  }

  protected cerrarSolicitud(): void {
    const s = this.s()!;
    this.procesando.set(true);
    this.errorDecision.set(null);
    this.servicio.cerrar(this.ctx.proyectoId()!, s.id, this.cierre).subscribe({
      next: (r) => {
        this.procesando.set(false);
        this.dlgCierre.set(false);
        this.poner(r);
        this.mensajes.add({ severity: 'success', summary: `${r.codigo} cerrada` });
      },
      error: (e) => {
        this.procesando.set(false);
        this.errorDecision.set(mensajeDeError(e));
      },
    });
  }

  // ---------------------------------------------------------------- seguimiento

  protected seg = { costoReal: null as number | null, adopcion: null as number | null, efectividad: null as number | null };
  protected readonly guardandoSeg = signal(false);

  protected readonly cargaSeguimiento = effect(() => {
    const s = this.s();
    if (s) this.seg = { costoReal: s.costoReal, adopcion: s.adopcion, efectividad: s.efectividad };
  });

  protected guardarSeguimiento(): void {
    const s = this.s()!;
    this.guardandoSeg.set(true);
    this.servicio.seguimiento(this.ctx.proyectoId()!, s.id, this.seg).subscribe({
      next: (r) => {
        this.guardandoSeg.set(false);
        this.poner(r);
        this.mensajes.add({ severity: 'success', summary: 'Seguimiento registrado', detail: 'Los KPI de cambio se recalcularon.' });
      },
      error: (e) => {
        this.guardandoSeg.set(false);
        this.mensajes.add({ severity: 'error', summary: 'No se pudo guardar', detail: mensajeDeError(e), life: 8000 });
      },
    });
  }

  // ---------------------------------------------------------------- etapa

  protected readonly dlgEtapa = signal(false);
  protected fe = { responsableId: null as number | null, fechaLimite: '', observacion: '' };

  protected abrirEtapa(e: EtapaSolicitud): void {
    this.fe = { responsableId: e.responsableId, fechaLimite: e.fechaLimite ?? '', observacion: e.observacion ?? '' };
    this.errorDecision.set(null);
    this.dlgEtapa.set(true);
  }

  protected guardarEtapa(): void {
    const s = this.s()!;
    const e = this.etapa()!;
    this.procesando.set(true);
    this.servicio
      .actualizarEtapa(this.ctx.proyectoId()!, s.id, e.numero, {
        responsableId: this.fe.responsableId,
        fechaLimite: this.fe.fechaLimite || null,
        observacion: this.fe.observacion || null,
      })
      .subscribe({
        next: (r) => {
          this.procesando.set(false);
          this.dlgEtapa.set(false);
          this.poner(r);
        },
        error: (err) => {
          this.procesando.set(false);
          this.errorDecision.set(mensajeDeError(err));
        },
      });
  }

  // ---------------------------------------------------------------- editar / eliminar

  protected readonly editar = signal(false);

  protected editada(r: Solicitud): void {
    this.editar.set(false);
    this.poner(r);
    this.mensajes.add({ severity: 'success', summary: 'Solicitud actualizada' });
  }

  protected eliminar(): void {
    const s = this.s()!;
    this.confirmacion.confirm({
      header: 'Eliminar solicitud',
      message: `¿Eliminar ${s.codigo} · ${s.titulo}? Solo se pueden eliminar solicitudes recién registradas.`,
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { outlined: true },
      accept: () =>
        this.servicio.eliminar(this.ctx.proyectoId()!, s.id).subscribe({
          next: () => this.router.navigate(['/cambios'], { queryParams: { proyecto: this.ctx.proyectoId() } }),
          error: (e) => this.mensajes.add({ severity: 'error', summary: 'No se pudo eliminar', detail: mensajeDeError(e), life: 8000 }),
        }),
    });
  }

  protected urlEvidencias(s: Solicitud): string {
    return this.servicio.urlEvidencias(this.ctx.proyectoId()!, s.id);
  }
}

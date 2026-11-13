import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { erroresDeCampos, mensajeDeError } from '../../../../core/api/api-error';
import { UsuariosService } from '../../../../core/api/usuarios.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { hoyIso } from '../../../../shared/util/formato';
import { CambiosService } from '../../data/cambios.service';
import { NIVEL, NIVEL_IMPACTO, PRIORIDAD, Solicitud, SolicitudRequest, TIPO_CAMBIO, opciones } from '../../models/cambio.model';
import { nivelRiesgo } from '../../util/valores';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';

/** Registro y edición de una solicitud de cambio (datos, evaluación de impacto y riesgo). */
@Component({
  selector: 'gp-solicitud-formulario',
  imports: [FormsModule, ButtonModule, DialogModule, InputNumberModule, InputTextModule, MessageModule, SelectModule, TextareaModule, StatusBadge],
  templateUrl: './solicitud-formulario.html',
})
export class SolicitudFormulario {
  readonly proyectoId = input.required<number>();
  readonly solicitud = input<Solicitud | null>(null);
  readonly guardado = output<Solicitud>();
  readonly cerrar = output<void>();

  private readonly servicio = inject(CambiosService);
  private readonly auth = inject(AuthService);
  protected readonly usuarios = signal<{ label: string; value: number }[]>([]);
  protected readonly visible = signal(true);
  protected readonly guardando = signal(false);
  protected readonly errorForm = signal<string | null>(null);
  protected readonly errores = signal<Record<string, string>>({});

  protected readonly opTipo = opciones(TIPO_CAMBIO);
  protected readonly opPrioridad = opciones(PRIORIDAD);
  protected readonly opProbabilidad = opciones(NIVEL);
  protected readonly opImpacto = opciones(NIVEL_IMPACTO);
  protected readonly hoy = hoyIso();

  protected f: SolicitudRequest = {
    titulo: '',
    solicitante: '',
    fechaSolicitud: hoyIso(),
    descripcion: '',
    justificacion: '',
    tipo: 'ALCANCE',
    prioridad: 'MEDIA',
    riesgo: '',
    probabilidad: null,
    impacto: null,
    impactoPlazoDias: 0,
    impactoCosto: 0,
    impactoRecursos: '',
    impactoAlcance: '',
    responsableId: null as unknown as number,
    fechaComprometida: hoyIso(),
    costoEstimado: 0,
  };

  protected readonly riesgo = computed(() => nivelRiesgo(this.prob(), this.imp()));
  private readonly prob = signal<string | null>(null);
  private readonly imp = signal<string | null>(null);

  constructor() {
    inject(UsuariosService)
      .listar()
      .subscribe({ next: (us) => this.usuarios.set(us.map((u) => ({ label: u.nombre, value: u.id }))) });
    queueMicrotask(() => {
      const s = this.solicitud();
      if (s) {
        this.f = {
          titulo: s.titulo,
          solicitante: s.solicitante,
          fechaSolicitud: s.fechaSolicitud,
          descripcion: s.descripcion,
          justificacion: s.justificacion ?? '',
          tipo: s.tipo,
          prioridad: s.prioridad,
          riesgo: s.riesgo ?? '',
          probabilidad: s.probabilidad,
          impacto: s.impacto,
          impactoPlazoDias: s.impactoPlazoDias,
          impactoCosto: s.impactoCosto,
          impactoRecursos: s.impactoRecursos ?? '',
          impactoAlcance: s.impactoAlcance ?? '',
          responsableId: s.responsableId,
          fechaComprometida: s.fechaComprometida,
          costoEstimado: s.costoEstimado,
        };
      } else {
        this.f.solicitante = this.auth.usuario()?.nombre ?? '';
        this.f.responsableId = this.auth.usuario()?.id as number;
      }
      this.prob.set(this.f.probabilidad ?? null);
      this.imp.set(this.f.impacto ?? null);
    });
  }

  protected cambioRiesgo(): void {
    this.prob.set(this.f.probabilidad ?? null);
    this.imp.set(this.f.impacto ?? null);
  }

  protected guardar(): void {
    const s = this.solicitud();
    this.guardando.set(true);
    this.errorForm.set(null);
    this.errores.set({});
    this.servicio.guardar(this.proyectoId(), s?.id ?? null, this.f).subscribe({
      next: (r) => {
        this.guardando.set(false);
        this.guardado.emit(r);
      },
      error: (e) => {
        this.guardando.set(false);
        this.errores.set(erroresDeCampos(e));
        this.errorForm.set(mensajeDeError(e));
      },
    });
  }

  protected cerrarDialogo(): void {
    this.visible.set(false);
    this.cerrar.emit();
  }
}

import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ClpPipe } from '../../../../shared/pipes/clp.pipe';
import { erroresDeCampos, mensajeDeError } from '../../../../core/api/api-error';
import { RecursosService } from '../../data/recursos.service';
import { AsignacionRecurso, Costos, Recurso, TIPO_RECURSO, TipoRecurso } from '../../models/recurso.model';

interface FormRecurso {
  tipo: TipoRecurso;
  descripcion: string;
  detalle: string;
  unidad: string;
  cantidad: number | null;
  costoUnitario: number | null;
  periodo: number | null;
}

interface FormAsignacion {
  actividadId: number | null;
  recursoId: number | null;
  cantidad: number | null;
  periodo: number | null;
  costoReal: number | null;
}

/** Recursos materiales del proyecto (software, materiales, equipamiento, otros) y su uso en actividades. */
@Component({
  selector: 'gp-recursos-materiales',
  imports: [DecimalPipe, FormsModule, TableModule, ButtonModule, DialogModule, SelectModule, InputNumberModule, InputTextModule, MessageModule, ClpPipe],
  templateUrl: './recursos-materiales.html',
  styles: `
    .total-form {
      font-size: var(--gp-text-lg);
      line-height: 2.25rem;
    }
  `,
})
export class RecursosMateriales {
  readonly proyectoId = input.required<number>();
  readonly costos = input.required<Costos>();
  readonly actualizado = output<Costos>();

  private readonly servicio = inject(RecursosService);
  private readonly mensajes = inject(MessageService);
  private readonly confirmacion = inject(ConfirmationService);

  protected readonly tipoEtiqueta = TIPO_RECURSO;
  protected readonly opcionesTipo = (Object.keys(TIPO_RECURSO) as TipoRecurso[]).map((value) => ({ label: TIPO_RECURSO[value], value }));
  protected readonly opcionesHojas = computed(() =>
    this.costos()
      .actividades.filter((a) => a.esHoja)
      .map((a) => ({ label: `${a.codigoEdt} ${a.nombre}`, value: a.id })),
  );
  protected readonly opcionesRecursos = computed(() =>
    this.costos().recursos.map((r) => ({ label: `${r.descripcion} (${this.fmt(r.disponible)} ${r.unidad ?? 'u.'} disponibles)`, value: r.id })),
  );

  protected fmt(n: number): string {
    return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(n);
  }

  // ---------------------------------------------------------------- recursos

  protected readonly dlgRecurso = signal(false);
  protected readonly recursoEditando = signal<Recurso | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorForm = signal<string | null>(null);
  protected readonly errores = signal<Record<string, string>>({});
  protected fr: FormRecurso = this.recursoVacio();

  private recursoVacio(): FormRecurso {
    return { tipo: 'MATERIAL', descripcion: '', detalle: '', unidad: 'unidad', cantidad: 1, costoUnitario: null, periodo: 1 };
  }

  protected abrirRecurso(r: Recurso | null): void {
    this.recursoEditando.set(r);
    this.errorForm.set(null);
    this.errores.set({});
    this.fr = r
      ? { tipo: r.tipo, descripcion: r.descripcion, detalle: r.detalle ?? '', unidad: r.unidad ?? '', cantidad: r.cantidad, costoUnitario: r.costoUnitario, periodo: r.periodo }
      : this.recursoVacio();
    this.dlgRecurso.set(true);
  }

  protected guardarRecurso(): void {
    const r = this.recursoEditando();
    this.ejecutar(
      this.servicio.guardarRecurso(this.proyectoId(), r?.id ?? null, {
        tipo: this.fr.tipo,
        descripcion: this.fr.descripcion,
        detalle: this.fr.detalle || null,
        unidad: this.fr.unidad || null,
        cantidad: this.fr.cantidad!,
        costoUnitario: this.fr.costoUnitario!,
        periodo: this.fr.periodo,
      }),
      r ? 'Recurso actualizado' : 'Recurso agregado',
      () => this.dlgRecurso.set(false),
    );
  }

  protected eliminarRecurso(r: Recurso): void {
    this.confirmar(`¿Eliminar el recurso «${r.descripcion}»?`, 'Eliminar recurso', () =>
      this.ejecutar(this.servicio.eliminarRecurso(this.proyectoId(), r.id), 'Recurso eliminado'),
    );
  }

  // ---------------------------------------------------------------- asignaciones

  protected readonly dlgAsig = signal(false);
  protected readonly asigEditando = signal<AsignacionRecurso | null>(null);
  protected fa: FormAsignacion = { actividadId: null, recursoId: null, cantidad: 1, periodo: null, costoReal: 0 };

  protected recursoDe(id: number | null): Recurso | undefined {
    return this.costos().recursos.find((r) => r.id === id);
  }

  protected abrirAsignacion(a: AsignacionRecurso | null): void {
    this.asigEditando.set(a);
    this.errorForm.set(null);
    this.errores.set({});
    this.fa = a
      ? { actividadId: a.actividadId, recursoId: a.recursoId, cantidad: a.cantidad, periodo: a.periodo, costoReal: a.costoReal }
      : { actividadId: null, recursoId: null, cantidad: 1, periodo: null, costoReal: 0 };
    this.dlgAsig.set(true);
  }

  protected guardarAsignacion(): void {
    const a = this.asigEditando();
    this.ejecutar(
      this.servicio.guardarAsignacionRecurso(this.proyectoId(), a?.id ?? null, {
        actividadId: this.fa.actividadId!,
        recursoId: this.fa.recursoId!,
        cantidad: this.fa.cantidad!,
        periodo: this.fa.periodo,
        costoReal: this.fa.costoReal,
      }),
      a ? 'Asignación actualizada' : 'Recurso asignado',
      () => this.dlgAsig.set(false),
    );
  }

  protected eliminarAsignacion(a: AsignacionRecurso): void {
    this.confirmar(`¿Quitar «${a.recurso}» de «${a.actividad}»?`, 'Quitar recurso', () =>
      this.ejecutar(this.servicio.eliminarAsignacionRecurso(this.proyectoId(), a.id), 'Asignación quitada'),
    );
  }

  // ---------------------------------------------------------------- apoyo

  private ejecutar(obs: ReturnType<RecursosService['costos']>, exito: string, alTerminar?: () => void): void {
    this.guardando.set(true);
    this.errorForm.set(null);
    this.errores.set({});
    obs.subscribe({
      next: (c) => {
        this.guardando.set(false);
        alTerminar?.();
        this.actualizado.emit(c);
        this.mensajes.add({ severity: 'success', summary: exito, detail: 'Costos y KPI recalculados.' });
      },
      error: (e) => {
        this.guardando.set(false);
        if (alTerminar) {
          this.errores.set(erroresDeCampos(e));
          this.errorForm.set(mensajeDeError(e));
        } else {
          this.mensajes.add({ severity: 'error', summary: 'No se pudo completar', detail: mensajeDeError(e), life: 8000 });
        }
      },
    });
  }

  private confirmar(mensaje: string, titulo: string, accion: () => void): void {
    this.confirmacion.confirm({
      header: titulo,
      message: mensaje,
      acceptLabel: 'Confirmar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { outlined: true },
      accept: accion,
    });
  }
}

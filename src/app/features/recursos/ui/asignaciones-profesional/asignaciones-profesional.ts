import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ClpPipe } from '../../../../shared/pipes/clp.pipe';
import { erroresDeCampos, mensajeDeError } from '../../../../core/api/api-error';
import { RecursosService } from '../../data/recursos.service';
import { AsignacionProfesional, Costos, ProfesionalFicha } from '../../models/recurso.model';

interface Form {
  actividadId: number | null;
  profesionalId: number | null;
  horasSemana: number | null;
  valorHora: number | null;
  horasReales: number | null;
}

/** Profesionales asignados a actividades hoja: horas por semana, valor hora y horas reales. */
@Component({
  selector: 'gp-asignaciones-profesional',
  imports: [DecimalPipe, FormsModule, TableModule, ButtonModule, DialogModule, SelectModule, InputNumberModule, MessageModule, TooltipModule, ClpPipe],
  templateUrl: './asignaciones-profesional.html',
})
export class AsignacionesProfesional {
  readonly proyectoId = input.required<number>();
  readonly costos = input.required<Costos>();
  readonly profesionales = input.required<ProfesionalFicha[]>();
  readonly actualizado = output<Costos>();

  private readonly servicio = inject(RecursosService);
  private readonly mensajes = inject(MessageService);
  private readonly confirmacion = inject(ConfirmationService);

  protected readonly filtroProfesional = signal<number | null>(null);
  protected readonly filas = computed(() => {
    const f = this.filtroProfesional();
    return this.costos().asignacionesProfesional.filter((a) => f == null || a.profesionalId === f);
  });
  protected readonly totales = computed(() =>
    this.filas().reduce(
      (t, a) => ({ horas: t.horas + a.horasPlan, plan: t.plan + a.costoPlan, reales: t.reales + a.horasReales, real: t.real + a.costoReal }),
      { horas: 0, plan: 0, reales: 0, real: 0 },
    ),
  );
  protected readonly sobreasignados = computed(() => new Set(this.costos().sobreasignaciones.map((s) => s.profesionalId)));

  protected readonly opcionesHojas = computed(() =>
    this.costos()
      .actividades.filter((a) => a.esHoja)
      .map((a) => ({ label: `${a.codigoEdt} ${a.nombre}`, value: a.id })),
  );
  protected readonly opcionesProfesionales = computed(() =>
    this.profesionales()
      .filter((p) => p.activo)
      .map((p) => ({ label: `${p.nombre} · ${p.especialidad}`, value: p.id })),
  );
  protected readonly opcionesFiltro = computed(() => {
    const ids = new Set(this.costos().asignacionesProfesional.map((a) => a.profesionalId));
    return [
      { label: 'Todos los profesionales', value: null },
      ...this.profesionales()
        .filter((p) => ids.has(p.id))
        .map((p) => ({ label: p.nombre, value: p.id })),
    ];
  });

  protected readonly dialogo = signal(false);
  protected readonly editando = signal<AsignacionProfesional | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorForm = signal<string | null>(null);
  protected readonly errores = signal<Record<string, string>>({});
  protected form: Form = { actividadId: null, profesionalId: null, horasSemana: null, valorHora: null, horasReales: null };

  protected valorHoraRef(): number | null {
    return this.profesionales().find((p) => p.id === this.form.profesionalId)?.valorHora ?? null;
  }

  protected abrir(a: AsignacionProfesional | null): void {
    this.editando.set(a);
    this.errorForm.set(null);
    this.errores.set({});
    this.form = a
      ? { actividadId: a.actividadId, profesionalId: a.profesionalId, horasSemana: a.horasSemana, valorHora: a.valorHora, horasReales: a.horasReales }
      : { actividadId: null, profesionalId: null, horasSemana: 20, valorHora: null, horasReales: 0 };
    this.dialogo.set(true);
  }

  protected guardar(): void {
    const a = this.editando();
    this.guardando.set(true);
    this.errorForm.set(null);
    this.errores.set({});
    this.servicio
      .guardarAsignacionProfesional(this.proyectoId(), a?.id ?? null, {
        actividadId: this.form.actividadId!,
        profesionalId: this.form.profesionalId!,
        horasSemana: this.form.horasSemana!,
        valorHora: this.form.valorHora,
        horasReales: this.form.horasReales,
      })
      .subscribe({
        next: (c) => {
          this.guardando.set(false);
          this.dialogo.set(false);
          this.actualizado.emit(c);
          this.mensajes.add({ severity: 'success', summary: a ? 'Asignación actualizada' : 'Profesional asignado', detail: 'Costos y KPI recalculados.' });
        },
        error: (e) => {
          this.guardando.set(false);
          this.errores.set(erroresDeCampos(e));
          this.errorForm.set(mensajeDeError(e));
        },
      });
  }

  protected eliminar(a: AsignacionProfesional): void {
    this.confirmacion.confirm({
      header: 'Quitar asignación',
      message: `¿Quitar a ${a.profesional} de «${a.actividad}»? Su costo planificado deja de sumarse.`,
      acceptLabel: 'Quitar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { outlined: true },
      accept: () =>
        this.servicio.eliminarAsignacionProfesional(this.proyectoId(), a.id).subscribe({
          next: (c) => {
            this.actualizado.emit(c);
            this.mensajes.add({ severity: 'success', summary: 'Asignación quitada' });
          },
          error: (e) => this.mensajes.add({ severity: 'error', summary: 'No se pudo quitar', detail: mensajeDeError(e), life: 8000 }),
        }),
    });
  }
}

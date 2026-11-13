import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageModule } from 'primeng/message';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ClpPipe } from '../../../../shared/pipes/clp.pipe';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { erroresDeCampos, mensajeDeError } from '../../../../core/api/api-error';
import { UsuariosService } from '../../../../core/api/usuarios.service';
import { RecursosService } from '../../data/recursos.service';
import { ProfesionalFicha, TipoProfesional } from '../../models/recurso.model';

/** Catálogo global (solo administrador): profesionales con su valor hora y tipos de profesional. */
@Component({
  selector: 'gp-catalogo-profesionales',
  imports: [FormsModule, TableModule, ButtonModule, DialogModule, SelectModule, InputNumberModule, InputTextModule, ToggleSwitchModule, MessageModule, ClpPipe, StatusBadge],
  templateUrl: './catalogo-profesionales.html',
})
export class CatalogoProfesionales {
  readonly profesionales = input.required<ProfesionalFicha[]>();
  readonly tipos = input.required<TipoProfesional[]>();
  readonly cambio = output<void>();

  private readonly servicio = inject(RecursosService);
  private readonly mensajes = inject(MessageService);
  private readonly confirmacion = inject(ConfirmationService);
  protected readonly usuarios = signal<{ label: string; value: number | null }[]>([]);

  constructor() {
    inject(UsuariosService)
      .listar()
      .subscribe({ next: (us) => this.usuarios.set([{ label: 'Sin usuario', value: null }, ...us.map((u) => ({ label: u.nombre, value: u.id }))]) });
  }

  protected readonly opcionesTipos = computed(() => [{ label: 'Sin tipo', value: null }, ...this.tipos().map((t) => ({ label: t.categoria, value: t.id as number | null }))]);
  protected readonly guardando = signal(false);
  protected readonly errorForm = signal<string | null>(null);
  protected readonly errores = signal<Record<string, string>>({});

  // ---- profesionales
  protected readonly dlgProf = signal(false);
  protected readonly profEditando = signal<ProfesionalFicha | null>(null);
  protected fp = { nombre: '', especialidad: '', tipoProfesionalId: null as number | null, valorHora: null as number | null, horasSemanaDisp: 40 as number | null, usuarioId: null as number | null, activo: true };

  protected abrirProf(p: ProfesionalFicha | null): void {
    this.profEditando.set(p);
    this.errorForm.set(null);
    this.errores.set({});
    this.fp = p
      ? { nombre: p.nombre, especialidad: p.especialidad, tipoProfesionalId: p.tipoProfesionalId, valorHora: p.valorHora, horasSemanaDisp: p.horasSemanaDisp, usuarioId: p.usuarioId, activo: p.activo }
      : { nombre: '', especialidad: '', tipoProfesionalId: null, valorHora: null, horasSemanaDisp: 40, usuarioId: null, activo: true };
    this.dlgProf.set(true);
  }

  protected guardarProf(): void {
    const p = this.profEditando();
    this.guardando.set(true);
    this.errorForm.set(null);
    this.servicio
      .guardarProfesional(p?.id ?? null, { ...this.fp, valorHora: this.fp.valorHora!, horasSemanaDisp: this.fp.horasSemanaDisp! })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.dlgProf.set(false);
          this.cambio.emit();
          this.mensajes.add({ severity: 'success', summary: p ? 'Profesional actualizado' : 'Profesional creado' });
        },
        error: (e) => {
          this.guardando.set(false);
          this.errores.set(erroresDeCampos(e));
          this.errorForm.set(mensajeDeError(e));
        },
      });
  }

  protected eliminarProf(p: ProfesionalFicha): void {
    this.confirmacion.confirm({
      header: 'Eliminar profesional',
      message: `¿Eliminar a ${p.nombre}? Si tiene asignaciones o es responsable de actividades, quedará inactivo en vez de eliminarse.`,
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { outlined: true },
      accept: () =>
        this.servicio.eliminarProfesional(p.id).subscribe({
          next: (r) => {
            this.cambio.emit();
            this.mensajes.add({ severity: 'success', summary: r.desactivado ? 'Profesional desactivado' : 'Profesional eliminado', detail: r.mensaje });
          },
          error: (e) => this.mensajes.add({ severity: 'error', summary: 'No se pudo eliminar', detail: mensajeDeError(e) }),
        }),
    });
  }

  // ---- tipos
  protected readonly dlgTipo = signal(false);
  protected readonly tipoEditando = signal<TipoProfesional | null>(null);
  protected ft = { categoria: '', tarifaHoraRef: null as number | null };

  protected abrirTipo(t: TipoProfesional | null): void {
    this.tipoEditando.set(t);
    this.errorForm.set(null);
    this.errores.set({});
    this.ft = t ? { categoria: t.categoria, tarifaHoraRef: t.tarifaHoraRef } : { categoria: '', tarifaHoraRef: null };
    this.dlgTipo.set(true);
  }

  protected guardarTipo(): void {
    const t = this.tipoEditando();
    this.guardando.set(true);
    this.errorForm.set(null);
    this.servicio.guardarTipo(t?.id ?? null, { categoria: this.ft.categoria, tarifaHoraRef: this.ft.tarifaHoraRef! }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.dlgTipo.set(false);
        this.cambio.emit();
        this.mensajes.add({ severity: 'success', summary: t ? 'Tipo actualizado' : 'Tipo creado' });
      },
      error: (e) => {
        this.guardando.set(false);
        this.errores.set(erroresDeCampos(e));
        this.errorForm.set(mensajeDeError(e));
      },
    });
  }

  protected eliminarTipo(t: TipoProfesional): void {
    this.confirmacion.confirm({
      header: 'Eliminar tipo de profesional',
      message: `¿Eliminar el tipo «${t.categoria}»?`,
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { outlined: true },
      accept: () =>
        this.servicio.eliminarTipo(t.id).subscribe({
          next: () => this.cambio.emit(),
          error: (e) => this.mensajes.add({ severity: 'error', summary: 'No se pudo eliminar', detail: mensajeDeError(e) }),
        }),
    });
  }
}

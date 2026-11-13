import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { mensajeDeError } from '../../../../core/api/api-error';
import { paso, tintaSobre } from '../../../../shared/graficos/paleta';
import { fmtFechaCorta, fmtFecha, hoyIso } from '../../../../shared/util/formato';
import { Proyecto } from '../../../proyectos/models/proyecto.model';
import { RecursosService } from '../../data/recursos.service';
import { CargaProfesional, CargaSemana, Costos } from '../../models/recurso.model';

/**
 * Carga semanal de los profesionales del proyecto, sumando todos sus proyectos. Cada celda es la utilización
 * de la semana (rampa de un tono); sobre el 100 % se marca en rojo con ícono y se detalla qué la causa.
 */
@Component({
  selector: 'gp-carga-semanal',
  imports: [DecimalPipe, FormsModule, ButtonModule, InputTextModule, MessageModule, SkeletonModule],
  templateUrl: './carga-semanal.html',
  styleUrl: './carga-semanal.scss',
})
export class CargaSemanal {
  readonly proyectoId = input.required<number>();
  readonly proyecto = input<Proyecto | null>(null);
  /** Cambia cuando cambian las asignaciones: recarga. */
  readonly version = input<Costos | null>(null);

  private readonly servicio = inject(RecursosService);
  protected readonly datos = signal<CargaProfesional[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly seleccion = signal<{ p: CargaProfesional; s: CargaSemana } | null>(null);
  protected desde = '';
  protected hasta = '';
  protected readonly fmtCorta = fmtFechaCorta;
  protected readonly fmtFecha = fmtFecha;

  constructor() {
    effect(() => {
      const p = this.proyecto();
      this.version();
      untracked(() => {
        if (!this.desde) {
          this.desde = p?.fechaInicio ?? hoyIso();
          this.hasta = p?.terminoPrevisto ?? p?.fechaTermino ?? hoyIso();
        }
        this.cargar();
      });
    });
  }

  protected cargar(): void {
    if (!this.desde || !this.hasta) return;
    this.cargando.set(true);
    this.error.set(null);
    this.servicio.carga(this.proyectoId(), this.desde, this.hasta).subscribe({
      next: (d) => {
        this.datos.set(d);
        this.cargando.set(false);
        this.seleccion.set(null);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  protected readonly semanas = computed(() => this.datos()[0]?.semanas.map((s) => s.semana) ?? []);
  protected readonly hoySemana = computed(() => {
    const hoy = hoyIso();
    return this.semanas().filter((s) => s <= hoy).at(-1) ?? null;
  });

  protected fondo(s: CargaSemana): string {
    if (s.sobreasignada) return 'var(--gp-danger-soft)';
    if (s.horas <= 0) return 'transparent';
    return paso(Math.min(1, s.horas / Math.max(s.disponibles, 1)));
  }

  protected tinta(s: CargaSemana): string {
    if (s.sobreasignada) return 'var(--gp-danger)';
    if (s.horas <= 0) return 'var(--gp-text-muted)';
    return tintaSobre(this.fondo(s));
  }

  protected etiqueta(p: CargaProfesional, s: CargaSemana): string {
    const pct = s.disponibles > 0 ? Math.round((s.horas / s.disponibles) * 100) : 0;
    return `${p.nombre}, semana del ${fmtFecha(s.semana)}: ${s.horas} de ${s.disponibles} horas (${pct} %)${s.sobreasignada ? ', sobreasignado' : ''}`;
  }
}

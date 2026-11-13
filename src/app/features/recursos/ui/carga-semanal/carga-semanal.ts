import { Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { mensajeDeError } from '../../../../core/api/api-error';
import { fmtFechaCorta, fmtFecha, hoyIso } from '../../../../shared/util/formato';
import { Proyecto } from '../../../proyectos/models/proyecto.model';
import { RecursosService } from '../../data/recursos.service';
import { CargaProfesional, CargaSemana, Costos } from '../../models/recurso.model';

/** Visual: hasta este número de celdas cada una entra por separado; con más, la cascada se agrupa por columna. */
const MAX_CELDAS_ANIMADAS = 200;
/** Visual: los retardos de la cascada caben en 300 ms; con 200 ms por celda, el total queda en ≤500 ms. */
const TRAMO_CASCADA_MS = 300;

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
  /** Solo visual: cascada de primera carga. El padre la apaga cuando ya se dibujó una vez en la visita. */
  readonly animarEntrada = input(true);
  /** Solo visual: avisa que la cascada ya se dibujó. */
  readonly dibujada = output<void>();

  private readonly servicio = inject(RecursosService);
  protected readonly datos = signal<CargaProfesional[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly seleccion = signal<{ p: CargaProfesional; s: CargaSemana } | null>(null);
  protected desde = '';
  protected hasta = '';
  protected readonly fmtCorta = fmtFechaCorta;
  protected readonly fmtFecha = fmtFecha;

  // ---- solo visual: rampa y cascada de primera carga
  private readonly destroyRef = inject(DestroyRef);
  private primeraCarga = true;
  protected readonly pasosRampa = [1, 2, 3, 4, 5, 6];
  protected readonly cascada = signal<'celdas' | 'columnas' | null>(null);

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
        this.dibujar(d);
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

  /**
   * Paso de la rampa --gp-rampa-1..6 según la utilización de la semana (0 = sin horas). Es el mismo
   * reparto que paso() de paleta.ts, expresado como token para que el color y la tinta salgan del CSS.
   */
  protected nivel(s: CargaSemana): number {
    if (s.horas <= 0) return 0;
    const f = Math.min(1, s.horas / Math.max(s.disponibles, 1));
    return 1 + Math.round(f * 5);
  }

  /** Retardo entre columnas de la cascada: hasta 40 ms, y todas caben en TRAMO_CASCADA_MS. */
  protected readonly pasoCascada = computed(() => {
    const n = this.semanas().length;
    return n > 1 ? Math.min(40, TRAMO_CASCADA_MS / (n - 1)) : 0;
  });

  /** Primera vez que hay datos en la visita: cascada de izquierda a derecha, después nunca más. */
  private dibujar(d: CargaProfesional[]): void {
    if (!this.primeraCarga || d.length === 0) return;
    this.primeraCarga = false;
    if (!this.animarEntrada()) return;
    const celdas = d.length * (d[0]?.semanas.length ?? 0);
    this.cascada.set(celdas <= MAX_CELDAS_ANIMADAS ? 'celdas' : 'columnas');
    this.dibujada.emit();
    const t = setTimeout(() => this.cascada.set(null), 600);
    this.destroyRef.onDestroy(() => clearTimeout(t));
  }

  protected etiqueta(p: CargaProfesional, s: CargaSemana): string {
    const pct = s.disponibles > 0 ? Math.round((s.horas / s.disponibles) * 100) : 0;
    return `${p.nombre}, semana del ${fmtFecha(s.semana)}: ${s.horas} de ${s.disponibles} horas (${pct} %)${s.sobreasignada ? ', sobreasignado' : ''}`;
  }
}

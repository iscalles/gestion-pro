import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { CalendariosService } from '../../data/calendarios.service';
import { Calendario, DIAS_SEMANA, DiaNoLaborable, DiaSemana } from '../../models/calendario.model';
import { mensajeDeError } from '../../../../core/api/api-error';
import { dateAIso } from '../../../../shared/util/fechas';

/**
 * Calendario laboral del proyecto: días hábiles, horas por día y días no laborables.
 * Solo el administrador lo modifica; cada cambio reprograma los proyectos que lo usan.
 */
@Component({
  selector: 'gp-calendario-laboral',
  imports: [
    DatePipe,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    InputNumberModule,
    InputTextModule,
    DatePickerModule,
    MessageModule,
    SkeletonModule,
    TooltipModule,
  ],
  templateUrl: './calendario-laboral.html',
  styleUrl: './calendario-laboral.scss',
})
export class CalendarioLaboral {
  readonly calendarioId = input.required<number>();
  readonly editable = input(false);
  /** El calendario cambió y las fechas del proyecto se recalcularon. */
  readonly cambiado = output<string>();

  private readonly servicio = inject(CalendariosService);
  protected readonly dias = DIAS_SEMANA;

  protected readonly calendario = signal<Calendario | null>(null);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly laborables = signal<DiaSemana[]>([]);
  protected readonly horasDia = signal<number | null>(8);
  protected readonly nuevaFecha = signal<Date | null>(null);
  protected readonly nuevoMotivo = signal('');
  protected readonly agregando = signal(false);

  constructor() {
    effect(() => {
      const id = this.calendarioId();
      untracked(() => this.cargar(id));
    });
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.error.set(null);
    this.servicio.obtener(id).subscribe({
      next: (c) => {
        this.tomar(c);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  private tomar(c: Calendario): void {
    this.calendario.set(c);
    this.laborables.set([...c.diasLaborables]);
    this.horasDia.set(c.horasDia);
  }

  protected readonly horasSemana = computed(
    () => (this.horasDia() ?? 0) * this.laborables().length,
  );

  protected readonly hayCambios = computed(() => {
    const c = this.calendario();
    if (!c) return false;
    const a = [...this.laborables()].sort().join();
    const b = [...c.diasLaborables].sort().join();
    return a !== b || Number(this.horasDia()) !== Number(c.horasDia);
  });

  protected readonly puedeAgregar = computed(
    () => !!this.nuevaFecha() && this.nuevoMotivo().trim().length > 0,
  );

  protected guardar(): void {
    const c = this.calendario();
    if (!c) return;
    this.ejecutar(
      this.servicio.actualizar(c.id, {
        nombre: c.nombre,
        diasLaborables: this.laborables(),
        horasDia: this.horasDia() ?? 8,
      }),
      'Calendario actualizado',
    );
  }

  protected descartar(): void {
    const c = this.calendario();
    if (c) this.tomar(c);
  }

  protected agregar(): void {
    const c = this.calendario();
    const fecha = dateAIso(this.nuevaFecha());
    if (!c || !fecha) return;
    this.ejecutar(
      this.servicio.agregarDia(c.id, fecha, this.nuevoMotivo().trim()),
      'Día no laborable agregado',
      () => {
        this.nuevaFecha.set(null);
        this.nuevoMotivo.set('');
        this.agregando.set(false);
      },
    );
  }

  protected quitar(d: DiaNoLaborable): void {
    const c = this.calendario();
    if (!c) return;
    this.ejecutar(this.servicio.quitarDia(c.id, d.id), 'Día no laborable quitado');
  }

  private ejecutar(
    op: ReturnType<CalendariosService['obtener']>,
    mensaje: string,
    alTerminar?: () => void,
  ): void {
    this.guardando.set(true);
    this.error.set(null);
    op.subscribe({
      next: (c) => {
        this.tomar(c);
        this.guardando.set(false);
        alTerminar?.();
        this.cambiado.emit(mensaje);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.guardando.set(false);
      },
    });
  }
}

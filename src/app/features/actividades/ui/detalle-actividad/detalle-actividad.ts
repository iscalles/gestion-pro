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
import { Observable, concat } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { PlanificacionService } from '../../data/planificacion.service';
import {
  Actividad,
  ActividadRequest,
  Dependencia,
  PlanCambio,
  Profesional,
  TIPO_ACTIVIDAD,
  TIPO_DEPENDENCIA,
  TipoDependencia,
} from '../../models/planificacion.model';
import { erroresDeCampos, mensajeDeError } from '../../../../core/api/api-error';
import { dateAIso, isoADate } from '../../../../shared/util/fechas';

/** Fila editable de predecesora: existente (id) o nueva (id null). */
interface FilaPredecesora {
  clave: string;
  id: number | null;
  predecesoraId: number | null;
  tipo: TipoDependencia;
  desfaseDias: number;
  quitar: boolean;
  original?: Dependencia;
}

/**
 * Panel de detalle de una actividad: datos, fechas reales, avance y predecesoras.
 * Todo se aplica junto con "Guardar y recalcular"; Cancelar descarta.
 */
@Component({
  selector: 'gp-detalle-actividad',
  imports: [
    DatePipe,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    MessageModule,
    TooltipModule,
  ],
  templateUrl: './detalle-actividad.html',
  styleUrl: './detalle-actividad.scss',
})
export class DetalleActividad {
  readonly actividad = input.required<Actividad>();
  readonly actividades = input.required<Actividad[]>();
  readonly dependencias = input.required<Dependencia[]>();
  readonly profesionales = input.required<Profesional[]>();
  readonly proyectoId = input.required<number>();

  /** El plan cambió en el servidor (con o sin éxito completo). */
  readonly aplicado = output<PlanCambio>();

  private readonly servicio = inject(PlanificacionService);
  private secuencia = 0;

  protected readonly tiposDependencia = (Object.keys(TIPO_DEPENDENCIA) as TipoDependencia[]).map(
    (t) => ({
      value: t,
      label: t,
      ayuda: TIPO_DEPENDENCIA[t].nombre,
    }),
  );

  // Formulario
  protected readonly nombre = signal('');
  protected readonly descripcion = signal('');
  protected readonly responsableId = signal<number | null>(null);
  protected readonly duracionPlan = signal<number | null>(0);
  protected readonly duracionReal = signal<number | null>(null);
  protected readonly inicioReal = signal<Date | null>(null);
  protected readonly terminoReal = signal<Date | null>(null);
  protected readonly avance = signal<number | null>(0);
  protected readonly filas = signal<FilaPredecesora[]>([]);

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly errorCodigo = signal<string | null>(null);
  protected readonly errores = signal<Record<string, string>>({});

  constructor() {
    // Al cambiar de actividad (o al llegar el plan recalculado) el formulario toma los valores del servidor.
    let idAnterior: number | null = null;
    effect(() => {
      const a = this.actividad();
      const deps = this.dependencias();
      untracked(() => {
        if (a.id !== idAnterior) {
          this.error.set(null);
          this.errorCodigo.set(null);
          idAnterior = a.id;
        }
        this.restablecer(a, deps);
      });
    });
  }

  /** Copia al formulario los valores del servidor. */
  private restablecer(a: Actividad, deps: Dependencia[]): void {
    this.errores.set({});
    this.nombre.set(a.nombre);
    this.descripcion.set(a.descripcion ?? '');
    this.responsableId.set(a.responsableId);
    this.duracionPlan.set(a.duracionPlan);
    this.duracionReal.set(a.duracionReal);
    this.inicioReal.set(isoADate(a.fechaInicioReal));
    this.terminoReal.set(isoADate(a.fechaTerminoReal));
    this.avance.set(a.avance);
    this.filas.set(
      deps
        .filter((d) => d.sucesoraId === a.id)
        .map((d) => ({
          clave: `d${d.id}`,
          id: d.id,
          predecesoraId: d.predecesoraId,
          tipo: d.tipo,
          desfaseDias: d.desfaseDias,
          quitar: false,
          original: d,
        })),
    );
  }

  protected readonly porId = computed(() => new Map(this.actividades().map((a) => [a.id, a])));
  protected readonly padre = computed(() => {
    const p = this.actividad().padreId;
    return p == null ? null : (this.porId().get(p) ?? null);
  });
  protected readonly tipoEtiqueta = computed(() => TIPO_ACTIVIDAD[this.actividad().tipo]);

  protected readonly opcionesResponsable = computed(() => [
    { label: 'Sin responsable', value: null },
    ...this.profesionales().map((p) => ({ label: p.nombre, value: p.id })),
  ]);

  /** Hojas que pueden ser predecesoras: ni ella misma ni las ya elegidas. */
  protected opcionesPredecesora(fila: FilaPredecesora) {
    const usadas = new Set(
      this.filas()
        .filter((f) => f !== fila && !f.quitar)
        .map((f) => f.predecesoraId),
    );
    const yo = this.actividad().id;
    return this.actividades()
      .filter((a) => a.esHoja && a.id !== yo && !usadas.has(a.id))
      .map((a) => ({ label: a.nombre, value: a.id, tipo: TIPO_ACTIVIDAD[a.tipo] }));
  }

  protected nombreDe(id: number | null): string {
    return id == null ? '' : (this.porId().get(id)?.nombre ?? '');
  }

  /** Todas las sucesoras directas e indirectas (las que el motor puede mover). */
  protected readonly sucesoras = computed(() => {
    const salientes = new Map<number, number[]>();
    for (const d of this.dependencias()) {
      salientes.set(d.predecesoraId, [...(salientes.get(d.predecesoraId) ?? []), d.sucesoraId]);
    }
    const vistos = new Set<number>();
    const cola = [this.actividad().id];
    while (cola.length) {
      for (const s of salientes.get(cola.shift()!) ?? []) {
        if (!vistos.has(s)) {
          vistos.add(s);
          cola.push(s);
        }
      }
    }
    return [...vistos].map((id) => this.nombreDe(id));
  });

  protected readonly textoSucesoras = computed(() => {
    const s = this.sucesoras();
    if (!s.length) return '';
    const muestra = s.slice(0, 3).join(', ');
    const resto = s.length > 3 ? ` y ${s.length - 3} más` : '';
    return `Al guardar se recalculan ${s.length === 1 ? 'una sucesora' : s.length + ' sucesoras'}: ${muestra}${resto}.`;
  });

  private readonly cambiosActividad = computed(() => {
    const a = this.actividad();
    const base =
      this.nombre().trim() !== a.nombre ||
      (this.descripcion().trim() || null) !== (a.descripcion ?? null) ||
      this.responsableId() !== a.responsableId;
    if (!a.esHoja) return base;
    return (
      base ||
      this.duracionPlan() !== a.duracionPlan ||
      (this.duracionReal() ?? null) !== a.duracionReal ||
      dateAIso(this.inicioReal()) !== a.fechaInicioReal ||
      dateAIso(this.terminoReal()) !== a.fechaTerminoReal ||
      Number(this.avance() ?? 0) !== Number(a.avance)
    );
  });

  private readonly cambiosDependencias = computed(() =>
    this.filas().some(
      (f) =>
        (f.id == null && f.predecesoraId != null) ||
        f.quitar ||
        (f.original && (f.tipo !== f.original.tipo || f.desfaseDias !== f.original.desfaseDias)),
    ),
  );

  protected readonly hayCambios = computed(
    () => this.cambiosActividad() || this.cambiosDependencias(),
  );
  protected readonly hayFilaIncompleta = computed(() =>
    this.filas().some((f) => f.id == null && f.predecesoraId == null),
  );

  protected agregarPredecesora(): void {
    this.filas.update((fs) => [
      ...fs,
      {
        clave: `n${++this.secuencia}`,
        id: null,
        predecesoraId: null,
        tipo: 'FS',
        desfaseDias: 0,
        quitar: false,
      },
    ]);
  }

  protected actualizarFila(fila: FilaPredecesora, cambio: Partial<FilaPredecesora>): void {
    this.filas.update((fs) => fs.map((f) => (f === fila ? { ...f, ...cambio } : f)));
    this.error.set(null);
  }

  protected quitarFila(fila: FilaPredecesora): void {
    if (fila.id == null) {
      this.filas.update((fs) => fs.filter((f) => f !== fila));
    } else {
      this.actualizarFila(fila, { quitar: !fila.quitar });
    }
  }

  protected cancelar(): void {
    this.error.set(null);
    this.errorCodigo.set(null);
    this.restablecer(this.actividad(), this.dependencias());
  }

  protected desfaseTexto(d: number): string {
    return d > 0 ? `+${d} d` : `${d} d`;
  }

  protected guardar(): void {
    const pid = this.proyectoId();
    const a = this.actividad();
    const pasos: Observable<PlanCambio>[] = [];

    if (this.cambiosActividad()) {
      const datos: ActividadRequest = {
        nombre: this.nombre().trim(),
        descripcion: this.descripcion().trim() || null,
        responsableId: this.responsableId(),
        duracionPlan: a.esHoja ? (this.duracionPlan() ?? 0) : a.duracionPlan,
        duracionReal: a.esHoja ? this.duracionReal() : null,
        fechaInicioReal: a.esHoja ? dateAIso(this.inicioReal()) : null,
        fechaTerminoReal: a.esHoja ? dateAIso(this.terminoReal()) : null,
        avance: a.esHoja ? (this.avance() ?? 0) : null,
      };
      pasos.push(this.servicio.actualizarActividad(pid, a.id, datos));
    }
    // Primero se quitan vínculos, luego se editan y al final se agregan (los nuevos pueden cerrar ciclos).
    for (const f of this.filas()) {
      if (f.id != null && f.quitar) pasos.push(this.servicio.eliminarDependencia(pid, f.id));
    }
    for (const f of this.filas()) {
      if (
        f.id != null &&
        !f.quitar &&
        f.original &&
        (f.tipo !== f.original.tipo || f.desfaseDias !== f.original.desfaseDias)
      ) {
        pasos.push(
          this.servicio.actualizarDependencia(pid, f.id, {
            predecesoraId: f.predecesoraId!,
            sucesoraId: a.id,
            tipo: f.tipo,
            desfaseDias: f.desfaseDias ?? 0,
          }),
        );
      }
    }
    for (const f of this.filas()) {
      if (f.id == null && f.predecesoraId != null) {
        pasos.push(
          this.servicio.crearDependencia(pid, {
            predecesoraId: f.predecesoraId,
            sucesoraId: a.id,
            tipo: f.tipo,
            desfaseDias: f.desfaseDias ?? 0,
          }),
        );
      }
    }
    if (!pasos.length) return;

    // Acumula las actividades recalculadas de todos los pasos para informarlas juntas.
    const recalculadas = new Map<number, PlanCambio['recalculadas'][number]>();
    let ultimo: PlanCambio | null = null;
    this.guardando.set(true);
    this.error.set(null);
    this.errorCodigo.set(null);
    this.errores.set({});
    concat(...pasos).subscribe({
      next: (r) => {
        ultimo = r;
        r.recalculadas.forEach((c) => recalculadas.set(c.id, c));
      },
      error: (e) => {
        this.guardando.set(false);
        this.error.set(mensajeDeError(e));
        this.errorCodigo.set((e?.error?.codigo as string) ?? null);
        this.errores.set(erroresDeCampos(e));
        // Lo que alcanzó a guardarse ya está en el servidor: se resincroniza el plan.
        if (ultimo)
          this.aplicado.emit({ plan: ultimo.plan, recalculadas: [...recalculadas.values()] });
      },
      complete: () => {
        this.guardando.set(false);
        if (ultimo)
          this.aplicado.emit({ plan: ultimo.plan, recalculadas: [...recalculadas.values()] });
      },
    });
  }
}

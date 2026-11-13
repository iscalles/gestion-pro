import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
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
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { SelectorProyecto } from '../../../../shared/ui/selector-proyecto/selector-proyecto';
import { SemaforoBadge } from '../../../../shared/ui/semaforo/semaforo';
import { Resaltar } from '../../../../shared/ui/movimiento/resaltar';
import { Sparkline } from '../../../../shared/graficos/sparkline';
import { GraficoLineas, SerieLinea } from '../../../../shared/graficos/grafico-lineas';
import { SERIE } from '../../../../shared/graficos/paleta';
import { contextoProyecto } from '../../../../shared/util/contexto-proyecto';
import { fmtFechaCorta, fmtValorKpi, hoyIso } from '../../../../shared/util/formato';
import { mensajeDeError } from '../../../../core/api/api-error';
import { AuthService } from '../../../../core/auth/auth.service';
import { KpiService } from '../../data/kpi.service';
import { AMBITO_KPI, CategoriaKpi, Kpi, ORIGEN_MEDICION, PERIODICIDAD } from '../../models/kpi.model';
import { KpiFormulario } from '../../ui/kpi-formulario/kpi-formulario';

@Component({
  selector: 'gp-kpi-lista',
  imports: [
    DatePipe, FormsModule, TableModule, ButtonModule, DialogModule, InputNumberModule, InputTextModule,
    MessageModule, SelectModule, SkeletonModule, TextareaModule, ToastModule, ConfirmDialogModule, PageHeader,
    SelectorProyecto, SemaforoBadge, Sparkline, GraficoLineas, KpiFormulario, Resaltar,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './kpi-lista.html',
  styleUrl: './kpi-lista.scss',
})
export class KpiLista {
  protected readonly ctx = contextoProyecto();
  private readonly servicio = inject(KpiService);
  private readonly mensajes = inject(MessageService);
  private readonly confirmacion = inject(ConfirmationService);
  protected readonly esAdmin = inject(AuthService).esAdmin;

  protected readonly kpis = signal<Kpi[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly categoria = signal<CategoriaKpi | null>(null);
  protected readonly busqueda = signal('');
  protected readonly seleccionId = signal<number | null>(null);

  protected readonly ambito = AMBITO_KPI;
  protected readonly periodicidad = PERIODICIDAD;
  protected readonly origen = ORIGEN_MEDICION;
  protected readonly fmt = fmtValorKpi;
  protected readonly hoy = hoyIso();
  protected readonly opcionesCategoria = [
    { label: 'Todas las categorías', value: null },
    { label: 'Proyecto e hitos', value: 'PROYECTO' },
    { label: 'Gestión del cambio', value: 'CAMBIO' },
  ];

  constructor() {
    effect(() => {
      const id = this.ctx.proyectoId();
      if (id != null) untracked(() => this.cargar(id, true));
    });
  }

  protected cargar(id: number, reinicio = false): void {
    this.cargando.set(true);
    this.error.set(null);
    if (reinicio) {
      this.kpis.set([]);
      this.seleccionId.set(null);
    }
    this.servicio.listar(id).subscribe({
      next: (ks) => {
        this.kpis.set(ks);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  protected readonly filtrados = computed(() => {
    const c = this.categoria();
    const q = this.busqueda().trim().toLowerCase();
    return this.kpis().filter(
      (k) => (!c || k.categoria === c) && (!q || k.codigo.toLowerCase().includes(q) || k.nombre.toLowerCase().includes(q)),
    );
  });

  protected readonly resumen = computed(() => {
    const ks = this.filtrados().filter((k) => k.activo);
    return {
      activos: ks.length,
      verde: ks.filter((k) => k.semaforo === 'VERDE').length,
      ambar: ks.filter((k) => k.semaforo === 'AMBAR').length,
      rojo: ks.filter((k) => k.semaforo === 'ROJO').length,
      sinDatos: ks.filter((k) => !k.semaforo).length,
    };
  });

  protected readonly seleccion = computed(() => this.kpis().find((k) => k.id === this.seleccionId()) ?? null);

  /** Historial en orden cronológico. */
  protected readonly cronologia = computed(() => {
    const k = this.seleccion();
    return k ? [...k.historial].sort((a, b) => a.medidoEn.localeCompare(b.medidoEn)) : [];
  });

  protected readonly grafico = computed(() => {
    const k = this.seleccion();
    const h = this.cronologia();
    if (!k || h.length === 0) return null;
    const series: SerieLinea[] = [
      { nombre: k.nombre, color: SERIE.plan, valores: h.map((m) => m.valor) },
      { nombre: 'Meta', color: '#5b6f70', valores: h.map(() => k.meta), discontinua: true },
    ];
    return { etiquetas: h.map((m) => fmtFechaCorta(m.medidoEn.slice(0, 10))), series };
  });

  /** Visual: la fila de un KPI se conserva al recibir su versión nueva, así el valor recalculado se resalta. */
  protected readonly porId = (_: number, k: Kpi) => k.id;

  /** Visual: separa la unidad final del texto ya formateado («66,67 %» → «66,67» y «%») para mostrarla más pequeña. */
  protected cifra(texto: string): { valor: string; unidad: string } {
    const m = /^(.*\d)\s+(\D.*)$/.exec(texto);
    return m ? { valor: m[1], unidad: m[2] } : { valor: texto, unidad: '' };
  }

  protected tendencia(k: Kpi): number[] {
    return [...k.historial]
      .sort((a, b) => a.medidoEn.localeCompare(b.medidoEn))
      .slice(-12)
      .map((m) => m.valor);
  }

  protected formatoDe(k: Kpi): (v: number | null | undefined) => string {
    return (v) => fmtValorKpi(v, k.unidad);
  }

  protected variacion(k: Kpi): { texto: string; mejora: boolean } | null {
    if (k.valor == null || k.valorAnterior == null) return null;
    if (fmtValorKpi(k.valor, k.unidad) === fmtValorKpi(k.valorAnterior, k.unidad)) return null;
    const sube = k.valor > k.valorAnterior;
    const mejora = k.sentido === 'MAYOR' ? sube : k.sentido === 'MENOR' ? !sube : false;
    return { texto: `${sube ? '▲' : '▼'} desde ${fmtValorKpi(k.valorAnterior, k.unidad)}`, mejora };
  }

  protected umbrales(k: Kpi): string {
    const r = (min: number | null, max: number | null) =>
      min != null && max != null ? `${this.fmt(min, k.unidad)} a ${this.fmt(max, k.unidad)}` : min != null ? `≥ ${this.fmt(min, k.unidad)}` : max != null ? `≤ ${this.fmt(max, k.unidad)}` : '—';
    return `En meta ${r(k.verdeMin, k.verdeMax)} · alerta ${r(k.ambarMin, k.ambarMax)} · fuera de meta el resto`;
  }

  // ---------------------------------------------------------------- medición manual

  protected readonly dlgMedicion = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorMedicion = signal<string | null>(null);
  protected medicion = { valor: null as number | null, fecha: hoyIso(), observacion: '' };

  protected abrirMedicion(): void {
    this.medicion = { valor: this.seleccion()?.valor ?? null, fecha: hoyIso(), observacion: '' };
    this.errorMedicion.set(null);
    this.dlgMedicion.set(true);
  }

  protected registrar(): void {
    const k = this.seleccion();
    if (!k || this.medicion.valor == null) {
      this.errorMedicion.set('Indica el valor medido.');
      return;
    }
    this.guardando.set(true);
    this.servicio
      .registrarMedicion(this.ctx.proyectoId()!, k.id, {
        valor: this.medicion.valor,
        fecha: this.medicion.fecha || null,
        observacion: this.medicion.observacion || null,
      })
      .subscribe({
        next: (r) => {
          this.guardando.set(false);
          this.dlgMedicion.set(false);
          this.kpis.update((ks) => ks.map((x) => (x.id === r.id ? r : x)));
          this.mensajes.add({ severity: 'success', summary: 'Medición registrada', detail: `${r.codigo}: ${fmtValorKpi(r.valor, r.unidad)}` });
        },
        error: (e) => {
          this.guardando.set(false);
          this.errorMedicion.set(mensajeDeError(e));
        },
      });
  }

  // ---------------------------------------------------------------- crear / editar (administrador)

  protected readonly formulario = signal<{ kpi: Kpi | null } | null>(null);

  protected guardado(k: Kpi): void {
    const nuevo = !this.kpis().some((x) => x.id === k.id);
    this.kpis.update((ks) => (nuevo ? [...ks, k].sort((a, b) => a.codigo.localeCompare(b.codigo)) : ks.map((x) => (x.id === k.id ? k : x))));
    this.seleccionId.set(k.id);
    this.formulario.set(null);
    this.mensajes.add({ severity: 'success', summary: nuevo ? 'KPI creado' : 'KPI actualizado', detail: `${k.codigo} · ${k.nombre}` });
  }

  protected eliminar(k: Kpi): void {
    this.confirmacion.confirm({
      header: 'Eliminar KPI',
      message: `¿Eliminar ${k.codigo} · ${k.nombre} y todo su historial de mediciones?`,
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { outlined: true },
      accept: () =>
        this.servicio.eliminar(this.ctx.proyectoId()!, k.id).subscribe({
          next: () => {
            this.kpis.update((ks) => ks.filter((x) => x.id !== k.id));
            if (this.seleccionId() === k.id) this.seleccionId.set(null);
            this.mensajes.add({ severity: 'success', summary: 'KPI eliminado', detail: k.codigo });
          },
          error: (e) => this.mensajes.add({ severity: 'error', summary: 'No se pudo eliminar', detail: mensajeDeError(e), life: 8000 }),
        }),
    });
  }
}

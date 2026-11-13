import { Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { erroresDeCampos, mensajeDeError } from '../../../../core/api/api-error';
import { UsuariosService } from '../../../../core/api/usuarios.service';
import { fmtValorKpi } from '../../../../shared/util/formato';
import { PlanificacionService } from '../../../actividades/data/planificacion.service';
import { HitosService } from '../../../hitos/data/hitos.service';
import { CambiosService } from '../../../cambios/data/cambios.service';
import { KpiService } from '../../data/kpi.service';
import {
  AMBITO_KPI, AmbitoKpi, CategoriaKpi, FuenteKpi, Kpi, KpiRequest, PERIODICIDAD, Periodicidad, PruebaFormula, SentidoKpi, Variable,
} from '../../models/kpi.model';

interface Opcion {
  label: string;
  value: number;
}

/** Alta y edición de un KPI (solo administrador): fórmula con variables del catálogo, umbrales y vínculos. */
@Component({
  selector: 'gp-kpi-formulario',
  imports: [
    FormsModule, ButtonModule, DialogModule, InputNumberModule, InputTextModule, MessageModule, MultiSelectModule,
    SelectModule, TextareaModule, ToggleSwitchModule,
  ],
  templateUrl: './kpi-formulario.html',
  styleUrl: './kpi-formulario.scss',
})
export class KpiFormulario {
  readonly proyectoId = input.required<number>();
  readonly kpi = input<Kpi | null>(null);
  readonly cantidad = input(0);
  readonly guardado = output<Kpi>();
  readonly cerrar = output<void>();

  private readonly servicio = inject(KpiService);
  private readonly planificacion = inject(PlanificacionService);
  private readonly hitosServicio = inject(HitosService);
  private readonly cambiosServicio = inject(CambiosService);
  private readonly usuariosServicio = inject(UsuariosService);
  private readonly areaFormula = viewChild<ElementRef<HTMLTextAreaElement>>('areaFormula');

  protected readonly visible = signal(true);
  protected readonly guardando = signal(false);
  protected readonly errorForm = signal<string | null>(null);
  protected readonly errores = signal<Record<string, string>>({});
  protected readonly variables = signal<Variable[]>([]);
  protected readonly prueba = signal<PruebaFormula | null>(null);
  protected readonly probando = signal(false);

  private readonly etapas = signal<Opcion[]>([]);
  private readonly actividades = signal<Opcion[]>([]);
  protected readonly hitos = signal<Opcion[]>([]);
  private readonly solicitudes = signal<Opcion[]>([]);
  protected readonly usuarios = signal<Opcion[]>([]);

  protected f = {
    codigo: '',
    nombre: '',
    objetivo: '',
    categoria: 'PROYECTO' as CategoriaKpi,
    ambito: 'PROYECTO' as AmbitoKpi,
    ambitoRefId: null as number | null,
    fuente: 'AUTOMATICA' as FuenteKpi,
    formula: '',
    unidad: '%',
    sentido: 'MAYOR' as SentidoKpi,
    meta: null as number | null,
    verdeMin: null as number | null,
    verdeMax: null as number | null,
    ambarMin: null as number | null,
    ambarMax: null as number | null,
    periodicidad: 'SEMANAL' as Periodicidad,
    responsableId: null as number | null,
    activo: true,
    hitoIds: [] as number[],
  };

  protected readonly opcionesCategoria = [
    { label: 'Proyecto e hitos', value: 'PROYECTO' },
    { label: 'Gestión del cambio', value: 'CAMBIO' },
  ];
  protected readonly opcionesAmbito = (Object.keys(AMBITO_KPI) as AmbitoKpi[]).map((value) => ({ label: AMBITO_KPI[value], value }));
  protected readonly opcionesPeriodicidad = (Object.keys(PERIODICIDAD) as Periodicidad[]).map((value) => ({ label: PERIODICIDAD[value], value }));
  protected readonly opcionesSentido = [
    { label: 'Más es mejor', value: 'MAYOR' },
    { label: 'Menos es mejor', value: 'MENOR' },
    { label: 'Dentro de un rango', value: 'RANGO' },
  ];
  protected readonly opcionesFuente = [
    { label: 'Automática (fórmula)', value: 'AUTOMATICA' },
    { label: 'Manual', value: 'MANUAL' },
  ];

  constructor() {
    queueMicrotask(() => this.iniciar());
  }

  private iniciar(): void {
    const k = this.kpi();
    if (k) {
      this.f = {
        codigo: k.codigo,
        nombre: k.nombre,
        objetivo: k.objetivo ?? '',
        categoria: k.categoria,
        ambito: k.ambito,
        ambitoRefId: k.ambitoRefId,
        fuente: k.fuente,
        formula: k.formula ?? '',
        unidad: k.unidad,
        sentido: k.sentido,
        meta: k.meta,
        verdeMin: k.verdeMin,
        verdeMax: k.verdeMax,
        ambarMin: k.ambarMin,
        ambarMax: k.ambarMax,
        periodicidad: k.periodicidad,
        responsableId: k.responsableId,
        activo: k.activo,
        hitoIds: [...k.hitoIds],
      };
    } else {
      this.f.codigo = `KPI-${String(this.cantidad() + 1).padStart(2, '0')}`;
    }
    const pid = this.proyectoId();
    forkJoin({
      variables: this.servicio.variables(),
      plan: this.planificacion.plan(pid),
      hitos: this.hitosServicio.listar(pid),
      solicitudes: this.cambiosServicio.listar(pid),
      usuarios: this.usuariosServicio.listar(),
    }).subscribe({
      next: (r) => {
        this.variables.set(r.variables);
        this.etapas.set(r.plan.actividades.filter((a) => a.nivel === 0).map((a) => ({ label: `${a.codigoEdt} ${a.nombre}`, value: a.id })));
        this.actividades.set(r.plan.actividades.map((a) => ({ label: `${a.codigoEdt} ${a.nombre}`, value: a.id })));
        this.hitos.set(r.hitos.map((h) => ({ label: `${h.codigo} ${h.descripcion}`, value: h.id })));
        this.solicitudes.set(r.solicitudes.map((s) => ({ label: `${s.codigo} ${s.titulo}`, value: s.id })));
        this.usuarios.set(r.usuarios.map((u) => ({ label: u.nombre, value: u.id })));
      },
      error: (e) => this.errorForm.set(mensajeDeError(e)),
    });
  }

  protected variablesDe(categoria: CategoriaKpi): Variable[] {
    return this.variables().filter((v) => v.categoria === categoria);
  }

  protected opcionesRef(ambito: AmbitoKpi): Opcion[] {
    switch (ambito) {
      case 'ETAPA':
        return this.etapas();
      case 'ACTIVIDAD':
        return this.actividades();
      case 'HITO':
        return this.hitos();
      case 'CAMBIO':
        return this.solicitudes();
      default:
        return [];
    }
  }

  protected cambioAmbito(): void {
    this.f.ambitoRefId = null;
    if (this.f.ambito === 'CAMBIO') this.f.categoria = 'CAMBIO';
    this.prueba.set(null);
  }

  protected insertar(codigo: string): void {
    const area = this.areaFormula()?.nativeElement;
    const actual = this.f.formula ?? '';
    const ini = area?.selectionStart ?? actual.length;
    const fin = area?.selectionEnd ?? actual.length;
    this.f.formula = actual.slice(0, ini) + codigo + actual.slice(fin);
    this.prueba.set(null);
    queueMicrotask(() => {
      if (area) {
        area.focus();
        area.setSelectionRange(ini + codigo.length, ini + codigo.length);
      }
    });
  }

  protected probar(): void {
    if (!this.f.formula.trim()) return;
    this.probando.set(true);
    this.servicio.probar(this.proyectoId(), this.f.formula, this.f.ambito, this.f.ambitoRefId).subscribe({
      next: (p) => {
        this.probando.set(false);
        this.prueba.set(p);
      },
      error: (e) => {
        this.probando.set(false);
        this.prueba.set({ valor: null, variables: [], mensaje: mensajeDeError(e) });
      },
    });
  }

  protected fmt(v: number | null): string {
    return fmtValorKpi(v, this.f.unidad);
  }

  protected guardar(): void {
    const f = this.f;
    const datos: KpiRequest = {
      ...f,
      objetivo: f.objetivo,
      formula: f.formula.trim() || null,
      meta: f.meta as number,
      responsableId: f.responsableId,
      ambitoRefId: f.ambito === 'PROYECTO' ? null : f.ambitoRefId,
    };
    const k = this.kpi();
    this.guardando.set(true);
    this.errorForm.set(null);
    this.errores.set({});
    this.servicio.guardar(this.proyectoId(), k?.id ?? null, datos).subscribe({
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

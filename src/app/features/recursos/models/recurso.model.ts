import { TipoActividad } from '../../actividades/models/planificacion.model';

export type TipoRecurso = 'LICENCIA' | 'MATERIAL' | 'EQUIPAMIENTO' | 'OTRO';

export const TIPO_RECURSO: Record<TipoRecurso, string> = {
  LICENCIA: 'Software / licencia',
  MATERIAL: 'Material',
  EQUIPAMIENTO: 'Equipamiento',
  OTRO: 'Otro',
};

export const TIPO_COSTO: Record<string, string> = { PROFESIONALES: 'Profesionales', ...TIPO_RECURSO };

export interface CostoActividad {
  id: number;
  padreId: number | null;
  codigoEdt: string;
  nombre: string;
  tipo: TipoActividad;
  nivel: number;
  esHoja: boolean;
  duracionPlan: number;
  fechaInicioPlan: string | null;
  fechaTerminoPlan: string | null;
  avance: number;
  planProfesionales: number;
  planRecursos: number;
  costoPlan: number;
  costoReal: number;
  asignaciones: number;
}

export interface AsignacionProfesional {
  id: number;
  actividadId: number;
  actividad: string;
  profesionalId: number;
  profesional: string;
  especialidad: string;
  horasSemana: number;
  semanas: number;
  valorHora: number;
  horasPlan: number;
  costoPlan: number;
  horasReales: number;
  costoReal: number;
}

export interface AsignacionRecurso {
  id: number;
  actividadId: number;
  actividad: string;
  recursoId: number;
  recurso: string;
  tipo: TipoRecurso;
  unidad: string | null;
  cantidad: number;
  costoUnitario: number;
  periodo: number;
  costoPlan: number;
  costoReal: number;
}

export interface Recurso {
  id: number;
  tipo: TipoRecurso;
  descripcion: string;
  detalle: string | null;
  unidad: string | null;
  cantidad: number;
  costoUnitario: number;
  periodo: number;
  costoTotal: number;
  capacidad: number;
  asignado: number;
  disponible: number;
}

export interface Requerimiento {
  id: number;
  tipoProfesionalId: number;
  categoria: string;
  cantidadRequerida: number;
  tarifaHora: number;
  asignados: number;
  cubierto: boolean;
  profesionales: string[];
}

export interface Aporte {
  proyectoId: number;
  proyecto: string;
  actividadId: number;
  actividad: string;
  horas: number;
}

export interface Sobreasignacion {
  profesionalId: number;
  profesional: string;
  semana: string;
  horas: number;
  disponibles: number;
  exceso: number;
  aportes: Aporte[];
}

export interface Costos {
  proyectoId: number;
  presupuesto: number;
  costoPlan: number;
  costoReal: number;
  valorGanado: number;
  valorPlanificado: number;
  spi: number | null;
  cpi: number | null;
  desviacion: number;
  porTipo: { tipo: string; costoPlan: number; costoReal: number }[];
  actividades: CostoActividad[];
  asignacionesProfesional: AsignacionProfesional[];
  asignacionesRecurso: AsignacionRecurso[];
  recursos: Recurso[];
  requerimientos: Requerimiento[];
  sobreasignaciones: Sobreasignacion[];
}

export interface CargaSemana {
  semana: string;
  horas: number;
  disponibles: number;
  sobreasignada: boolean;
  aportes: Aporte[];
}

export interface CargaProfesional {
  profesionalId: number;
  nombre: string;
  especialidad: string;
  horasSemanaDisp: number;
  activo: boolean;
  semanas: CargaSemana[];
  sobreasignado: boolean;
}

export interface ProfesionalFicha {
  id: number;
  nombre: string;
  especialidad: string;
  tipoProfesionalId: number | null;
  tipoProfesional: string | null;
  valorHora: number;
  horasSemanaDisp: number;
  usuarioId: number | null;
  activo: boolean;
}

export interface TipoProfesional {
  id: number;
  categoria: string;
  tarifaHoraRef: number;
  profesionales: number;
}

export interface AsignacionProfesionalRequest {
  actividadId: number;
  profesionalId: number;
  horasSemana: number;
  valorHora?: number | null;
  horasReales?: number | null;
}

export interface AsignacionRecursoRequest {
  actividadId: number;
  recursoId: number;
  cantidad: number;
  periodo?: number | null;
  costoReal?: number | null;
}

export interface RecursoRequest {
  tipo: TipoRecurso;
  descripcion: string;
  detalle?: string | null;
  unidad?: string | null;
  cantidad: number;
  costoUnitario: number;
  periodo?: number | null;
}

export interface RequerimientoRequest {
  tipoProfesionalId: number;
  cantidadRequerida: number;
  tarifaHora: number;
}

export interface ProfesionalRequest {
  nombre: string;
  especialidad: string;
  tipoProfesionalId: number | null;
  valorHora: number;
  horasSemanaDisp: number;
  usuarioId?: number | null;
  activo?: boolean;
}

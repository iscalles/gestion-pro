export type TipoActividad = 'ETAPA' | 'ACTIVIDAD' | 'SUBACTIVIDAD';
export type TipoDependencia = 'FS' | 'SS' | 'FF' | 'SF';

/** ActividadDto del backend. En elementos con hijos (esHoja = false) duración, fechas y avance son derivados. */
export interface Actividad {
  id: number;
  padreId: number | null;
  tipo: TipoActividad;
  nivel: number;
  orden: number;
  nombre: string;
  descripcion: string | null;
  responsableId: number | null;
  responsable: string | null;
  duracionPlan: number;
  duracionReal: number | null;
  fechaInicioPlan: string | null; // ISO yyyy-mm-dd
  fechaTerminoPlan: string | null;
  fechaInicioReal: string | null;
  fechaTerminoReal: string | null;
  avance: number;
  esHoja: boolean;
  atrasada: boolean;
}

export interface Dependencia {
  id: number;
  predecesoraId: number;
  sucesoraId: number;
  tipo: TipoDependencia;
  desfaseDias: number;
}

/** GET /api/proyectos/{id}/plan. Las actividades vienen en orden de árbol. */
export interface Plan {
  proyectoId: number;
  calendarioId: number;
  fechaInicioProyecto: string;
  actividades: Actividad[];
  dependencias: Dependencia[];
}

export interface CambioFecha {
  id: number;
  nombre: string;
  inicioAntes: string | null;
  terminoAntes: string | null;
  inicio: string;
  termino: string;
}

/** Respuesta de toda operación que modifica la planificación. */
export interface PlanCambio {
  plan: Plan;
  recalculadas: CambioFecha[];
}

export interface ActividadRequest {
  padreId?: number | null;
  nombre: string;
  descripcion?: string | null;
  responsableId?: number | null;
  duracionPlan: number;
  duracionReal?: number | null;
  fechaInicioReal?: string | null;
  fechaTerminoReal?: string | null;
  avance?: number | null;
}

export interface DependenciaRequest {
  predecesoraId: number;
  sucesoraId: number;
  tipo: TipoDependencia;
  desfaseDias: number;
}

export interface Profesional {
  id: number;
  nombre: string;
  especialidad: string;
}

export const TIPO_ACTIVIDAD: Record<TipoActividad, string> = {
  ETAPA: 'Etapa',
  ACTIVIDAD: 'Actividad',
  SUBACTIVIDAD: 'Subactividad',
};

export const TIPO_DEPENDENCIA: Record<TipoDependencia, { nombre: string; regla: string }> = {
  FS: { nombre: 'Fin a inicio', regla: 'Empieza cuando la predecesora termina' },
  SS: { nombre: 'Inicio a inicio', regla: 'Empieza cuando la predecesora empieza' },
  FF: { nombre: 'Fin a fin', regla: 'Termina cuando la predecesora termina' },
  SF: { nombre: 'Inicio a fin', regla: 'Termina cuando la predecesora empieza' },
};

/** Tipo que tendría un hijo de esta actividad, o null si no admite hijos. */
export function tipoHijo(padre: Actividad | null): TipoActividad | null {
  if (!padre) return 'ETAPA';
  if (padre.tipo === 'ETAPA') return 'ACTIVIDAD';
  if (padre.tipo === 'ACTIVIDAD') return 'SUBACTIVIDAD';
  return null;
}

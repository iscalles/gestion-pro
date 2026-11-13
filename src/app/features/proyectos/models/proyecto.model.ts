export type EstadoProyecto = 'PLANIFICADO' | 'EN_EJECUCION' | 'SUSPENDIDO' | 'TERMINADO';

/** Respuesta de GET /api/proyectos (ProyectoDto en el backend). */
export interface Proyecto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  responsableId: number;
  responsable: string;
  calendarioId: number;
  fechaInicio: string; // ISO yyyy-mm-dd
  fechaTermino: string;
  presupuesto: number;
  estado: EstadoProyecto;
  /** Calculado por el backend desde las actividades hoja. */
  avance: number;
  fechaInicioReal: string | null;
  fechaTerminoReal: string | null;
  /** Término que resulta de la programación de actividades. */
  terminoPrevisto: string | null;
  costoPlan: number;
  costoReal: number;
  miembroIds: number[];
  solicitudesAbiertas: number;
}

/** Cuerpo de POST y PUT /api/proyectos (ProyectoRequest en el backend). */
export interface ProyectoRequest {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  responsableId: number;
  calendarioId: number;
  fechaInicio: string;
  fechaTermino: string;
  presupuesto: number;
  estado?: EstadoProyecto;
  miembroIds?: number[];
}

export const ESTADO_PROYECTO: Record<EstadoProyecto, { etiqueta: string; tono: 'neutral' | 'accent' | 'warn' | 'ok' }> = {
  PLANIFICADO: { etiqueta: 'Planificado', tono: 'neutral' },
  EN_EJECUCION: { etiqueta: 'En ejecución', tono: 'accent' },
  SUSPENDIDO: { etiqueta: 'Suspendido', tono: 'warn' },
  TERMINADO: { etiqueta: 'Terminado', tono: 'ok' },
};

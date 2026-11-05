export type EstadoProyecto = 'PLANIFICADO' | 'EN_EJECUCION' | 'SUSPENDIDO' | 'TERMINADO';

export interface Proyecto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  responsable: string;
  fechaInicio: string; // ISO yyyy-mm-dd
  fechaTermino: string;
  presupuesto: number;
  estado: EstadoProyecto;
  /** Calculado por el backend desde las actividades hoja. */
  avance: number;
}

export const ESTADO_PROYECTO: Record<EstadoProyecto, { etiqueta: string; tono: 'neutral' | 'accent' | 'warn' | 'ok' }> = {
  PLANIFICADO: { etiqueta: 'Planificado', tono: 'neutral' },
  EN_EJECUCION: { etiqueta: 'En ejecución', tono: 'accent' },
  SUSPENDIDO: { etiqueta: 'Suspendido', tono: 'warn' },
  TERMINADO: { etiqueta: 'Terminado', tono: 'ok' },
};

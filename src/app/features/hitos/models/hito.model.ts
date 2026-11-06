export type EstadoHito = 'PENDIENTE' | 'CUMPLIDO' | 'CANCELADO';
export type EstadoHitoCalculado = EstadoHito | 'ATRASADO';

/** HitoDto del backend (GET /api/proyectos/{id}/hitos). */
export interface Hito {
  id: number;
  codigo: string;
  descripcion: string;
  responsableId: number;
  responsable: string;
  fechaComprometida: string; // ISO yyyy-mm-dd
  fechaReal: string | null;
  estado: EstadoHito;
  /** "Atrasado" = pendiente con fecha comprometida vencida. */
  estadoCalculado: EstadoHitoCalculado;
  cumplidoEnPlazo: boolean;
  /** Término planificado más tardío de sus actividades. */
  fechaPrevista: string | null;
  /** Pendiente y la fecha prevista supera la comprometida. */
  enRiesgo: boolean;
  actividadIds: number[];
}

export const ESTADO_HITO: Record<
  EstadoHitoCalculado,
  { etiqueta: string; tono: 'neutral' | 'accent' | 'warn' | 'ok' | 'danger' }
> = {
  PENDIENTE: { etiqueta: 'Pendiente', tono: 'accent' },
  ATRASADO: { etiqueta: 'Atrasado', tono: 'danger' },
  CUMPLIDO: { etiqueta: 'Cumplido', tono: 'ok' },
  CANCELADO: { etiqueta: 'Cancelado', tono: 'neutral' },
};

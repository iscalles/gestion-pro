import { Evidencia } from '../../../shared/ui/evidencias/evidencias';
import { Semaforo } from '../../../shared/ui/semaforo/semaforo';

export type EstadoHito = 'PENDIENTE' | 'CUMPLIDO' | 'CANCELADO';
export type EstadoHitoCalculado = EstadoHito | 'ATRASADO';

export interface CriterioHito {
  id: number;
  orden: number;
  descripcion: string;
  cumplido: boolean;
}

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
  actividades: string[];
  criterios: CriterioHito[];
  criteriosCumplidos: number;
  evidencias: Evidencia[];
  kpis: { id: number; codigo: string; nombre: string; valor: number | null; unidad: string; semaforo: Semaforo | null }[];
}

export interface HitoRequest {
  codigo: string;
  descripcion: string;
  responsableId: number;
  fechaComprometida: string;
  fechaReal?: string | null;
  estado?: EstadoHito;
  actividadIds: number[];
  criterios: { id?: number | null; descripcion: string; cumplido: boolean }[];
  kpiIds: number[];
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

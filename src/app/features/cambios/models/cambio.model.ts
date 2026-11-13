import { Evidencia } from '../../../shared/ui/evidencias/evidencias';
import { Tono } from '../../../shared/ui/status-badge/status-badge';
import { CambioFecha } from '../../actividades/models/planificacion.model';
import { MedicionGatillada } from '../../kpi/models/kpi.model';

export type EstadoSolicitud = 'ABIERTO' | 'EN_EVALUACION' | 'APROBADO' | 'RECHAZADO' | 'EN_IMPLEMENTACION' | 'CERRADO';
export type TipoCambio = 'ALCANCE' | 'TIEMPO' | 'COSTO' | 'RECURSO' | 'TECNOLOGIA' | 'ORGANIZACION';
export type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type Nivel = 'BAJA' | 'MEDIA' | 'ALTA';
export type NivelImpacto = 'BAJO' | 'MEDIO' | 'ALTO';
export type EstadoEtapa = 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADA' | 'OMITIDA';
export type EntidadModificada =
  | 'ACTIVIDAD'
  | 'DEPENDENCIA'
  | 'ASIGNACION_PROFESIONAL'
  | 'ASIGNACION_RECURSO'
  | 'RECURSO'
  | 'HITO'
  | 'PROYECTO';

export interface SolicitudResumen {
  id: number;
  codigo: string;
  titulo: string;
  solicitante: string;
  fechaSolicitud: string;
  tipo: TipoCambio;
  prioridad: Prioridad;
  estado: EstadoSolicitud;
  etapaActual: number;
  etapaNombre: string;
  responsableId: number;
  responsable: string;
  fechaComprometida: string;
  fechaReal: string | null;
  atrasada: boolean;
  probabilidad: Nivel | null;
  impacto: NivelImpacto | null;
  riesgoCritico: boolean;
  impactoPlazoDias: number;
  costoEstimado: number;
  costoReal: number | null;
  modificaciones: number;
  modificacionesAplicadas: number;
}

export interface EtapaSolicitud {
  id: number;
  numero: number;
  nombre: string;
  descripcion: string | null;
  estado: EstadoEtapa;
  responsableId: number | null;
  responsable: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  fechaLimite: string | null;
  observacion: string | null;
  vencida: boolean;
  aTiempo: boolean;
}

export interface Modificacion {
  id: number;
  entidad: EntidadModificada;
  entidadId: number;
  entidadNombre: string;
  campo: string;
  campoNombre: string;
  valorAnterior: string | null;
  valorActual: string | null;
  valorNuevo: string;
  aplicada: boolean;
  fechaAplicacion: string | null;
}

export interface AccionCorrectiva {
  id: number;
  solicitudId: number;
  solicitud: string;
  descripcion: string;
  responsableId: number;
  responsable: string;
  fechaCompromiso: string;
  fechaCierre: string | null;
  estado: 'ABIERTA' | 'CERRADA';
  vencida: boolean;
}

export interface Solicitud extends Omit<SolicitudResumen, 'etapaNombre' | 'modificaciones' | 'modificacionesAplicadas'> {
  descripcion: string;
  justificacion: string | null;
  riesgo: string | null;
  impactoCosto: number;
  impactoRecursos: string | null;
  impactoAlcance: string | null;
  aprobadoPorId: number | null;
  aprobadoPor: string | null;
  fechaDecision: string | null;
  resultado: string | null;
  efectividad: number | null;
  adopcion: number | null;
  impactoPlazoReal: number | null;
  impactoCostoReal: number | null;
  lineaBase: string | null;
  version: number;
  etapas: EtapaSolicitud[];
  modificaciones: Modificacion[];
  acciones: AccionCorrectiva[];
  evidencias: Evidencia[];
  kpiAfectados: MedicionGatillada[];
}

export interface SolicitudRequest {
  titulo: string;
  solicitante: string;
  fechaSolicitud: string;
  descripcion: string;
  justificacion?: string | null;
  tipo: TipoCambio;
  prioridad: Prioridad;
  riesgo?: string | null;
  probabilidad?: Nivel | null;
  impacto?: NivelImpacto | null;
  impactoPlazoDias?: number | null;
  impactoCosto?: number | null;
  impactoRecursos?: string | null;
  impactoAlcance?: string | null;
  responsableId: number;
  fechaComprometida: string;
  costoEstimado?: number | null;
}

export interface OpcionModificacion {
  entidad: EntidadModificada;
  entidadId: number;
  nombre: string;
  campos: {
    campo: string;
    etiqueta: string;
    tipo: 'ENTERO' | 'DECIMAL' | 'FECHA' | 'LISTA';
    valorActual: string | null;
    opciones: string[] | null;
  }[];
}

export interface Aprobacion {
  solicitud: Solicitud;
  lineaBase: string | null;
  terminoAntes: string | null;
  terminoDespues: string | null;
  diasHabilesDesplazados: number;
  costoAntes: number;
  costoDespues: number;
  recalculadas: CambioFecha[];
  kpiAfectados: MedicionGatillada[];
}

export interface Trazabilidad {
  solicitudId: number;
  codigo: string;
  titulo: string;
  estado: string;
  aprobadoPor: string | null;
  fechaDecision: string | null;
  lineaBase: string | null;
  impactoPlazoReal: number | null;
  impactoCostoReal: number | null;
  modificaciones: Modificacion[];
  kpiAfectados: MedicionGatillada[];
}

export interface LineaBase {
  id: number;
  codigo: string;
  solicitudId: number | null;
  solicitud: string | null;
  creadaEn: string;
  creadaPor: string | null;
  fechaTermino: string;
  costoTotal: number;
}

export interface Comparacion {
  lineaBase: LineaBase;
  terminoBase: string;
  terminoActual: string | null;
  variacionTermino: number;
  costoBase: number;
  costoActual: number;
  actividades: {
    actividadId: number;
    codigoEdt: string;
    nombre: string;
    nivel: number;
    esHoja: boolean;
    inicioBase: string | null;
    terminoBase: string | null;
    duracionBase: number | null;
    costoBase: number | null;
    inicioActual: string | null;
    terminoActual: string | null;
    duracionActual: number;
    costoActual: number;
    variacionTermino: number | null;
    nueva: boolean;
    cambio: boolean;
  }[];
}

export const ESTADO_SOLICITUD: Record<EstadoSolicitud, { etiqueta: string; tono: Tono }> = {
  ABIERTO: { etiqueta: 'Abierta', tono: 'neutral' },
  EN_EVALUACION: { etiqueta: 'En evaluación', tono: 'accent' },
  APROBADO: { etiqueta: 'Aprobada', tono: 'ok' },
  RECHAZADO: { etiqueta: 'Rechazada', tono: 'danger' },
  EN_IMPLEMENTACION: { etiqueta: 'En implementación', tono: 'accent' },
  CERRADO: { etiqueta: 'Cerrada', tono: 'ok' },
};

export const TIPO_CAMBIO: Record<TipoCambio, string> = {
  ALCANCE: 'Alcance',
  TIEMPO: 'Tiempo',
  COSTO: 'Costo',
  RECURSO: 'Recursos',
  TECNOLOGIA: 'Tecnología',
  ORGANIZACION: 'Organización',
};

export const PRIORIDAD: Record<Prioridad, { etiqueta: string; tono: Tono }> = {
  BAJA: { etiqueta: 'Baja', tono: 'neutral' },
  MEDIA: { etiqueta: 'Media', tono: 'accent' },
  ALTA: { etiqueta: 'Alta', tono: 'warn' },
  CRITICA: { etiqueta: 'Crítica', tono: 'danger' },
};

export const NIVEL: Record<Nivel, string> = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta' };
export const NIVEL_IMPACTO: Record<NivelImpacto, string> = { BAJO: 'Bajo', MEDIO: 'Medio', ALTO: 'Alto' };

export const ENTIDAD: Record<EntidadModificada, string> = {
  ACTIVIDAD: 'Actividad',
  DEPENDENCIA: 'Dependencia',
  ASIGNACION_PROFESIONAL: 'Asignación de profesional',
  ASIGNACION_RECURSO: 'Asignación de recurso',
  RECURSO: 'Recurso',
  HITO: 'Hito',
  PROYECTO: 'Proyecto',
};

export function opciones<T extends string>(mapa: Record<T, string | { etiqueta: string }>): { label: string; value: T }[] {
  return (Object.keys(mapa) as T[]).map((value) => {
    const v = mapa[value];
    return { label: typeof v === 'string' ? v : v.etiqueta, value };
  });
}

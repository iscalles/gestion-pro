import { Semaforo } from '../../../shared/ui/semaforo/semaforo';

export type CategoriaKpi = 'PROYECTO' | 'CAMBIO';
export type AmbitoKpi = 'PROYECTO' | 'ETAPA' | 'ACTIVIDAD' | 'HITO' | 'CAMBIO';
export type SentidoKpi = 'MAYOR' | 'MENOR' | 'RANGO';
export type Periodicidad = 'DIARIA' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'AL_EVENTO';
export type FuenteKpi = 'AUTOMATICA' | 'MANUAL';
export type OrigenMedicion = 'RECALCULO' | 'PROGRAMADA' | 'MANUAL';

export interface Medicion {
  id: number;
  medidoEn: string;
  valor: number;
  semaforo: Semaforo;
  origen: OrigenMedicion;
  solicitudId: number | null;
  solicitud: string | null;
  registradoPor: string | null;
  observacion: string | null;
}

export interface Kpi {
  id: number;
  codigo: string;
  nombre: string;
  objetivo: string | null;
  categoria: CategoriaKpi;
  ambito: AmbitoKpi;
  ambitoRefId: number | null;
  ambitoNombre: string | null;
  formula: string | null;
  variables: string[];
  unidad: string;
  sentido: SentidoKpi;
  meta: number;
  verdeMin: number | null;
  verdeMax: number | null;
  ambarMin: number | null;
  ambarMax: number | null;
  periodicidad: Periodicidad;
  fuente: FuenteKpi;
  responsableId: number | null;
  responsable: string | null;
  activo: boolean;
  valor: number | null;
  semaforo: Semaforo | null;
  medidoEn: string | null;
  valorAnterior: number | null;
  sinDatos: boolean;
  hitoIds: number[];
  historial: Medicion[];
}

export interface KpiRequest {
  codigo: string;
  nombre: string;
  objetivo?: string | null;
  categoria: CategoriaKpi;
  ambito: AmbitoKpi;
  ambitoRefId?: number | null;
  formula?: string | null;
  unidad: string;
  sentido: SentidoKpi;
  meta: number;
  verdeMin?: number | null;
  verdeMax?: number | null;
  ambarMin?: number | null;
  ambarMax?: number | null;
  periodicidad: Periodicidad;
  fuente: FuenteKpi;
  responsableId?: number | null;
  activo?: boolean;
  hitoIds?: number[];
}

export interface Variable {
  codigo: string;
  descripcion: string;
  unidad: string;
  categoria: CategoriaKpi;
}

export interface PruebaFormula {
  valor: number | null;
  variables: { codigo: string; descripcion: string; unidad: string; valor: number | null }[];
  mensaje: string | null;
}

export interface MedicionGatillada {
  kpiId: number;
  kpi: string;
  nombre: string;
  unidad: string;
  valorAnterior: number | null;
  semaforoAnterior: Semaforo | null;
  valor: number;
  semaforo: Semaforo;
  medidoEn: string;
}

export const AMBITO_KPI: Record<AmbitoKpi, string> = {
  PROYECTO: 'Proyecto',
  ETAPA: 'Etapa',
  ACTIVIDAD: 'Actividad',
  HITO: 'Hito',
  CAMBIO: 'Solicitud de cambio',
};

export const PERIODICIDAD: Record<Periodicidad, string> = {
  DIARIA: 'Diaria',
  SEMANAL: 'Semanal',
  QUINCENAL: 'Quincenal',
  MENSUAL: 'Mensual',
  AL_EVENTO: 'Al ocurrir un cambio',
};

export const ORIGEN_MEDICION: Record<OrigenMedicion, string> = {
  RECALCULO: 'Recálculo',
  PROGRAMADA: 'Programada',
  MANUAL: 'Manual',
};

import { Kpi } from '../../kpi/models/kpi.model';
import { AccionCorrectiva, SolicitudResumen } from '../../cambios/models/cambio.model';
import { CargaProfesional } from '../../recursos/models/recurso.model';

export interface Alerta {
  id: number;
  tipo: 'SOBREASIGNACION' | 'KPI_FUERA_META' | 'ACTIVIDAD_ATRASADA' | 'HITO_ATRASADO' | 'CAMBIO_ATRASADO' | 'RIESGO_CRITICO' | 'DESVIACION_COSTO';
  severidad: 'ALTA' | 'MEDIA' | 'BAJA';
  mensaje: string;
  entidad: string;
  entidadId: number;
  creadaEn: string;
  resuelta: boolean;
  resueltaEn: string | null;
}

export const TIPO_ALERTA: Record<Alerta['tipo'], { etiqueta: string; icono: string }> = {
  SOBREASIGNACION: { etiqueta: 'Sobreasignación', icono: 'pi pi-users' },
  KPI_FUERA_META: { etiqueta: 'KPI fuera de meta', icono: 'pi pi-gauge' },
  ACTIVIDAD_ATRASADA: { etiqueta: 'Actividad atrasada', icono: 'pi pi-clock' },
  HITO_ATRASADO: { etiqueta: 'Hito atrasado', icono: 'pi pi-flag' },
  CAMBIO_ATRASADO: { etiqueta: 'Cambio atrasado', icono: 'pi pi-arrow-right-arrow-left' },
  RIESGO_CRITICO: { etiqueta: 'Riesgo crítico', icono: 'pi pi-exclamation-triangle' },
  DESVIACION_COSTO: { etiqueta: 'Desviación de costo', icono: 'pi pi-dollar' },
};

export interface Opcion {
  id: number;
  nombre: string;
}

export interface TableroProyecto {
  proyecto: {
    id: number;
    codigo: string;
    nombre: string;
    estado: string;
    responsable: string;
    fechaInicio: string;
    fechaTermino: string;
    terminoPrevisto: string | null;
    presupuesto: number;
  };
  filtros: { etapaId: number | null; desde: string | null; hasta: string | null; responsableId: number | null };
  resumen: {
    avanceReal: number;
    avancePlanificado: number;
    costoPlan: number;
    costoReal: number;
    valorGanado: number;
    valorPlanificado: number;
    spi: number | null;
    cpi: number | null;
    presupuesto: number;
    actividades: number;
    terminadas: number;
    enCurso: number;
    atrasadas: number;
    hitos: number;
    hitosCumplidos: number;
    hitosAtrasados: number;
    hitosEnRiesgo: number;
    alertasAbiertas: number;
    alertasAltas: number;
    sobreasignaciones: number;
    kpiVerdes: number;
    kpiAmbar: number;
    kpiRojos: number;
  };
  etapas: {
    id: number;
    codigoEdt: string;
    nombre: string;
    inicio: string | null;
    termino: string | null;
    avance: number;
    avancePlanificado: number;
    costoPlan: number;
    costoReal: number;
    atrasadas: number;
  }[];
  curva: { semana: string; avancePlanificado: number; costoPlanificado: number; avanceReal: number | null }[];
  kpis: Kpi[];
  hitos: {
    id: number;
    codigo: string;
    descripcion: string;
    responsable: string;
    fechaComprometida: string;
    fechaPrevista: string | null;
    fechaReal: string | null;
    estado: string;
    enRiesgo: boolean;
    criteriosCumplidos: number;
    criteriosTotal: number;
  }[];
  actividades: {
    id: number;
    codigoEdt: string;
    nombre: string;
    etapa: string | null;
    responsable: string | null;
    inicio: string | null;
    termino: string | null;
    avance: number;
    estado: 'TERMINADA' | 'ATRASADA' | 'EN_CURSO' | 'PENDIENTE';
    diasAtraso: number;
    costoPlan: number;
    costoReal: number;
  }[];
  carga: CargaProfesional[];
  costosPorTipo: { tipo: string; costoPlan: number; costoReal: number }[];
  alertas: Alerta[];
  opcionesEtapa: Opcion[];
  opcionesResponsable: Opcion[];
}

export interface Conteo {
  clave: string;
  nombre: string;
  cantidad: number;
}

export interface TableroCambio {
  proyectoId: number;
  proyecto: string;
  filtros: { desde: string | null; hasta: string | null; tipo: string | null; prioridad: string | null };
  resumen: {
    total: number;
    enCurso: number;
    aprobadas: number;
    rechazadas: number;
    cerradas: number;
    atrasadas: number;
    riesgosCriticos: number;
    tasaAprobacion: number | null;
    diasEvaluacionPromedio: number | null;
    diasImplementacionPromedio: number | null;
    costoEstimado: number;
    costoReal: number;
    diasDesviacion: number;
    impactoCostoPlan: number;
    accionesAbiertas: number;
    accionesCerradas: number;
    accionesVencidas: number;
    efectividadPromedio: number | null;
    adopcionPromedio: number | null;
  };
  porEstado: Conteo[];
  porTipo: Conteo[];
  porPrioridad: Conteo[];
  porEtapa: Conteo[];
  matrizRiesgo: { probabilidad: string; impacto: string; cantidad: number; solicitudes: string[] }[];
  tiempos: { codigo: string; diasEvaluacion: number | null; diasImplementacion: number | null }[];
  costos: { codigo: string; estimado: number; real: number | null }[];
  cumplimientoEtapas: { numero: number; nombre: string; aTiempo: number; tarde: number; vencidas: number; enCurso: number }[];
  solicitudes: SolicitudResumen[];
  acciones: AccionCorrectiva[];
  kpis: Kpi[];
  alertas: Alerta[];
}

export type DiaSemana =
  'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface DiaNoLaborable {
  id: number;
  fecha: string; // ISO yyyy-mm-dd
  motivo: string;
}

/** CalendarioDto del backend. */
export interface Calendario {
  id: number;
  nombre: string;
  diasLaborables: DiaSemana[];
  horasDia: number;
  horasSemana: number;
  diasNoLaborables: DiaNoLaborable[];
}

export interface CalendarioRequest {
  nombre: string;
  diasLaborables: DiaSemana[];
  horasDia: number;
}

export const DIAS_SEMANA: { valor: DiaSemana; corto: string; largo: string }[] = [
  { valor: 'MONDAY', corto: 'Lun', largo: 'Lunes' },
  { valor: 'TUESDAY', corto: 'Mar', largo: 'Martes' },
  { valor: 'WEDNESDAY', corto: 'Mié', largo: 'Miércoles' },
  { valor: 'THURSDAY', corto: 'Jue', largo: 'Jueves' },
  { valor: 'FRIDAY', corto: 'Vie', largo: 'Viernes' },
  { valor: 'SATURDAY', corto: 'Sáb', largo: 'Sábado' },
  { valor: 'SUNDAY', corto: 'Dom', largo: 'Domingo' },
];

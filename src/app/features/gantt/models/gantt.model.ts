/** Escala temporal de la Carta Gantt. */
export type Zoom = 'dia' | 'semana' | 'mes';

export const ZOOM: Record<Zoom, { etiqueta: string; pxDia: number; margen: number }> = {
  dia: { etiqueta: 'Días', pxDia: 28, margen: 3 },
  semana: { etiqueta: 'Semanas', pxDia: 10, margen: 7 },
  mes: { etiqueta: 'Meses', pxDia: 3.5, margen: 15 },
};

// Fechas como número de día (días desde 1970-01-01, en UTC) para evitar corrimientos por zona horaria.
const MS_DIA = 86_400_000;

export function diaDe(iso: string): number {
  const [a, m, d] = iso.split('-').map(Number);
  return Date.UTC(a, m - 1, d) / MS_DIA;
}

export function hoyDia(): number {
  const h = new Date();
  return Date.UTC(h.getFullYear(), h.getMonth(), h.getDate()) / MS_DIA;
}

export function fechaDe(dia: number): Date {
  return new Date(dia * MS_DIA);
}

/** 0 = domingo … 6 = sábado. El 01-01-1970 fue jueves. */
export function diaSemana(dia: number): number {
  return (((dia + 4) % 7) + 7) % 7;
}

export function lunesDe(dia: number): number {
  return dia - ((diaSemana(dia) + 6) % 7);
}

export function inicioMes(dia: number): number {
  const f = fechaDe(dia);
  return Date.UTC(f.getUTCFullYear(), f.getUTCMonth(), 1) / MS_DIA;
}

export function mesSiguiente(dia: number): number {
  const f = fechaDe(dia);
  return Date.UTC(f.getUTCFullYear(), f.getUTCMonth() + 1, 1) / MS_DIA;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
const MESES_LARGOS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export function nombreMes(dia: number, largo = false): string {
  const m = fechaDe(dia).getUTCMonth();
  return largo ? MESES_LARGOS[m] : MESES[m];
}

/** dd-MM-yyyy */
export function textoFecha(dia: number | null): string {
  if (dia == null) return '—';
  const f = fechaDe(dia);
  return `${String(f.getUTCDate()).padStart(2, '0')}-${String(f.getUTCMonth() + 1).padStart(2, '0')}-${f.getUTCFullYear()}`;
}

/** dd-MM */
export function textoCorto(dia: number | null): string {
  return dia == null ? '—' : textoFecha(dia).slice(0, 5);
}

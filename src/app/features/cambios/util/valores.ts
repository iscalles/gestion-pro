import { fmtFecha } from '../../../shared/util/formato';

/** Valor de una modificación (texto plano del backend) para mostrar: fechas ISO en formato local. */
export function fmtValorCambio(v: string | null | undefined): string {
  if (v == null || v === '') return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return fmtFecha(v);
  if (/^-?\d+(\.\d+)?$/.test(v)) return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(Number(v));
  return v;
}

/** Nivel de riesgo de la matriz probabilidad × impacto (3 × 3). */
export function nivelRiesgo(p: string | null, i: string | null): { etiqueta: string; tono: 'ok' | 'warn' | 'danger' | 'neutral' } {
  if (!p || !i) return { etiqueta: 'Sin evaluar', tono: 'neutral' };
  const v = ({ BAJA: 1, MEDIA: 2, ALTA: 3 } as Record<string, number>)[p] * ({ BAJO: 1, MEDIO: 2, ALTO: 3 } as Record<string, number>)[i];
  if (v >= 6) return { etiqueta: 'Riesgo alto', tono: 'danger' };
  if (v >= 3) return { etiqueta: 'Riesgo medio', tono: 'warn' };
  return { etiqueta: 'Riesgo bajo', tono: 'ok' };
}

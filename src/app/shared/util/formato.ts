const numero = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });
const entero = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
const compacto = new Intl.NumberFormat('es-CL', { notation: 'compact', maximumFractionDigits: 1 });
const pesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

export function fmtNumero(v: number | null | undefined): string {
  return v == null ? '—' : numero.format(v);
}

export function fmtEntero(v: number | null | undefined): string {
  return v == null ? '—' : entero.format(v);
}

export function fmtPesos(v: number | null | undefined): string {
  if (v == null) return '—';
  return v < 0 ? '-' + pesos.format(-v) : pesos.format(v);
}

/** Pesos abreviados para ejes: $12,5 M */
export function fmtPesosEje(v: number): string {
  return '$' + compacto.format(v);
}

export function fmtPorcentaje(v: number | null | undefined): string {
  return v == null ? '—' : `${numero.format(v)} %`;
}

/** Valor de un KPI con su unidad. */
export function fmtValorKpi(v: number | null | undefined, unidad: string | null | undefined): string {
  if (v == null) return 'Sin datos';
  const u = (unidad ?? '').trim();
  if (u === '%') return `${numero.format(v)} %`;
  if (u === '$' || u.toUpperCase() === 'CLP') return pesos.format(v);
  return u ? `${numero.format(v)} ${u}` : numero.format(v);
}

/** dd-MM-yyyy desde ISO (fecha o fecha-hora). */
export function fmtFecha(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}-${m}-${a}`;
}

export function fmtFechaCorta(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-');
  return `${d}-${m}`;
}

export function hoyIso(): string {
  const f = new Date();
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
}

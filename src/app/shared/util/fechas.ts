/** Fecha ISO (yyyy-mm-dd) a Date local, sin corrimiento por zona horaria. */
export function isoADate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

/** Date local a fecha ISO (yyyy-mm-dd). */
export function dateAIso(fecha: Date | null | undefined): string | null {
  if (!fecha) return null;
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${m}-${d}`;
}

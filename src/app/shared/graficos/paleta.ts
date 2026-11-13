/**
 * Paleta de datos validada con el verificador de daltonismo (scripts/validate_palette.js del skill de
 * visualización): ambas series pasan banda de luminosidad, croma mínimo, separación CVD (ΔE 13,3) y contraste
 * 3:1 sobre blanco. Orden fijo: la serie 1 siempre es "planificado/estimado" y la 2 "real".
 * Los colores de estado (ok/warn/danger) quedan reservados para semáforos y nunca se usan como serie.
 */
export const SERIE = {
  plan: '#009490',
  real: '#8059C9',
} as const;

/** Rampa secuencial de un solo tono (turquesa de la marca) para magnitudes: claro → oscuro. */
export const RAMPA = ['#eef6f6', '#cfe6e7', '#a9c8c9', '#7fadaf', '#609496', '#2c6163'];

export const ESTADO = {
  ok: '#1f6b3a',
  warn: '#8a5300',
  danger: '#a3231b',
  neutral: '#a9c8c9',
} as const;

/** Paso de la rampa para un valor entre 0 y 1. */
export function paso(fraccion: number): string {
  const i = Math.max(0, Math.min(RAMPA.length - 1, Math.round(fraccion * (RAMPA.length - 1))));
  return RAMPA[i];
}

/** Texto legible sobre un paso de la rampa. */
export function tintaSobre(color: string): string {
  return RAMPA.indexOf(color) >= 4 ? '#ffffff' : '#0c3133';
}

/**
 * Escala "agradable" para un eje: máximo redondeado y marcas. Con `enteros` (conteos, días) las marcas
 * son siempre números enteros.
 */
export function escala(maximo: number, marcas = 4, enteros = false): { max: number; ticks: number[] } {
  if (!(maximo > 0)) return { max: 1, ticks: [0, 1] };
  const bruto = enteros ? Math.max(1, maximo / marcas) : maximo / marcas;
  const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
  const pasos = [1, 2, 2.5, 5, 10].map((m) => m * mag).filter((p) => !enteros || Number.isInteger(p));
  const paso = pasos.find((p) => p >= bruto) ?? 10 * mag;
  const max = Math.ceil(maximo / paso) * paso;
  const ticks: number[] = [];
  for (let v = 0; v <= max + paso / 2; v += paso) ticks.push(Math.round(v * 1e6) / 1e6);
  return { max, ticks };
}

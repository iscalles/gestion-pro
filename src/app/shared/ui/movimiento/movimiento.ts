/**
 * Utilidades de movimiento compartidas. Todo es visual: no lee ni modifica datos de la aplicación.
 */

/** true si la persona pidió menos movimiento: las animaciones muestran directamente su estado final. */
export function prefiereMenosMovimiento(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Curva ease-out fuerte, la misma de --gp-ease-out, para animaciones hechas con requestAnimationFrame. */
export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

/**
 * Duraciones en milisegundos, iguales a los tokens CSS (--gp-dur-*), para la Web Animations API.
 * Con movimiento reducido todo dura 120 ms y solo cambia la opacidad.
 */
export const DURACION = {
  rapida: 160,
  base: 200,
  salida: 150,
  expresiva: 320,
  dibujo: 500,
  escalonado: 40,
} as const;

export const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

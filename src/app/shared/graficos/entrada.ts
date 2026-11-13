import { DestroyRef, ElementRef, Signal, afterNextRender, inject, signal } from '@angular/core';
import { DURACION, prefiereMenosMovimiento } from '../ui/movimiento/movimiento';

/**
 * Utilidades puramente visuales de los gráficos: no leen ni modifican datos de la aplicación.
 */

/**
 * Ancho real del host en px, medido con ResizeObserver. El SVG se dibuja 1:1 con su contenedor, así el
 * texto de los ejes conserva su tamaño en paneles anchos y angostos. Se llama en un contexto de inyección.
 */
export function anchoDelHost(inicial = 640): Signal<number> {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const destroy = inject(DestroyRef);
  const ancho = signal(inicial);
  afterNextRender(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observador = new ResizeObserver((entradas) => {
      const w = Math.floor(entradas[0]?.contentRect.width ?? 0);
      // Oculto (pestaña inactiva): se conserva el último ancho conocido.
      if (w > 0 && w !== ancho()) ancho.set(w);
    });
    observador.observe(host);
    destroy.onDestroy(() => observador.disconnect());
  });
  return ancho.asReadonly();
}

/**
 * Animación de primera carga de una instancia: `activa` es true mientras dura el dibujo inicial y después
 * queda en false para siempre. Los recálculos y filtros solo cambian datos de elementos que ya existen, así
 * que no la repiten. Con movimiento reducido nunca se activa: se muestra directo el estado final.
 * Se crea en un inicializador de campo (contexto de inyección) y se inicia en ngOnInit, antes del primer render.
 */
export class EntradaGrafico {
  private readonly estado = signal(false);
  readonly activa = this.estado.asReadonly();
  private temporizador: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.temporizador));
  }

  /** `margen`: tiempo extra para el escalonado (las clases se quitan cuando todo terminó). */
  iniciar(animar: boolean, margen = 600): void {
    if (!animar || prefiereMenosMovimiento()) return;
    this.estado.set(true);
    this.temporizador = setTimeout(() => this.estado.set(false), DURACION.dibujo + margen);
  }
}

/** Retraso de cada elemento de un escalonado: 40 ms entre vecinos, con el último a lo más en `tope` ms. */
export function escalonado(i: number, total: number, tope = 480): number {
  if (total <= 1) return 0;
  return Math.round(i * Math.min(DURACION.escalonado, tope / (total - 1)));
}

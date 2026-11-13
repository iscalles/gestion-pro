import { Directive, effect, input, signal } from '@angular/core';
import { DURACION } from './movimiento';

/**
 * Las barras de avance (.gp-avance) se dibujan de izquierda a derecha solo la primera vez que aparecen
 * con datos. Cuando [gpDibujoUnico] pasa a true, espera a que termine ese dibujo y agrega .gp-quieto:
 * desde ahí, filtros, cambio de proyecto, desplegar etapas o recálculos ya no repiten la animación.
 *
 * Solo pone una clase en el contenedor; no lee ni modifica datos.
 */
@Directive({
  selector: '[gpDibujoUnico]',
  host: { '[class.gp-quieto]': 'quieto()' },
})
export class DibujoUnico {
  /** true cuando el contenido ya está en pantalla (por ejemplo, cargó el plan). */
  readonly gpDibujoUnico = input(false);
  protected readonly quieto = signal(false);

  constructor() {
    effect((alLimpiar) => {
      if (!this.gpDibujoUnico() || this.quieto()) return;
      const t = setTimeout(() => this.quieto.set(true), DURACION.dibujo + 200);
      alLimpiar(() => clearTimeout(t));
    });
  }
}

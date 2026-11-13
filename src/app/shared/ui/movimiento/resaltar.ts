import { DestroyRef, Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/**
 * Resaltado de un valor que cambió después de un recálculo («Guardar y recalcular», aprobar un cambio):
 * un lavado turquesa aparece detrás del valor y se apaga solo (clase .gp-resaltado, en _movimiento.scss).
 *
 * Solo observa el texto renderizado del elemento; no conoce servicios ni datos. Ignora el primer render
 * y los conteos de [gpContar]. Va en elementos que persisten entre recálculos (no dentro de un @if que
 * se vuelva a crear).
 */
@Directive({ selector: '[gpResaltar]' })
export class Resaltar {
  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroy = inject(DestroyRef);

    el.addEventListener('animationend', (e) => {
      if (e.animationName === 'gp-resaltar') el.classList.remove('gp-resaltado');
    });

    afterNextRender(() => {
      let previo = el.textContent;
      const observador = new MutationObserver(() => {
        if (el.closest('[data-gp-contando]')) return;
        const actual = el.textContent;
        if (actual === previo) return;
        previo = actual;
        el.classList.remove('gp-resaltado');
        void el.offsetWidth; // reinicia la animación si ya estaba resaltado
        el.classList.add('gp-resaltado');
      });
      observador.observe(el, { characterData: true, childList: true, subtree: true });
      destroy.onDestroy(() => observador.disconnect());
    });
  }
}

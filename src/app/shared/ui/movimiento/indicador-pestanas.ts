/**
 * Indicador de pestañas que se desliza con transform en lugar de left/width.
 *
 * PrimeNG calcula la posición de la barra activa (.p-tablist-active-bar) y la escribe en style.left y
 * style.width. Esta función la traduce a translateX + scaleX sobre una barra de 100 px (ver
 * .gp-indicador en _movimiento.scss), así el movimiento no recalcula el layout. Es puramente visual.
 *
 * Observa `raiz` (el body) para encontrar las barras de todas las pantallas y diálogos. Devuelve una
 * función para dejar de observar.
 */
export function animarIndicadoresDePestanas(raiz: HTMLElement): () => void {
  const vigiladas = new Map<HTMLElement, MutationObserver>();

  const aplicar = (barra: HTMLElement) => {
    const left = parseFloat(barra.style.left);
    const width = parseFloat(barra.style.width);
    if (Number.isNaN(left) || Number.isNaN(width)) return;
    const transform = `translateX(${left}px) scaleX(${width / 100})`;
    if (barra.style.transform === transform) return;

    if (!barra.classList.contains('gp-indicador')) {
      // Primera posición: sin transición, para que no se deslice desde el borde al cargar.
      barra.style.transition = 'none';
      barra.classList.add('gp-indicador');
      barra.style.transform = transform;
      requestAnimationFrame(() => requestAnimationFrame(() => (barra.style.transition = '')));
      return;
    }
    barra.style.transform = transform;
  };

  const vigilar = (barra: HTMLElement) => {
    if (vigiladas.has(barra)) return;
    const obs = new MutationObserver(() => aplicar(barra));
    obs.observe(barra, { attributes: true, attributeFilter: ['style'] });
    vigiladas.set(barra, obs);
    aplicar(barra);
  };

  const buscar = (nodo: Node) => {
    if (!(nodo instanceof HTMLElement)) return;
    if (nodo.classList.contains('p-tablist-active-bar')) vigilar(nodo);
    else if (nodo.firstElementChild) nodo.querySelectorAll<HTMLElement>('.p-tablist-active-bar').forEach(vigilar);
  };

  const general = new MutationObserver((cambios) => {
    for (const c of cambios) {
      c.addedNodes.forEach(buscar);
      c.removedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement)) return;
        for (const [barra, obs] of vigiladas) {
          if (n === barra || n.contains(barra)) {
            obs.disconnect();
            vigiladas.delete(barra);
          }
        }
      });
    }
  });
  general.observe(raiz, { childList: true, subtree: true });
  buscar(raiz);

  return () => {
    general.disconnect();
    vigiladas.forEach((obs) => obs.disconnect());
    vigiladas.clear();
  };
}

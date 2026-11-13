/**
 * Separa la unidad final de un valor ya formateado («45,15 %» → «45,15» y « %», «3 días» → «3» y « días»)
 * para mostrarla más pequeña junto al valor (clase global .gp-unidad). Es solo presentación: no cambia el
 * formato, el texto completo que se ve y se lee sigue siendo el mismo.
 */
export function partirUnidad(texto: string): { valor: string; unidad: string } {
  const m = /^(.*\d)(\s[^\d\s][^\d]*)$/.exec(texto);
  return m ? { valor: m[1], unidad: m[2] } : { valor: texto, unidad: '' };
}

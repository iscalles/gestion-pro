import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';
import { DURACION, easeOut, prefiereMenosMovimiento } from './movimiento';

/** Números con formato chileno: 1.234.567 · 45,15 · 13. */
const NUMERO = /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;

interface Tramo {
  nodo: Text;
  final: string;
  partes: string[]; // texto alrededor de cada número
  numeros: { valor: number; decimales: number; miles: boolean }[];
  escrito: string;
}

/**
 * Conteo de una cifra al aparecer: los números del texto suben desde cero en 500 ms y terminan
 * exactamente en el texto que ya formateó la plantilla (no cambia pipes ni formateadores: solo
 * anima el texto renderizado y al final lo deja como estaba).
 *
 * Se usa solo en cifras clave de los tableros, nunca en fechas. Corre una vez por visita a la
 * pantalla; `[gpContar]="false"` lo desactiva. Si Angular actualiza el texto durante el conteo,
 * el conteo se detiene y manda el valor nuevo.
 */
@Directive({ selector: '[gpContar]' })
export class Contar {
  readonly gpContar = input<boolean | ''>(true);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private cuadro = 0;

  constructor() {
    afterNextRender(() => {
      if (this.gpContar() === false || prefiereMenosMovimiento()) return;
      this.animar();
    });
    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(this.cuadro));
  }

  private animar(): void {
    const tramos = this.tramos();
    if (tramos.length === 0) return;
    this.el.setAttribute('data-gp-contando', '');
    const inicio = performance.now();

    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / DURACION.dibujo);
      const k = easeOut(t);
      for (const tr of tramos) {
        // Angular cambió el texto mientras contábamos: manda el valor nuevo.
        if (tr.nodo.nodeValue !== tr.escrito) {
          this.terminar(tramos, false);
          return;
        }
        const texto = t >= 1 ? tr.final : componer(tr, k);
        tr.nodo.nodeValue = texto;
        tr.escrito = texto;
      }
      if (t < 1) {
        this.cuadro = requestAnimationFrame(paso);
      } else {
        this.terminar(tramos, true);
      }
    };

    for (const tr of tramos) {
      const texto = componer(tr, 0);
      tr.nodo.nodeValue = texto;
      tr.escrito = texto;
    }
    this.cuadro = requestAnimationFrame(paso);
  }

  private terminar(tramos: Tramo[], restaurar: boolean): void {
    if (restaurar) {
      for (const tr of tramos) {
        if (tr.nodo.nodeValue === tr.escrito) tr.nodo.nodeValue = tr.final;
      }
    }
    this.el.removeAttribute('data-gp-contando');
  }

  private tramos(): Tramo[] {
    const lista: Tramo[] = [];
    const caminante = document.createTreeWalker(this.el, NodeFilter.SHOW_TEXT);
    for (let n = caminante.nextNode(); n; n = caminante.nextNode()) {
      const nodo = n as Text;
      const final = nodo.nodeValue ?? '';
      const encontrados = [...final.matchAll(NUMERO)];
      if (encontrados.length === 0) continue;
      const partes: string[] = [];
      const numeros: Tramo['numeros'] = [];
      let desde = 0;
      for (const m of encontrados) {
        partes.push(final.slice(desde, m.index));
        const bruto = m[0];
        const [entero, dec = ''] = bruto.split(',');
        numeros.push({
          valor: Number(entero.replace(/\./g, '') + (dec ? '.' + dec : '')),
          decimales: dec.length,
          miles: entero.includes('.'),
        });
        desde = (m.index ?? 0) + bruto.length;
      }
      partes.push(final.slice(desde));
      lista.push({ nodo, final, partes, numeros, escrito: final });
    }
    return lista;
  }
}

function componer(tr: Tramo, k: number): string {
  let texto = tr.partes[0];
  tr.numeros.forEach((n, i) => {
    texto += formatear(n.valor * k, n.decimales, n.miles) + tr.partes[i + 1];
  });
  return texto;
}

function formatear(valor: number, decimales: number, miles: boolean): string {
  const [entero, dec] = valor.toFixed(decimales).split('.');
  const conMiles = miles ? entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : entero;
  return dec ? `${conMiles},${dec}` : conMiles;
}

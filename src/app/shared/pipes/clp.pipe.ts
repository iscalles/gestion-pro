import { Pipe, PipeTransform } from '@angular/core';

const formato = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

/** Formatea montos en pesos chilenos: 48500000 → $48.500.000 */
@Pipe({ name: 'clp' })
export class ClpPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    if (valor == null) return '—';
    // es-CL escribe "$-1.000"; se prefiere el signo delante del símbolo.
    return valor < 0 ? '-' + formato.format(-valor) : formato.format(valor);
  }
}

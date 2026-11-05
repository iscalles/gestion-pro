import { Pipe, PipeTransform } from '@angular/core';

const formato = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

/** Formatea montos en pesos chilenos: 48500000 → $48.500.000 */
@Pipe({ name: 'clp' })
export class ClpPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    return valor == null ? '—' : formato.format(valor);
  }
}

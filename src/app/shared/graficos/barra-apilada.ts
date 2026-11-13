import { Component, computed, input } from '@angular/core';

export interface Segmento {
  nombre: string;
  color: string;
  valor: number;
}

/** Barra horizontal apilada en HTML (2 px de separación entre segmentos), con el total al final. */
@Component({
  selector: 'gp-barra-apilada',
  template: `
    <div class="fila">
      <span class="etq" [title]="etiqueta()">{{ etiqueta() }}</span>
      <div class="pista" role="img" [attr.aria-label]="descripcion()">
        @for (s of visibles(); track s.nombre) {
          <span class="seg" [style.flex-grow]="s.valor" [style.background]="s.color" [title]="s.nombre + ': ' + s.valor"></span>
        }
        <span class="resto" [style.flex-grow]="resto()"></span>
      </div>
      <span class="total">{{ total() }}</span>
    </div>
  `,
  styles: `
    .fila { display: grid; grid-template-columns: minmax(90px, 180px) 1fr 32px; align-items: center; gap: 8px; }
    .etq { font-size: var(--gp-text-sm); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pista { display: flex; gap: 2px; height: 16px; }
    .seg { min-width: 3px; border-radius: 2px; }
    .seg:last-of-type { border-radius: 2px 4px 4px 2px; }
    .resto { min-width: 0; }
    .total { text-align: right; font-size: var(--gp-text-sm); font-variant-numeric: tabular-nums; color: var(--gp-text-muted); }
  `,
})
export class BarraApilada {
  readonly etiqueta = input.required<string>();
  readonly segmentos = input.required<Segmento[]>();
  /** Total de referencia para la escala común entre filas. */
  readonly escala = input<number | null>(null);

  protected readonly visibles = computed(() => this.segmentos().filter((s) => s.valor > 0));
  protected readonly total = computed(() => this.segmentos().reduce((a, s) => a + s.valor, 0));
  protected readonly resto = computed(() => Math.max(0, (this.escala() ?? this.total()) - this.total()));
  protected readonly descripcion = computed(
    () => `${this.etiqueta()}: ` + this.segmentos().map((s) => `${s.nombre} ${s.valor}`).join(', '),
  );
}

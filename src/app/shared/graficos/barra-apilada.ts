import { Component, OnInit, computed, input } from '@angular/core';
import { EntradaGrafico } from './entrada';

export interface Segmento {
  nombre: string;
  color: string;
  valor: number;
}

/**
 * Barra horizontal apilada en HTML (2 px de separación entre segmentos, extremo redondeado), con la cantidad
 * de cada segmento escrita dentro (no depende solo del color) y el total al final.
 * En la primera carga la barra se despliega de izquierda a derecha; `indice` la escalona entre filas
 * y `[animar]="false"` lo omite.
 */
@Component({
  selector: 'gp-barra-apilada',
  template: `
    <div class="fila">
      <span class="etq" [title]="etiqueta()">{{ etiqueta() }}</span>
      <div
        class="pista"
        role="img"
        [attr.aria-label]="descripcion()"
        [class.gp-anim-desplegar-x]="entrada.activa()"
        [style.animation-delay.ms]="retraso()"
      >
        @for (s of visibles(); track s.nombre) {
          <span class="seg" [style.flex-grow]="s.valor" [style.background]="s.color" [style.color]="tinta(s.color)" [title]="s.nombre + ': ' + s.valor">
            <span class="n" aria-hidden="true">{{ s.valor }}</span>
          </span>
        }
        <span class="resto" [style.flex-grow]="resto()"></span>
      </div>
      <span class="total">{{ total() }}</span>
    </div>
  `,
  styles: `
    :host { display: block; }
    .fila { display: grid; grid-template-columns: minmax(96px, 184px) minmax(0, 1fr) 2rem; align-items: center; gap: var(--gp-space-3); }
    .etq { font-size: var(--gp-text-sm); color: var(--gp-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pista { display: flex; gap: 2px; height: 18px; min-width: 0; }
    .seg {
      flex-basis: 0; min-width: 4px; container-type: inline-size;
      display: flex; align-items: center; justify-content: center; overflow: hidden;
      border-radius: 2px;
    }
    .seg:first-child { border-radius: 4px 2px 2px 4px; }
    .seg:nth-last-child(2) { border-top-right-radius: 4px; border-bottom-right-radius: 4px; }
    .n { font-size: 11px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
    @container (max-width: 15px) { .n { visibility: hidden; } }
    .resto { flex-basis: 0; min-width: 0; }
    .total { text-align: right; font-size: var(--gp-text-sm); font-weight: 700; font-variant-numeric: tabular-nums; color: var(--gp-text); }
  `,
})
export class BarraApilada implements OnInit {
  readonly etiqueta = input.required<string>();
  readonly segmentos = input.required<Segmento[]>();
  /** Total de referencia para la escala común entre filas. */
  readonly escala = input<number | null>(null);
  /** Despliega la barra en X la primera vez que se dibuja esta instancia. */
  readonly animar = input(true);
  /** Posición de la fila en su lista: escalona el despliegue 40 ms entre filas. */
  readonly indice = input(0);

  protected readonly entrada = new EntradaGrafico();

  ngOnInit(): void {
    this.entrada.iniciar(this.animar(), 900);
  }

  protected readonly visibles = computed(() => this.segmentos().filter((s) => s.valor > 0));
  protected readonly total = computed(() => this.segmentos().reduce((a, s) => a + s.valor, 0));
  protected readonly resto = computed(() => Math.max(0, (this.escala() ?? this.total()) - this.total()));
  protected readonly descripcion = computed(
    () => `${this.etiqueta()}: ` + this.segmentos().map((s) => `${s.nombre} ${s.valor}`).join(', '),
  );
  protected readonly retraso = computed(() => Math.min(this.indice(), 10) * 40);

  /** Texto legible sobre el color del segmento: blanco sobre tonos oscuros, tinta sobre claros. */
  protected tinta(color: string): string {
    const m = /^#([0-9a-f]{6})$/i.exec(color.trim());
    if (!m) return 'var(--gp-text)';
    const n = parseInt(m[1], 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.22 ? 'var(--gp-surface)' : 'var(--gp-text)';
  }
}

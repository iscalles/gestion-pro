import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { StatusBadge, Tono } from '../../../../shared/ui/status-badge/status-badge';
import { Alerta, TIPO_ALERTA } from '../../models/tablero.model';

/**
 * Alertas automáticas abiertas (sobreasignación, KPI fuera de meta, atrasos, riesgo, costos).
 * Lista densa separada por líneas finas: la severidad va primero, en una columna fija, con ícono y texto.
 */
@Component({
  selector: 'gp-lista-alertas',
  imports: [DatePipe, StatusBadge],
  template: `
    @if (alertas().length === 0) {
      <p class="ok"><i class="pi pi-check-circle" aria-hidden="true"></i> Sin alertas abiertas.</p>
    } @else {
      <ul class="alertas">
        @for (a of alertas(); track a.id) {
          <li>
            <gp-status-badge class="sev" [tono]="tono(a)">{{ a.severidad === 'ALTA' ? 'Alta' : a.severidad === 'MEDIA' ? 'Media' : 'Baja' }}</gp-status-badge>
            <div class="texto">
              <span class="mensaje">{{ a.mensaje }}</span>
              <span class="detalle">
                <i [class]="tipo[a.tipo].icono" aria-hidden="true"></i>
                <span>{{ tipo[a.tipo].etiqueta }} · desde <span class="fecha">{{ a.creadaEn | date: 'dd-MM-yyyy' }}</span></span>
              </span>
            </div>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    :host { display: block; }
    .alertas {
      list-style: none; margin: 0; padding: 0; max-height: 420px; overflow-y: auto; overscroll-behavior: contain;
      border-top: 1px solid var(--gp-line);
    }
    li {
      display: grid; grid-template-columns: 4.5rem minmax(0, 1fr); align-items: start; column-gap: var(--gp-space-3);
      padding: var(--gp-space-2) 2px; border-bottom: 1px solid var(--gp-line);
    }
    li:last-child { border-bottom: 0; }
    .sev { padding-top: 1px; }
    .texto { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .mensaje { font-size: var(--gp-text-sm); line-height: 1.4; color: var(--gp-text); overflow-wrap: anywhere; }
    .detalle { display: flex; align-items: baseline; gap: 6px; font-size: var(--gp-text-xs); color: var(--gp-text-muted); }
    .detalle i { font-size: 0.75rem; color: var(--gp-text-subtle); }
    .fecha { font-variant-numeric: tabular-nums; white-space: nowrap; }
    .ok { margin: 0; color: var(--gp-ok); display: flex; align-items: center; gap: 8px; font-size: var(--gp-text-sm); }
  `,
})
export class ListaAlertas {
  readonly alertas = input.required<Alerta[]>();
  protected readonly tipo = TIPO_ALERTA;

  protected tono(a: Alerta): Tono {
    return a.severidad === 'ALTA' ? 'danger' : a.severidad === 'MEDIA' ? 'warn' : 'neutral';
  }
}

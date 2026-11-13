import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { StatusBadge, Tono } from '../../../../shared/ui/status-badge/status-badge';
import { Alerta, TIPO_ALERTA } from '../../models/tablero.model';

/** Alertas automáticas abiertas (sobreasignación, KPI fuera de meta, atrasos, riesgo, costos). */
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
            <i [class]="tipo[a.tipo].icono" aria-hidden="true"></i>
            <div class="texto">
              <span>{{ a.mensaje }}</span>
              <span class="gp-tenue">{{ tipo[a.tipo].etiqueta }} · desde {{ a.creadaEn | date: 'dd-MM-yyyy' }}</span>
            </div>
            <gp-status-badge [tono]="tono(a)">{{ a.severidad === 'ALTA' ? 'Alta' : a.severidad === 'MEDIA' ? 'Media' : 'Baja' }}</gp-status-badge>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .alertas { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; max-height: 420px; overflow-y: auto; }
    li { display: flex; align-items: center; gap: var(--gp-space-3); padding: 8px 10px; border: 1px solid var(--gp-line); border-radius: var(--gp-radius-sm); }
    li > i { color: var(--gp-text-muted); }
    .texto { display: flex; flex-direction: column; flex: 1; min-width: 0; font-size: var(--gp-text-sm); }
    .ok { margin: 0; color: var(--gp-ok); display: flex; align-items: center; gap: 8px; }
  `,
})
export class ListaAlertas {
  readonly alertas = input.required<Alerta[]>();
  protected readonly tipo = TIPO_ALERTA;

  protected tono(a: Alerta): Tono {
    return a.severidad === 'ALTA' ? 'danger' : a.severidad === 'MEDIA' ? 'warn' : 'neutral';
  }
}

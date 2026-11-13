import { Component, computed, input } from '@angular/core';
import { StatusBadge, Tono } from '../status-badge/status-badge';

export type Semaforo = 'VERDE' | 'AMBAR' | 'ROJO';

export const SEMAFORO: Record<Semaforo, { etiqueta: string; tono: Tono }> = {
  VERDE: { etiqueta: 'En meta', tono: 'ok' },
  AMBAR: { etiqueta: 'En alerta', tono: 'warn' },
  ROJO: { etiqueta: 'Fuera de meta', tono: 'danger' },
};

/** Semáforo de KPI: color, ícono y texto (nunca solo color). */
@Component({
  selector: 'gp-semaforo',
  imports: [StatusBadge],
  template: `<gp-status-badge [tono]="info().tono">{{ info().etiqueta }}</gp-status-badge>`,
})
export class SemaforoBadge {
  readonly valor = input<Semaforo | null | undefined>(null);
  protected readonly info = computed(() => {
    const v = this.valor();
    return v ? SEMAFORO[v] : { etiqueta: 'Sin datos', tono: 'neutral' as Tono };
  });
}

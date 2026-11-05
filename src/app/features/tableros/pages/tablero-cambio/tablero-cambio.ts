import { Component } from '@angular/core';
import { EnConstruccion } from '../../../../shared/ui/en-construccion/en-construccion';

@Component({
  selector: 'gp-tablero-cambio',
  imports: [EnConstruccion],
  template: `<gp-en-construccion titulo="Gestión del cambio" descripcion="Solicitudes por estado, tiempos, riesgos, costos, efectividad y adopción." />`,
})
export class TableroCambio {}

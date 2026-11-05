import { Component } from '@angular/core';
import { EnConstruccion } from '../../../../shared/ui/en-construccion/en-construccion';

@Component({
  selector: 'gp-carta-gantt',
  imports: [EnConstruccion],
  template: `<gp-en-construccion titulo="Carta Gantt" descripcion="Se genera desde las actividades y se actualiza al cambiar fechas, duraciones o al aprobar un cambio." />`,
})
export class CartaGantt {}

import { Component } from '@angular/core';
import { EnConstruccion } from '../../../../shared/ui/en-construccion/en-construccion';

@Component({
  selector: 'gp-tablero-proyecto',
  imports: [EnConstruccion],
  template: `<gp-en-construccion titulo="Seguimiento del proyecto" descripcion="Avance, hitos, presupuesto, recursos y atrasos." />`,
})
export class TableroProyecto {}

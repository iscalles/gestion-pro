import { Component } from '@angular/core';
import { EnConstruccion } from '../../../../shared/ui/en-construccion/en-construccion';

@Component({
  selector: 'gp-cambios-lista',
  imports: [EnConstruccion],
  template: `<gp-en-construccion titulo="Solicitudes de cambio" descripcion="Registro, evaluación y seguimiento de cambios con línea base y trazabilidad." />`,
})
export class CambiosLista {}

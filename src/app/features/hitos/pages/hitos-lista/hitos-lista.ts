import { Component } from '@angular/core';
import { EnConstruccion } from '../../../../shared/ui/en-construccion/en-construccion';

@Component({
  selector: 'gp-hitos-lista',
  imports: [EnConstruccion],
  template: `<gp-en-construccion titulo="Hitos" descripcion="Puntos de control con duración cero, criterios de aceptación y evidencia." />`,
})
export class HitosLista {}

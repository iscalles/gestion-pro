import { Component } from '@angular/core';
import { EnConstruccion } from '../../../../shared/ui/en-construccion/en-construccion';

@Component({
  selector: 'gp-recursos-lista',
  imports: [EnConstruccion],
  template: `<gp-en-construccion titulo="Recursos y costos" descripcion="Profesionales, licencias, materiales y equipamiento, con costos planificados y reales." />`,
})
export class RecursosLista {}

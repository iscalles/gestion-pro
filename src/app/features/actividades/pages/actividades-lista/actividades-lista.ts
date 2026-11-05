import { Component } from '@angular/core';
import { EnConstruccion } from '../../../../shared/ui/en-construccion/en-construccion';

@Component({
  selector: 'gp-actividades-lista',
  imports: [EnConstruccion],
  template: `<gp-en-construccion titulo="Actividades y dependencias" descripcion="Etapas, actividades y subactividades con fechas, avance y precedencias FS, SS, FF y SF." />`,
})
export class ActividadesLista {}

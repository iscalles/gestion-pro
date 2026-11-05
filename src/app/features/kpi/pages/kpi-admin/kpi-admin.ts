import { Component } from '@angular/core';
import { EnConstruccion } from '../../../../shared/ui/en-construccion/en-construccion';

@Component({
  selector: 'gp-kpi-admin',
  imports: [EnConstruccion],
  template: `<gp-en-construccion titulo="Indicadores" descripcion="Define KPI con variables, fórmula, meta, umbrales y periodicidad." />`,
})
export class KpiAdmin {}

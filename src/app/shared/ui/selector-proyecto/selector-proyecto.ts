import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ContextoProyecto } from '../../util/contexto-proyecto';

/** Selector del proyecto de trabajo, enlazado a ?proyecto=ID. */
@Component({
  selector: 'gp-selector-proyecto',
  imports: [FormsModule, SelectModule],
  host: { class: 'gp-campo gp-proyecto' },
  template: `
    <label [for]="id">Proyecto</label>
    <p-select
      [inputId]="id"
      [options]="ctx().opciones()"
      optionLabel="label"
      optionValue="value"
      [ngModel]="ctx().proyectoId()"
      (ngModelChange)="ctx().cambiar($event)"
      [filter]="ctx().proyectos().length > 6"
      appendTo="body"
    />
  `,
})
export class SelectorProyecto {
  readonly ctx = input.required<ContextoProyecto>();
  protected readonly id = 'sel-proyecto-' + Math.random().toString(36).slice(2, 7);
}

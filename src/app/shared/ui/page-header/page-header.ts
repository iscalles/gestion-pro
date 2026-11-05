import { Component, input } from '@angular/core';

/** Encabezado de página: título, descripción y acciones a la derecha. */
@Component({
  selector: 'gp-page-header',
  template: `
    <header class="ph">
      <div class="ph-texto">
        <h1>{{ titulo() }}</h1>
        @if (descripcion()) {
          <p>{{ descripcion() }}</p>
        }
      </div>
      <div class="ph-acciones"><ng-content /></div>
    </header>
  `,
  styles: `
    .ph {
      display: flex;
      flex-wrap: wrap;
      gap: var(--gp-space-4);
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: var(--gp-space-6);
    }
    .ph-texto {
      display: flex;
      flex-direction: column;
      gap: var(--gp-space-1);
      max-width: 72ch;
    }
    h1 {
      font-size: var(--gp-text-2xl);
      letter-spacing: -0.015em;
    }
    p {
      margin: 0;
      color: var(--gp-text-muted);
    }
    .ph-acciones {
      display: flex;
      flex-wrap: wrap;
      gap: var(--gp-space-2);
    }
  `,
})
export class PageHeader {
  readonly titulo = input.required<string>();
  readonly descripcion = input<string>();
}

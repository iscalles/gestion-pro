import { Component, input } from '@angular/core';

/** Encabezado de página: título, descripción y acciones abajo a la derecha. */
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
    :host {
      display: block;
    }
    .ph {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--gp-space-3) var(--gp-space-6);
      margin-bottom: var(--gp-space-6);
    }
    .ph-texto {
      flex: 1 1 32rem;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    }
    h1 {
      font-size: var(--gp-text-2xl);
      line-height: 1.2;
      letter-spacing: -0.02em;
    }
    p {
      margin: 0;
      max-width: 72ch;
      color: var(--gp-text-muted);
      line-height: 1.5;
      text-wrap: pretty;
    }
    /* Acciones: abajo a la derecha, también cuando bajan a su propia línea */
    .ph-acciones {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--gp-space-2);
      margin-left: auto;
    }
    .ph-acciones:empty {
      display: none;
    }
  `,
})
export class PageHeader {
  readonly titulo = input.required<string>();
  readonly descripcion = input<string>();
}

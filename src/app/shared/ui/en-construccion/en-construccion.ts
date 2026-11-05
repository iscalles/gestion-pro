import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../page-header/page-header';

/** Página provisoria para módulos que aún no se construyen. */
@Component({
  selector: 'gp-en-construccion',
  imports: [PageHeader, RouterLink],
  template: `
    <div class="pagina">
      <gp-page-header [titulo]="titulo()" [descripcion]="descripcion()" />
      <section class="panel vacio">
        <i class="pi pi-wrench" aria-hidden="true"></i>
        <h2>Módulo en construcción</h2>
        <p>{{ responsable() }}</p>
        <a routerLink="/proyectos">Volver a proyectos</a>
      </section>
    </div>
  `,
  styles: `
    .pagina { padding: var(--gp-space-8); max-width: 1440px; }
    .vacio {
      display: flex; flex-direction: column; align-items: center; gap: var(--gp-space-2);
      padding: 64px var(--gp-space-6); text-align: center;
    }
    .vacio i { font-size: 1.75rem; color: var(--gp-data); }
    h2 { font-size: var(--gp-text-lg); }
    p { margin: 0; color: var(--gp-text-muted); max-width: 52ch; }
    @media (max-width: 640px) { .pagina { padding: var(--gp-space-4); } }
  `,
})
export class EnConstruccion {
  readonly titulo = input.required<string>();
  readonly descripcion = input<string>();
  readonly responsable = input<string>('Esta pantalla se conecta al backend en las próximas iteraciones.');
}

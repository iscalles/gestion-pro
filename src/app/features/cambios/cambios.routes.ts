import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/cambios-lista/cambios-lista').then((m) => m.CambiosLista),
    title: 'Solicitudes de cambio · Gestión Pro',
  },
] satisfies Routes;

import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/carta-gantt/carta-gantt').then((m) => m.CartaGantt),
    title: 'Carta Gantt · Gestión Pro',
  },
] satisfies Routes;

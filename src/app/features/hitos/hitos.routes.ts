import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/hitos-lista/hitos-lista').then((m) => m.HitosLista),
    title: 'Hitos · Gestión Pro',
  },
] satisfies Routes;

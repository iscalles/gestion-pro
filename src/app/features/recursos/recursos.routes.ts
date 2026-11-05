import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/recursos-lista/recursos-lista').then((m) => m.RecursosLista),
    title: 'Recursos y costos · Gestión Pro',
  },
] satisfies Routes;

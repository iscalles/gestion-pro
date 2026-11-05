import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/actividades-lista/actividades-lista').then((m) => m.ActividadesLista),
    title: 'Actividades · Gestión Pro',
  },
] satisfies Routes;

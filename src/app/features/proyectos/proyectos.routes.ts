import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/proyectos-lista/proyectos-lista').then((m) => m.ProyectosLista),
    title: 'Proyectos · Gestión Pro',
  },
] satisfies Routes;

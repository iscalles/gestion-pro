import { Routes } from '@angular/router';

export default [
  { path: '', pathMatch: 'full', redirectTo: 'proyecto' },
  {
    path: 'proyecto',
    loadComponent: () => import('./pages/tablero-proyecto/tablero-proyecto').then((m) => m.TableroProyecto),
    title: 'Seguimiento del proyecto · Gestión Pro',
  },
  {
    path: 'cambio',
    loadComponent: () => import('./pages/tablero-cambio/tablero-cambio').then((m) => m.TableroCambio),
    title: 'Gestión del cambio · Gestión Pro',
  },
] satisfies Routes;

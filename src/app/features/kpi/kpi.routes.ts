import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/kpi-lista/kpi-lista').then((m) => m.KpiLista),
    title: 'Indicadores · Gestión Pro',
  },
] satisfies Routes;

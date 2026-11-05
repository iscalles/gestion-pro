import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/kpi-admin/kpi-admin').then((m) => m.KpiAdmin),
    title: 'Indicadores · Gestión Pro',
  },
] satisfies Routes;

import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/cambios-lista/cambios-lista').then((m) => m.CambiosLista),
    title: 'Solicitudes de cambio · Gestión Pro',
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/cambio-detalle/cambio-detalle').then((m) => m.CambioDetalle),
    title: 'Solicitud de cambio · Gestión Pro',
  },
] satisfies Routes;

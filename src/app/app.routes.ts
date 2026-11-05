import { Routes } from '@angular/router';
import { authGuard, invitadoGuard, rolGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
    title: 'Iniciar sesión · Gestión Pro',
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'proyectos' },
      { path: 'proyectos', loadChildren: () => import('./features/proyectos/proyectos.routes') },
      { path: 'actividades', loadChildren: () => import('./features/actividades/actividades.routes') },
      { path: 'gantt', loadChildren: () => import('./features/gantt/gantt.routes') },
      { path: 'recursos', loadChildren: () => import('./features/recursos/recursos.routes') },
      { path: 'hitos', loadChildren: () => import('./features/hitos/hitos.routes') },
      {
        path: 'kpi',
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
        loadChildren: () => import('./features/kpi/kpi.routes'),
      },
      { path: 'cambios', loadChildren: () => import('./features/cambios/cambios.routes') },
      { path: 'tableros', loadChildren: () => import('./features/tableros/tableros.routes') },
    ],
  },
  { path: '**', redirectTo: '' },
];

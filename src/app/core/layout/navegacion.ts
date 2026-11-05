import { Rol } from '../auth/auth.models';

export interface ItemMenu {
  etiqueta: string;
  ruta: string;
  icono: string;
  roles?: Rol[];
}

export interface GrupoMenu {
  titulo: string;
  items: ItemMenu[];
}

export const MENU: GrupoMenu[] = [
  {
    titulo: 'Planificación',
    items: [
      { etiqueta: 'Proyectos', ruta: '/proyectos', icono: 'pi pi-folder' },
      { etiqueta: 'Actividades', ruta: '/actividades', icono: 'pi pi-list' },
      { etiqueta: 'Carta Gantt', ruta: '/gantt', icono: 'pi pi-chart-bar' },
    ],
  },
  {
    titulo: 'Ejecución',
    items: [
      { etiqueta: 'Recursos y costos', ruta: '/recursos', icono: 'pi pi-users' },
      { etiqueta: 'Hitos', ruta: '/hitos', icono: 'pi pi-flag' },
      { etiqueta: 'Indicadores', ruta: '/kpi', icono: 'pi pi-gauge', roles: ['ADMINISTRADOR'] },
    ],
  },
  {
    titulo: 'Cambios',
    items: [{ etiqueta: 'Solicitudes de cambio', ruta: '/cambios', icono: 'pi pi-arrow-right-arrow-left' }],
  },
  {
    titulo: 'Tableros',
    items: [
      { etiqueta: 'Seguimiento del proyecto', ruta: '/tableros/proyecto', icono: 'pi pi-th-large' },
      { etiqueta: 'Gestión del cambio', ruta: '/tableros/cambio', icono: 'pi pi-chart-line' },
    ],
  },
];

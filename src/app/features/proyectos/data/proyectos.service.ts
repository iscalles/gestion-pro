import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Proyecto } from '../models/proyecto.model';

/**
 * Acceso a /api/proyectos.
 * TODO: cambiar los datos de ejemplo por HttpClient cuando el backend esté arriba:
 *   private http = inject(HttpClient);
 *   listar() { return this.http.get<Proyecto[]>(`${environment.apiUrl}/proyectos`); }
 */
@Injectable({ providedIn: 'root' })
export class ProyectosService {
  listar(): Observable<Proyecto[]> {
    return of(EJEMPLO);
  }
}

const EJEMPLO: Proyecto[] = [
  { id: 1, codigo: 'PRY-2026-01', nombre: 'Sistema de Inventario Regional', descripcion: '', responsable: 'Carla Muñoz', fechaInicio: '2026-09-01', fechaTermino: '2027-01-29', presupuesto: 48_500_000, estado: 'EN_EJECUCION', avance: 36 },
  { id: 2, codigo: 'PRY-2026-02', nombre: 'Portal de Proveedores', descripcion: '', responsable: 'Diego Rojas', fechaInicio: '2026-07-15', fechaTermino: '2026-12-18', presupuesto: 62_000_000, estado: 'EN_EJECUCION', avance: 71 },
  { id: 3, codigo: 'PRY-2026-03', nombre: 'App de Inspecciones en Terreno', descripcion: '', responsable: 'Carla Muñoz', fechaInicio: '2027-01-04', fechaTermino: '2027-06-30', presupuesto: 37_800_000, estado: 'PLANIFICADO', avance: 0 },
  { id: 4, codigo: 'PRY-2026-04', nombre: 'Migración de Mesa de Ayuda', descripcion: '', responsable: 'Fernanda Soto', fechaInicio: '2026-03-02', fechaTermino: '2026-07-31', presupuesto: 21_400_000, estado: 'TERMINADO', avance: 100 },
];

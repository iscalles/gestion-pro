import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Proyecto, ProyectoRequest } from '../models/proyecto.model';

/** Acceso a /api/proyectos. */
@Injectable({ providedIn: 'root' })
export class ProyectosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/proyectos`;

  /** El backend filtra según el rol: el administrador ve todos, el usuario de proyecto los suyos. */
  listar(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(this.url);
  }

  obtener(id: number): Observable<Proyecto> {
    return this.http.get<Proyecto>(`${this.url}/${id}`);
  }

  crear(datos: ProyectoRequest): Observable<Proyecto> {
    return this.http.post<Proyecto>(this.url, datos);
  }

  actualizar(id: number, datos: ProyectoRequest): Observable<Proyecto> {
    return this.http.put<Proyecto>(`${this.url}/${id}`, datos);
  }

  /** Cierre formal: sin actividades abiertas ni solicitudes de cambio sin cerrar. */
  cerrar(id: number, fechaTerminoReal: string | null): Observable<Proyecto> {
    return this.http.post<Proyecto>(`${this.url}/${id}/cerrar`, { fechaTerminoReal });
  }

  /** Solo proyectos planificados. */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  calendarios(): Observable<{ id: number; nombre: string }[]> {
    return this.http.get<{ id: number; nombre: string }[]>(`${environment.apiUrl}/calendarios`);
  }
}

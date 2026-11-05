import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ActividadRequest,
  DependenciaRequest,
  Plan,
  PlanCambio,
  Profesional,
} from '../models/planificacion.model';

/** Acceso a /api/proyectos/{id}/plan, actividades y dependencias. Toda modificación devuelve el plan recalculado. */
@Injectable({ providedIn: 'root' })
export class PlanificacionService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  private url(proyectoId: number): string {
    return `${this.api}/proyectos/${proyectoId}`;
  }

  plan(proyectoId: number): Observable<Plan> {
    return this.http.get<Plan>(`${this.url(proyectoId)}/plan`);
  }

  crearActividad(proyectoId: number, datos: ActividadRequest): Observable<PlanCambio> {
    return this.http.post<PlanCambio>(`${this.url(proyectoId)}/actividades`, datos);
  }

  actualizarActividad(
    proyectoId: number,
    id: number,
    datos: ActividadRequest,
  ): Observable<PlanCambio> {
    return this.http.put<PlanCambio>(`${this.url(proyectoId)}/actividades/${id}`, datos);
  }

  eliminarActividad(proyectoId: number, id: number): Observable<PlanCambio> {
    return this.http.delete<PlanCambio>(`${this.url(proyectoId)}/actividades/${id}`);
  }

  crearDependencia(proyectoId: number, datos: DependenciaRequest): Observable<PlanCambio> {
    return this.http.post<PlanCambio>(`${this.url(proyectoId)}/dependencias`, datos);
  }

  actualizarDependencia(
    proyectoId: number,
    id: number,
    datos: DependenciaRequest,
  ): Observable<PlanCambio> {
    return this.http.put<PlanCambio>(`${this.url(proyectoId)}/dependencias/${id}`, datos);
  }

  eliminarDependencia(proyectoId: number, id: number): Observable<PlanCambio> {
    return this.http.delete<PlanCambio>(`${this.url(proyectoId)}/dependencias/${id}`);
  }

  profesionales(): Observable<Profesional[]> {
    return this.http.get<Profesional[]>(`${this.api}/profesionales`);
  }
}

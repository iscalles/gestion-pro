import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AsignacionProfesionalRequest,
  AsignacionRecursoRequest,
  CargaProfesional,
  Costos,
  ProfesionalFicha,
  ProfesionalRequest,
  RecursoRequest,
  RequerimientoRequest,
  TipoProfesional,
} from '../models/recurso.model';

/** Módulo 5. Toda modificación del proyecto responde los costos recalculados. */
@Injectable({ providedIn: 'root' })
export class RecursosService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  private url(pid: number): string {
    return `${this.api}/proyectos/${pid}`;
  }

  costos(pid: number): Observable<Costos> {
    return this.http.get<Costos>(`${this.url(pid)}/costos`);
  }

  carga(pid: number, desde: string, hasta: string): Observable<CargaProfesional[]> {
    return this.http.get<CargaProfesional[]>(`${this.url(pid)}/carga`, { params: new HttpParams().set('desde', desde).set('hasta', hasta) });
  }

  guardarAsignacionProfesional(pid: number, id: number | null, datos: AsignacionProfesionalRequest): Observable<Costos> {
    const u = `${this.url(pid)}/asignaciones-profesional`;
    return id == null ? this.http.post<Costos>(u, datos) : this.http.put<Costos>(`${u}/${id}`, datos);
  }

  eliminarAsignacionProfesional(pid: number, id: number): Observable<Costos> {
    return this.http.delete<Costos>(`${this.url(pid)}/asignaciones-profesional/${id}`);
  }

  guardarAsignacionRecurso(pid: number, id: number | null, datos: AsignacionRecursoRequest): Observable<Costos> {
    const u = `${this.url(pid)}/asignaciones-recurso`;
    return id == null ? this.http.post<Costos>(u, datos) : this.http.put<Costos>(`${u}/${id}`, datos);
  }

  eliminarAsignacionRecurso(pid: number, id: number): Observable<Costos> {
    return this.http.delete<Costos>(`${this.url(pid)}/asignaciones-recurso/${id}`);
  }

  guardarRecurso(pid: number, id: number | null, datos: RecursoRequest): Observable<Costos> {
    const u = `${this.url(pid)}/recursos`;
    return id == null ? this.http.post<Costos>(u, datos) : this.http.put<Costos>(`${u}/${id}`, datos);
  }

  eliminarRecurso(pid: number, id: number): Observable<Costos> {
    return this.http.delete<Costos>(`${this.url(pid)}/recursos/${id}`);
  }

  guardarRequerimiento(pid: number, id: number | null, datos: RequerimientoRequest): Observable<Costos> {
    const u = `${this.url(pid)}/requerimientos`;
    return id == null ? this.http.post<Costos>(u, datos) : this.http.put<Costos>(`${u}/${id}`, datos);
  }

  eliminarRequerimiento(pid: number, id: number): Observable<Costos> {
    return this.http.delete<Costos>(`${this.url(pid)}/requerimientos/${id}`);
  }

  // ---- catálogo global (administrador)

  profesionales(todos = false): Observable<ProfesionalFicha[]> {
    return this.http.get<ProfesionalFicha[]>(`${this.api}/profesionales`, { params: new HttpParams().set('todos', todos) });
  }

  guardarProfesional(id: number | null, datos: ProfesionalRequest): Observable<ProfesionalFicha> {
    const u = `${this.api}/profesionales`;
    return id == null ? this.http.post<ProfesionalFicha>(u, datos) : this.http.put<ProfesionalFicha>(`${u}/${id}`, datos);
  }

  eliminarProfesional(id: number): Observable<{ eliminado: boolean; desactivado: boolean; mensaje: string }> {
    return this.http.delete<{ eliminado: boolean; desactivado: boolean; mensaje: string }>(`${this.api}/profesionales/${id}`);
  }

  tipos(): Observable<TipoProfesional[]> {
    return this.http.get<TipoProfesional[]>(`${this.api}/tipos-profesional`);
  }

  guardarTipo(id: number | null, datos: { categoria: string; tarifaHoraRef: number }): Observable<TipoProfesional> {
    const u = `${this.api}/tipos-profesional`;
    return id == null ? this.http.post<TipoProfesional>(u, datos) : this.http.put<TipoProfesional>(`${u}/${id}`, datos);
  }

  eliminarTipo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/tipos-profesional/${id}`);
  }
}

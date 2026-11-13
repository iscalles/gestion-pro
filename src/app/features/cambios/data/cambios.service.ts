import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AccionCorrectiva,
  Aprobacion,
  Comparacion,
  LineaBase,
  OpcionModificacion,
  Solicitud,
  SolicitudRequest,
  SolicitudResumen,
  Trazabilidad,
} from '../models/cambio.model';

/** Módulos 8 y 9: solicitudes de cambio con sus 10 etapas, modificaciones, acciones y líneas base. */
@Injectable({ providedIn: 'root' })
export class CambiosService {
  private readonly http = inject(HttpClient);

  private url(pid: number): string {
    return `${environment.apiUrl}/proyectos/${pid}`;
  }

  listar(pid: number): Observable<SolicitudResumen[]> {
    return this.http.get<SolicitudResumen[]>(`${this.url(pid)}/cambios`);
  }

  obtener(pid: number, id: number): Observable<Solicitud> {
    return this.http.get<Solicitud>(`${this.url(pid)}/cambios/${id}`);
  }

  guardar(pid: number, id: number | null, datos: SolicitudRequest): Observable<Solicitud> {
    const u = `${this.url(pid)}/cambios`;
    return id == null ? this.http.post<Solicitud>(u, datos) : this.http.put<Solicitud>(`${u}/${id}`, datos);
  }

  eliminar(pid: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.url(pid)}/cambios/${id}`);
  }

  seguimiento(pid: number, id: number, datos: { costoReal: number | null; adopcion: number | null; efectividad: number | null }): Observable<Solicitud> {
    return this.http.put<Solicitud>(`${this.url(pid)}/cambios/${id}/seguimiento`, datos);
  }

  avanzar(pid: number, id: number, observacion: string | null): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.url(pid)}/cambios/${id}/avanzar`, { observacion });
  }

  aprobar(pid: number, id: number, observacion: string | null): Observable<Aprobacion> {
    return this.http.post<Aprobacion>(`${this.url(pid)}/cambios/${id}/aprobar`, { observacion });
  }

  rechazar(pid: number, id: number, observacion: string): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.url(pid)}/cambios/${id}/rechazar`, { observacion });
  }

  cerrar(
    pid: number,
    id: number,
    datos: { resultado: string; efectividad: number | null; adopcion: number | null; costoReal: number | null; fechaReal: string | null },
  ): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.url(pid)}/cambios/${id}/cerrar`, datos);
  }

  actualizarEtapa(pid: number, id: number, numero: number, datos: { responsableId: number | null; fechaLimite: string | null; observacion: string | null }): Observable<Solicitud> {
    return this.http.put<Solicitud>(`${this.url(pid)}/cambios/${id}/etapas/${numero}`, datos);
  }

  opcionesModificacion(pid: number): Observable<OpcionModificacion[]> {
    return this.http.get<OpcionModificacion[]>(`${this.url(pid)}/opciones-modificacion`);
  }

  agregarModificacion(pid: number, id: number, datos: { entidad: string; entidadId: number; campo: string; valorNuevo: string }): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.url(pid)}/cambios/${id}/modificaciones`, datos);
  }

  eliminarModificacion(pid: number, id: number, mid: number): Observable<Solicitud> {
    return this.http.delete<Solicitud>(`${this.url(pid)}/cambios/${id}/modificaciones/${mid}`);
  }

  acciones(pid: number): Observable<AccionCorrectiva[]> {
    return this.http.get<AccionCorrectiva[]>(`${this.url(pid)}/acciones-correctivas`);
  }

  guardarAccion(
    pid: number,
    id: number,
    accionId: number | null,
    datos: { descripcion: string; responsableId: number; fechaCompromiso: string; fechaCierre: string | null },
  ): Observable<Solicitud> {
    const u = `${this.url(pid)}/cambios/${id}/acciones`;
    return accionId == null ? this.http.post<Solicitud>(u, datos) : this.http.put<Solicitud>(`${u}/${accionId}`, datos);
  }

  eliminarAccion(pid: number, id: number, accionId: number): Observable<Solicitud> {
    return this.http.delete<Solicitud>(`${this.url(pid)}/cambios/${id}/acciones/${accionId}`);
  }

  trazabilidad(pid: number): Observable<Trazabilidad[]> {
    return this.http.get<Trazabilidad[]>(`${this.url(pid)}/trazabilidad`);
  }

  lineasBase(pid: number): Observable<LineaBase[]> {
    return this.http.get<LineaBase[]>(`${this.url(pid)}/lineas-base`);
  }

  comparar(pid: number, lineaBaseId: number): Observable<Comparacion> {
    return this.http.get<Comparacion>(`${this.url(pid)}/lineas-base/${lineaBaseId}/comparacion`);
  }

  urlEvidencias(pid: number, id: number): string {
    return `${this.url(pid)}/cambios/${id}/evidencias`;
  }
}

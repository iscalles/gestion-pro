import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Hito, HitoRequest } from '../models/hito.model';

/** Módulo 6: hitos con criterios de aceptación, evidencias y KPI vinculados. */
@Injectable({ providedIn: 'root' })
export class HitosService {
  private readonly http = inject(HttpClient);

  private url(pid: number): string {
    return `${environment.apiUrl}/proyectos/${pid}/hitos`;
  }

  listar(proyectoId: number): Observable<Hito[]> {
    return this.http.get<Hito[]>(this.url(proyectoId));
  }

  guardar(pid: number, id: number | null, datos: HitoRequest): Observable<Hito> {
    return id == null ? this.http.post<Hito>(this.url(pid), datos) : this.http.put<Hito>(`${this.url(pid)}/${id}`, datos);
  }

  marcarCriterio(pid: number, hitoId: number, criterioId: number, cumplido: boolean): Observable<Hito> {
    return this.http.put<Hito>(`${this.url(pid)}/${hitoId}/criterios/${criterioId}`, { cumplido });
  }

  eliminar(pid: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.url(pid)}/${id}`);
  }

  urlEvidencias(pid: number, id: number): string {
    return `${this.url(pid)}/${id}/evidencias`;
  }
}

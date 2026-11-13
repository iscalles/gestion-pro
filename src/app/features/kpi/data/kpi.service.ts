import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AmbitoKpi, CategoriaKpi, Kpi, KpiRequest, PruebaFormula, Variable } from '../models/kpi.model';

/** Módulos 7 y 9: indicadores configurables con fórmula, umbrales e historial. */
@Injectable({ providedIn: 'root' })
export class KpiService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;
  private variables$: Observable<Variable[]> | null = null;

  listar(pid: number, categoria?: CategoriaKpi): Observable<Kpi[]> {
    const params = categoria ? new HttpParams().set('categoria', categoria) : undefined;
    return this.http.get<Kpi[]>(`${this.api}/proyectos/${pid}/kpi`, { params });
  }

  variables(): Observable<Variable[]> {
    this.variables$ ??= this.http.get<Variable[]>(`${this.api}/kpi/variables`).pipe(shareReplay(1));
    return this.variables$;
  }

  guardar(pid: number, id: number | null, datos: KpiRequest): Observable<Kpi> {
    const u = `${this.api}/proyectos/${pid}/kpi`;
    return id == null ? this.http.post<Kpi>(u, datos) : this.http.put<Kpi>(`${u}/${id}`, datos);
  }

  eliminar(pid: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/proyectos/${pid}/kpi/${id}`);
  }

  registrarMedicion(pid: number, id: number, datos: { valor: number; fecha?: string | null; observacion?: string | null }): Observable<Kpi> {
    return this.http.post<Kpi>(`${this.api}/proyectos/${pid}/kpi/${id}/mediciones`, datos);
  }

  probar(pid: number, formula: string, ambito: AmbitoKpi, ambitoRefId: number | null): Observable<PruebaFormula> {
    return this.http.post<PruebaFormula>(`${this.api}/proyectos/${pid}/kpi/probar`, { formula, ambito, ambitoRefId });
  }
}

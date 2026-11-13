import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Alerta, TableroCambio, TableroProyecto } from '../models/tablero.model';

function parametros(obj: Record<string, string | number | null | undefined>): HttpParams {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v != null && v !== '') p = p.set(k, String(v));
  }
  return p;
}

@Injectable({ providedIn: 'root' })
export class TablerosService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  proyecto(f: { proyectoId: number; etapaId?: number | null; desde?: string | null; hasta?: string | null; responsableId?: number | null }): Observable<TableroProyecto> {
    return this.http.get<TableroProyecto>(`${this.api}/tableros/proyecto`, { params: parametros(f) });
  }

  cambio(f: { proyectoId: number; desde?: string | null; hasta?: string | null; tipo?: string | null; prioridad?: string | null }): Observable<TableroCambio> {
    return this.http.get<TableroCambio>(`${this.api}/tableros/cambio`, { params: parametros(f) });
  }

  alertas(pid: number, todas = false): Observable<Alerta[]> {
    return this.http.get<Alerta[]>(`${this.api}/proyectos/${pid}/alertas`, { params: parametros({ todas: String(todas) }) });
  }
}

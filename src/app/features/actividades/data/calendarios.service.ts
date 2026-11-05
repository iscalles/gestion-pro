import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Calendario, CalendarioRequest } from '../models/calendario.model';

/** Acceso a /api/calendarios. Cada cambio reprograma los proyectos que usan el calendario. */
@Injectable({ providedIn: 'root' })
export class CalendariosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/calendarios`;

  obtener(id: number): Observable<Calendario> {
    return this.http.get<Calendario>(`${this.url}/${id}`);
  }

  actualizar(id: number, datos: CalendarioRequest): Observable<Calendario> {
    return this.http.put<Calendario>(`${this.url}/${id}`, datos);
  }

  agregarDia(id: number, fecha: string, motivo: string): Observable<Calendario> {
    return this.http.post<Calendario>(`${this.url}/${id}/dias-no-laborables`, { fecha, motivo });
  }

  quitarDia(id: number, diaId: number): Observable<Calendario> {
    return this.http.delete<Calendario>(`${this.url}/${id}/dias-no-laborables/${diaId}`);
  }
}

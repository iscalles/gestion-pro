import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Hito } from '../models/hito.model';

/** Acceso a /api/proyectos/{id}/hitos. Por ahora solo lectura; el CRUD llega con el Módulo 6. */
@Injectable({ providedIn: 'root' })
export class HitosService {
  private readonly http = inject(HttpClient);

  listar(proyectoId: number): Observable<Hito[]> {
    return this.http.get<Hito[]>(`${environment.apiUrl}/proyectos/${proyectoId}/hitos`);
  }
}

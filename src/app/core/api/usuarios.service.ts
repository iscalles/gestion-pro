import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../auth/auth.models';

/** GET /api/usuarios: usuarios activos para elegir responsables y miembros. Se cachea por sesión. */
@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private cache$: Observable<Usuario[]> | null = null;

  listar(): Observable<Usuario[]> {
    this.cache$ ??= this.http.get<Usuario[]>(`${environment.apiUrl}/usuarios`).pipe(shareReplay(1));
    return this.cache$;
  }
}

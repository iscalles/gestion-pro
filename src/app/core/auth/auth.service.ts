import { Injectable, computed, signal } from '@angular/core';
import { Observable, of, throwError, delay } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Rol, Sesion } from './auth.models';

const STORAGE_KEY = 'gp.sesion';

/**
 * Sesión del usuario. Mientras el backend no exponga /api/auth/login,
 * `login` valida contra dos cuentas de demostración.
 * TODO: reemplazar por `http.post<Sesion>(`${environment.apiUrl}/auth/login`, ...)`.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sesion = signal<Sesion | null>(this.leer());

  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly token = computed(() => this.sesion()?.token ?? null);
  readonly autenticado = computed(() => this.sesion() !== null);
  readonly esAdmin = computed(() => this.usuario()?.rol === 'ADMINISTRADOR');

  login(correo: string, clave: string): Observable<Sesion> {
    const cuentas: Record<string, Sesion> = {
      'admin@gestionpro.cl': {
        token: 'demo-admin',
        usuario: { id: 1, nombre: 'Carla Muñoz', correo: 'admin@gestionpro.cl', rol: 'ADMINISTRADOR' },
      },
      'usuario@gestionpro.cl': {
        token: 'demo-usuario',
        usuario: { id: 2, nombre: 'Tomás Vidal', correo: 'usuario@gestionpro.cl', rol: 'USUARIO_PROYECTO' },
      },
    };
    const sesion = cuentas[correo.trim().toLowerCase()];
    if (!sesion || clave !== 'demo1234') {
      return throwError(() => new Error('El correo o la contraseña no coinciden.'));
    }
    return of(sesion).pipe(
      delay(250),
      tap((s) => this.guardar(s)),
    );
  }

  logout(): void {
    this.guardar(null);
  }

  tieneRol(roles: Rol[]): boolean {
    const rol = this.usuario()?.rol;
    return !!rol && roles.includes(rol);
  }

  private guardar(s: Sesion | null): void {
    this.sesion.set(s);
    try {
      if (s) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* almacenamiento no disponible: la sesión vive solo en memoria */
    }
  }

  private leer(): Sesion | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Sesion) : null;
    } catch {
      return null;
    }
  }
}

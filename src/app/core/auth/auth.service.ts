import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Rol, Sesion } from './auth.models';

const STORAGE_KEY = 'gp.sesion';

/** Sesión del usuario contra POST /api/auth/login (JWT). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sesion = signal<Sesion | null>(this.leer());

  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly token = computed(() => this.sesion()?.token ?? null);
  readonly autenticado = computed(() => this.sesion() !== null);
  readonly esAdmin = computed(() => this.usuario()?.rol === 'ADMINISTRADOR');

  login(correo: string, clave: string): Observable<Sesion> {
    return this.http
      .post<Sesion>(`${environment.apiUrl}/auth/login`, { correo: correo.trim().toLowerCase(), clave })
      .pipe(tap((s) => this.guardar(s)));
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

  /** Recupera la sesión guardada, descartándola si el token ya expiró. */
  private leer(): Sesion | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw) as Sesion;
      return tokenVigente(s.token) ? s : null;
    } catch {
      return null;
    }
  }
}

function tokenVigente(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

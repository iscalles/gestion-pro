import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Rol } from './auth.models';

/** Exige sesión iniciada; si no, lleva al login. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.autenticado() ? true : inject(Router).createUrlTree(['/login']);
};

/** Exige uno de los roles indicados en `data.roles` de la ruta. */
export const rolGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const roles = (route.data['roles'] ?? []) as Rol[];
  return auth.tieneRol(roles) ? true : inject(Router).createUrlTree(['/proyectos']);
};

/** Evita volver al login con sesión iniciada. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.autenticado() ? inject(Router).createUrlTree(['/proyectos']) : true;
};

export type Rol = 'ADMINISTRADOR' | 'USUARIO_PROYECTO';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}

export const ROL_ETIQUETA: Record<Rol, string> = {
  ADMINISTRADOR: 'Administrador',
  USUARIO_PROYECTO: 'Usuario de proyecto',
};

import { HttpErrorResponse } from '@angular/common/http';

/** Forma de los errores que devuelve el backend (ver README del backend). */
export interface ApiError {
  estado: number;
  codigo: string;
  mensaje: string;
  campos: Record<string, string>;
  fecha: string;
}

/** Convierte cualquier error HTTP en un mensaje para mostrar al usuario. */
export function mensajeDeError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'No hay conexión con el servidor. Revisa que el backend esté corriendo en el puerto 8080.';
    }
    const cuerpo = err.error as Partial<ApiError> | null;
    if (cuerpo?.mensaje) {
      return cuerpo.mensaje;
    }
    if (err.status >= 500) {
      return 'El servidor tuvo un error. Intenta de nuevo en unos segundos.';
    }
  }
  return err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
}

/** Errores por campo de una respuesta 400, para marcarlos en el formulario. */
export function erroresDeCampos(err: unknown): Record<string, string> {
  if (err instanceof HttpErrorResponse && err.status === 400) {
    return (err.error as Partial<ApiError> | null)?.campos ?? {};
  }
  return {};
}

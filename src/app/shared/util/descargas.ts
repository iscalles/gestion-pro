import { HttpClient } from '@angular/common/http';

/** Descarga un archivo protegido (con el JWT del interceptor) y lo abre con el nombre original. */
export function descargarArchivo(http: HttpClient, url: string, nombre: string): Promise<void> {
  return new Promise((resolver, rechazar) => {
    http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const enlace = document.createElement('a');
        enlace.href = URL.createObjectURL(blob);
        enlace.download = nombre;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        setTimeout(() => URL.revokeObjectURL(enlace.href), 10_000);
        resolver();
      },
      error: rechazar,
    });
  });
}

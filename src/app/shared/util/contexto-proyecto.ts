import { computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { mensajeDeError } from '../../core/api/api-error';
import { ProyectosService } from '../../features/proyectos/data/proyectos.service';
import { Proyecto } from '../../features/proyectos/models/proyecto.model';

const CLAVE = 'gp.proyecto';

/** Último proyecto elegido en cualquier módulo, para no tener que volver a elegirlo al navegar. */
export function proyectoPreferido(): number | null {
  try {
    const v = Number(sessionStorage.getItem(CLAVE));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

export function recordarProyecto(id: number | null): void {
  try {
    if (id != null) sessionStorage.setItem(CLAVE, String(id));
  } catch {
    /* sin almacenamiento: no se recuerda */
  }
}

/**
 * Proyecto de trabajo de una pantalla: lista de proyectos visibles, el elegido (?proyecto=ID, si no el último
 * usado, si no el primero en ejecución) y cómo cambiarlo. Se llama en un contexto de inyección.
 */
export function contextoProyecto() {
  const ruta = inject(ActivatedRoute);
  const router = inject(Router);
  const servicio = inject(ProyectosService);

  const proyectos = signal<Proyecto[]>([]);
  const cargando = signal(true);
  const error = signal<string | null>(null);
  const pedido = toSignal(ruta.queryParamMap.pipe(map((p) => Number(p.get('proyecto')) || null)), {
    initialValue: null,
  });

  const proyectoId = computed(() => {
    const ps = proyectos();
    for (const candidato of [pedido(), proyectoPreferido()]) {
      if (candidato != null && ps.some((p) => p.id === candidato)) return candidato;
    }
    return ps.find((p) => p.estado === 'EN_EJECUCION')?.id ?? ps[0]?.id ?? null;
  });
  const proyecto = computed(() => proyectos().find((p) => p.id === proyectoId()) ?? null);
  const opciones = computed(() => proyectos().map((p) => ({ label: `${p.codigo} · ${p.nombre}`, value: p.id })));

  effect(() => recordarProyecto(proyectoId()));

  function cargar(): void {
    cargando.set(true);
    error.set(null);
    servicio.listar().subscribe({
      next: (ps) => {
        proyectos.set(ps);
        cargando.set(false);
      },
      error: (e) => {
        error.set(mensajeDeError(e));
        cargando.set(false);
      },
    });
  }

  function cambiar(id: number): void {
    router.navigate([], { queryParams: { proyecto: id }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  cargar();
  return { proyectos, cargando, error, proyectoId, proyecto, opciones, cambiar, recargar: cargar };
}

export type ContextoProyecto = ReturnType<typeof contextoProyecto>;

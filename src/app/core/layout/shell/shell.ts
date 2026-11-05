import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ROL_ETIQUETA } from '../../auth/auth.models';
import { MENU } from '../navegacion';

@Component({
  selector: 'gp-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly usuario = this.auth.usuario;
  protected readonly menuAbierto = signal(false);
  protected readonly rolEtiqueta = computed(() => {
    const u = this.usuario();
    return u ? ROL_ETIQUETA[u.rol] : '';
  });
  protected readonly iniciales = computed(() =>
    (this.usuario()?.nombre ?? '')
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join(''),
  );
  protected readonly menu = computed(() =>
    MENU.map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || this.auth.tieneRol(i.roles)) })).filter(
      (g) => g.items.length > 0,
    ),
  );

  protected alternarMenu(): void {
    this.menuAbierto.update((v) => !v);
  }

  protected cerrarSesion(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}

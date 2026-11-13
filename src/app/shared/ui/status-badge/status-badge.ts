import { Component, computed, input } from '@angular/core';

export type Tono = 'ok' | 'warn' | 'danger' | 'neutral' | 'accent';

const ICONO: Record<Tono, string> = {
  ok: 'pi pi-check-circle',
  warn: 'pi pi-exclamation-circle',
  danger: 'pi pi-times-circle',
  neutral: 'pi pi-circle',
  accent: 'pi pi-play-circle',
};

/**
 * Estado o semáforo. El tono nunca depende solo del color:
 * cada uno lleva un ícono distinto y su texto.
 */
@Component({
  selector: 'gp-status-badge',
  template: `<span class="badge" [class]="'badge t-' + tono()"><i [class]="icono()" aria-hidden="true"></i><ng-content /></span>`,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      max-width: 100%;
      padding: 2px 8px 2px 6px;
      border-radius: var(--gp-radius-sm);
      font-size: var(--gp-text-xs);
      font-weight: 500;
      line-height: 1.5;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    i {
      flex: none;
      font-size: 0.75rem;
    }
    .t-ok { background: var(--gp-ok-soft); color: var(--gp-ok); }
    .t-warn { background: var(--gp-warn-soft); color: var(--gp-warn); }
    .t-danger { background: var(--gp-danger-soft); color: var(--gp-danger); }
    .t-neutral { background: var(--gp-neutral-soft); color: var(--gp-text-muted); }
    .t-accent { background: var(--gp-accent-soft); color: var(--gp-accent-hover); }
  `,
})
export class StatusBadge {
  readonly tono = input<Tono>('neutral');
  protected readonly icono = computed(() => ICONO[this.tono()]);
}

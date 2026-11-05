import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEsCl from '@angular/common/locales/es-CL';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { GestionPreset } from './theme/gestion-preset';

registerLocaleData(localeEsCl);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-CL' },
    providePrimeNG({
      theme: {
        preset: GestionPreset,
        // La app es solo modo claro por ahora: la clase nunca se aplica.
        options: { darkModeSelector: '.gp-dark' },
      },
    }),
  ],
};

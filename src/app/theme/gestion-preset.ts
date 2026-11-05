import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Tema de PrimeNG con la paleta turquesa del proyecto.
 * El color primario usa el tono 700 (#2C6163) porque el 500 (#609496)
 * no alcanza 4.5:1 con texto blanco.
 */
export const GestionPreset = definePreset(Aura, {
  primitive: {
    borderRadius: { none: '0', xs: '2px', sm: '4px', md: '6px', lg: '8px', xl: '10px' },
  },
  semantic: {
    primary: {
      50: '#eef6f6',
      100: '#dcedee',
      200: '#c1dcdd',
      300: '#a9c8c9',
      400: '#7faaac',
      500: '#609496',
      600: '#457b7d',
      700: '#2c6163',
      800: '#1b4a4c',
      900: '#0c3133',
      950: '#072224',
    },
    focusRing: { width: '2px', style: 'solid', color: '{primary.700}', offset: '2px' },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f4f7f7',
          100: '#e9efef',
          200: '#d3e0e0',
          300: '#b7c8c9',
          400: '#8fa4a5',
          500: '#6b8183',
          600: '#4a6466',
          700: '#34494b',
          800: '#203436',
          900: '#12262a',
          950: '#0a1a1c',
        },
        primary: {
          color: '{primary.700}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.800}',
          activeColor: '{primary.900}',
        },
        highlight: {
          background: '{primary.100}',
          focusBackground: '{primary.200}',
          color: '{primary.900}',
          focusColor: '{primary.900}',
        },
        text: {
          color: '#0c3133',
          mutedColor: '#4a6466',
        },
      },
    },
  },
});

import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Tema de PrimeNG con la dirección «Papel de plano»: tinta sobre papel claro, turquesa solo para acción,
 * selección y foco, líneas finas en reposo y sombra solo en lo que flota. Los mismos valores viven como
 * variables CSS en src/styles/_tokens.scss (SVG y estilos propios).
 *
 * Solo tema claro: los valores se fijan directamente (sin light-dark()).
 * El primario es el tono 700 (#0B6E6A, 6.08:1 con blanco).
 */
const TINTA = '#0f2a2b';
const TINTA_SECUNDARIA = '#4a5f60';
const SOMBRA_FLOTANTE = '0 16px 40px -12px rgba(15, 42, 43, 0.22), 0 2px 6px rgba(15, 42, 43, 0.06)';
const SOMBRA_MENU = '0 12px 28px -10px rgba(15, 42, 43, 0.2), 0 2px 6px rgba(15, 42, 43, 0.06)';

export const GestionPreset = definePreset(Aura, {
  primitive: {
    borderRadius: { none: '0', xs: '2px', sm: '4px', md: '6px', lg: '8px', xl: '10px' },
  },
  semantic: {
    transitionDuration: '0.16s',
    focusRing: { width: '2px', style: 'solid', color: '{primary.700}', offset: '2px', shadow: 'none' },
    primary: {
      50: '#eef8f7',
      100: '#ddf0ee',
      200: '#bfe6e4',
      300: '#94d2ce',
      400: '#5fb6b1',
      500: '#2e9690',
      600: '#128079',
      700: '#0b6e6a',
      800: '#08524f',
      900: '#073d3b',
      950: '#052a29',
      color: '{primary.700}',
      contrastColor: '#ffffff',
      hoverColor: '{primary.800}',
      activeColor: '{primary.900}',
    },
    surface: {
      0: '#ffffff',
      50: '#f5f7f6',
      100: '#ebf1f0',
      200: '#dce4e3',
      300: '#b9c7c6',
      400: '#7a8f8e',
      500: '#5f7374',
      600: '#4a5f60',
      700: '#34494a',
      800: '#1f3536',
      900: '#0f2a2b',
      950: '#0b2224',
    },
    text: {
      color: TINTA,
      hoverColor: TINTA,
      mutedColor: TINTA_SECUNDARIA,
      hoverMutedColor: TINTA,
    },
    highlight: {
      background: '{primary.100}',
      focusBackground: '{primary.200}',
      color: '{primary.900}',
      focusColor: '{primary.950}',
    },
    mask: {
      transitionDuration: '0.2s',
      background: 'rgba(11, 34, 36, 0.36)',
      color: '{surface.200}',
    },
    formField: {
      paddingX: '0.75rem',
      paddingY: '0.5rem',
      background: '#ffffff',
      disabledBackground: '{surface.100}',
      filledBackground: '{surface.50}',
      filledHoverBackground: '{surface.50}',
      filledFocusBackground: '{surface.50}',
      borderColor: '{surface.400}',
      hoverBorderColor: '{surface.600}',
      focusBorderColor: '{primary.color}',
      invalidBorderColor: '#a3231b',
      color: TINTA,
      disabledColor: '{surface.500}',
      placeholderColor: '{surface.500}',
      invalidPlaceholderColor: '#a3231b',
      floatLabelColor: '{surface.500}',
      floatLabelFocusColor: '{primary.color}',
      floatLabelActiveColor: '{surface.500}',
      iconColor: '{surface.500}',
      shadow: 'none',
      transitionDuration: '0.16s',
    },
    content: {
      borderRadius: '{border.radius.xl}',
      background: '#ffffff',
      hoverBackground: '#f2f6f5',
      borderColor: '{surface.200}',
      color: TINTA,
      hoverColor: TINTA,
    },
    list: {
      padding: '0.25rem',
      gap: '1px',
      option: {
        padding: '0.5rem 0.75rem',
        borderRadius: '{border.radius.sm}',
        focusBackground: '{surface.100}',
        selectedBackground: '{highlight.background}',
        selectedFocusBackground: '{highlight.focus.background}',
        color: TINTA,
        focusColor: TINTA,
        selectedColor: '{highlight.color}',
        selectedFocusColor: '{highlight.focus.color}',
        icon: { color: '{surface.500}', focusColor: '{surface.600}' },
      },
      optionGroup: { background: 'transparent', color: TINTA_SECUNDARIA },
    },
    navigation: {
      item: {
        focusBackground: '{surface.100}',
        activeBackground: '{surface.100}',
        color: TINTA,
        focusColor: TINTA,
        activeColor: TINTA,
        icon: { color: '{surface.500}', focusColor: '{surface.600}', activeColor: '{surface.600}' },
      },
      submenuIcon: { color: '{surface.500}', focusColor: '{surface.600}', activeColor: '{surface.600}' },
    },
    overlay: {
      select: {
        borderRadius: '{border.radius.lg}',
        shadow: SOMBRA_MENU,
        background: '#ffffff',
        borderColor: '{surface.200}',
        color: TINTA,
      },
      popover: {
        borderRadius: '{border.radius.lg}',
        padding: '0.75rem',
        shadow: SOMBRA_MENU,
        background: '#ffffff',
        borderColor: '{surface.200}',
        color: TINTA,
      },
      modal: {
        borderRadius: '{border.radius.xl}',
        padding: '1.5rem',
        shadow: SOMBRA_FLOTANTE,
        background: '#ffffff',
        borderColor: '{surface.200}',
        color: TINTA,
      },
      navigation: { shadow: SOMBRA_MENU },
    },
  },
  components: {
    button: {
      root: {
        paddingX: '0.875rem',
        paddingY: '0.5rem',
        label: { fontWeight: '700' },
        sm: { paddingX: '0.625rem', paddingY: '0.3125rem' },
      },
    },
    datatable: {
      headerCell: {
        background: '#ffffff',
        hoverBackground: '{surface.50}',
        color: TINTA_SECUNDARIA,
        padding: '0.625rem 0.875rem',
      },
      columnTitle: { fontWeight: '500', fontSize: '0.8125rem' },
      row: {
        hoverBackground: '#f2f6f5',
        stripedBackground: '{surface.50}',
      },
      bodyCell: { padding: '0.6875rem 0.875rem', borderColor: '{surface.200}' },
      footerCell: { padding: '0.625rem 0.875rem' },
    },
    tabs: {
      tablist: { background: 'transparent', borderColor: '{surface.200}' },
      tab: {
        color: TINTA_SECUNDARIA,
        hoverColor: TINTA,
        activeColor: TINTA,
        padding: '0.75rem 0.25rem',
        margin: '0 1.25rem 0 0',
        fontWeight: '500',
      },
      tabpanel: { background: 'transparent', padding: '0' },
      activeBar: { height: '2px', bottom: '-1px', background: '{primary.color}' },
    },
    dialog: {
      title: { fontSize: '1.125rem', fontWeight: '700' },
    },
    drawer: {
      title: { fontSize: '1.125rem', fontWeight: '700' },
    },
    tooltip: {
      root: {
        maxWidth: '18rem',
        padding: '0.4375rem 0.625rem',
        borderRadius: '{border.radius.md}',
        fontSize: '0.8125rem',
        background: '#0b2224',
        color: '#ffffff',
      },
    },
    toast: {
      root: { width: '24rem', borderRadius: '{border.radius.lg}', blur: '0' },
    },
    progressbar: {
      root: { background: '{surface.200}', borderRadius: '3px', height: '0.375rem' },
    },
    skeleton: {
      root: { background: '{surface.100}', borderRadius: '{border.radius.md}' },
    },
  },
});

import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      colors: {
        // Per-client brand colors are injected as CSS variables by the layout
        // (see `src/app/layout.tsx`). Each var falls back to a sensible neutral
        // when the org's `brand_colors` JSON omits the key.
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          accent: 'var(--brand-accent)',
          background: 'var(--brand-background)',
          text: 'var(--brand-text)',
        },
      },
      fontFamily: {
        sans: ['var(--brand-font-sans)', ...fontFamily.sans],
        serif: ['var(--brand-font-serif)', ...fontFamily.serif],
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('tailwindcss-animate')],
};

export default config;

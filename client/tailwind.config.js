/** @type {import('tailwindcss').Config} */

// Semantic colors resolve through CSS variables in src/index.css. The
// <alpha-value> placeholder is required for opacity modifiers (bg-surface/50);
// without it Tailwind cannot compose alpha onto a var().
const role = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },

      // Components reference these roles, never raw slate/indigo.
      colors: {
        bg: {
          DEFAULT: role('bg'),
          subtle: role('bg-subtle'),
        },
        surface: {
          DEFAULT: role('surface'),
          hover: role('surface-hover'),
        },
        border: {
          DEFAULT: role('border'),
          strong: role('border-strong'),
        },
        text: {
          DEFAULT: role('text'),
          muted: role('text-muted'),
          subtle: role('text-subtle'),
        },
        ring: role('ring'),
        'on-brand': role('on-brand'),

        // Numeric scale retained for gradients and Recharts, which need literals.
        // Prefer the semantic keys in components.
        brand: {
          DEFAULT: role('brand'),
          hover: role('brand-hover'),
          active: role('brand-active'),
          subtle: role('brand-subtle'),
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },

        success: { DEFAULT: role('success'), subtle: role('success-subtle') },
        warning: { DEFAULT: role('warning'), subtle: role('warning-subtle') },
        danger: { DEFAULT: role('danger'), subtle: role('danger-subtle') },
        info: { DEFAULT: role('info'), subtle: role('info-subtle') },
      },

      // Body is 16px so iOS never zooms on input focus.
      fontSize: {
        display: ['3rem', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '700' }],
        h1: ['2rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        h2: ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        h3: ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        body: ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        caption: ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
      },


      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
      },

      // Soft, low-opacity, layered.
      boxShadow: {
        xs: '0 1px 2px 0 rgb(15 23 42 / 0.05)',
        sm: '0 1px 3px 0 rgb(15 23 42 / 0.08), 0 1px 2px -1px rgb(15 23 42 / 0.06)',
        md: '0 4px 6px -1px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.05)',
        lg: '0 10px 15px -3px rgb(15 23 42 / 0.08), 0 4px 6px -4px rgb(15 23 42 / 0.05)',
        xl: '0 20px 25px -5px rgb(15 23 42 / 0.10), 0 8px 10px -6px rgb(15 23 42 / 0.05)',
      },


      transitionDuration: {
        instant: '100ms',
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(.2,0,0,1)',
      },

      // Named layers keep z-index out of the magic-number zone.
      zIndex: {
        nav: '40',
        tabbar: '45',
        overlay: '50',
        dialog: '55',
        toast: '60',
      },

      animation: {
        'fade-in': 'fadeIn 200ms cubic-bezier(.2,0,0,1)',
        'slide-up': 'slideUp 200ms cubic-bezier(.2,0,0,1)',
        'slide-down': 'slideDown 200ms cubic-bezier(.2,0,0,1)',
        'sheet-up': 'sheetUp 300ms cubic-bezier(.2,0,0,1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        sheetUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

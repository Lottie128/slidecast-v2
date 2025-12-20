import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/client/**/*.{ts,tsx}',
    './src/client/pages/**/*.{ts,tsx}',
    './src/client/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        secondary: {
          50: '#faf5ff',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
        },
        accent: {
          50: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [
    plugin(function ({ addBase, addComponents, addUtilities }) {
      addBase({
        '@layer base': {
          'body': {
            '@apply bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50': {},
          },
        },
      });
    }),
  ],
};

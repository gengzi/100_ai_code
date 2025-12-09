/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        yarn: {
          white: '#FFFFFF',
          cream: '#F5F5DC',
          beige: '#F5DEB3',
          brown: '#8B4513',
          pink: '#FFC0CB',
          red: '#DC143C',
          orange: '#FFA500',
          yellow: '#FFD700',
          green: '#228B22',
          blue: '#4169E1',
          purple: '#9370DB',
          gray: '#808080',
          black: '#000000',
        }
      }
    },
  },
  plugins: [],
}
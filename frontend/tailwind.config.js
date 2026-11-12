/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#101B2D',
          secondary: '#18263B',
          light: '#233550'
        },
        'electric-blue': {
          DEFAULT: '#4169E1',
          hover: '#3154C4'
        },
        teal: {
          DEFAULT: '#14B8A6',
          hover: '#0D9488'
        },
        'bg-light': '#F5F7FB',
        amber: {
          DEFAULT: '#F59E0B'
        },
        danger: {
          DEFAULT: '#EF4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}


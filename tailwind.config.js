/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stone: {
          50: '#FAF9F5',
          100: '#F4F1EA',
          200: '#E7E2D6',
          300: '#D5CDBD',
          400: '#A89E8D',
          500: '#7B7160',
          600: '#5A5143',
          700: '#413A30',
          800: '#2A251F',
          900: '#1A1714',
          950: '#100E0C',
        },
        aji: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C', // Naranja Ají característico
          700: '#C2410C', // Rocoto profundo
          800: '#9A3412',
          900: '#7C2D12',
        },
        ink: '#141210',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      letterSpacing: {
        'tightest': '-0.04em',
        'widest-editorial': '0.18em',
      },
      boxShadow: {
        'editorial': '0 20px 40px -15px rgba(26, 23, 20, 0.08)',
        'stamp': '0 2px 0 0 rgba(234, 88, 12, 0.4)',
      }
    },
  },
  plugins: [],
}

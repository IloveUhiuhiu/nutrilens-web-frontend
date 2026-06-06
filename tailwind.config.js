/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#faf9f4',
        surface: '#ffffff',
        muted: '#efeee9',
        primary: '#006d36',
        primaryContainer: '#50c878',
        primarySoft: '#e0f4e9',
        secondary: '#396756',
        accent: '#d97706',
        ink: '#1b1c19',
        subtle: '#5d685e',
        border: '#d8ded4',
        danger: '#ba1a1a',
      },
      boxShadow: {
        panel: '0 18px 60px -30px rgba(0, 109, 54, 0.32)',
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

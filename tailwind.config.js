/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Canvas & surfaces
        background: '#F4F7F5',
        surface: '#ffffff',
        muted: '#eaf0ec',
        // Primary palette — Deep Forest Jade (mobile token)
        primary: '#1B4332',
        primaryContainer: '#40916C',
        primarySoft: '#d8ede3',
        // Success / Mint Green (nutritional zones)
        mint: '#40916C',
        mintSoft: '#d8ede3',
        // Secondary
        secondary: '#2D6A4F',
        // Action / Amber
        accent: '#FF9F1C',
        accentSoft: '#fff3e0',
        // Danger / Crimson
        danger: '#E63946',
        dangerSoft: '#fde8ea',
        // Typography
        ink: '#1b1c19',
        subtle: '#4a5c50',
        // Borders
        border: '#ccd8cc',
      },
      boxShadow: {
        // 4% opacity Forest Jade drop-shadow (Bento premium)
        panel: '0 4px 24px -6px rgba(27, 67, 50, 0.10), 0 1px 4px -1px rgba(27, 67, 50, 0.06)',
        card: '0 2px 12px -4px rgba(27, 67, 50, 0.08)',
        drawer: '0 0 40px -8px rgba(27, 67, 50, 0.20)',
      },
      borderRadius: {
        card: '12px',
        modal: '16px',
        xl: '12px',
        '2xl': '16px',
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.72rem', { lineHeight: '1.1rem' }],
        sm: ['0.83rem', { lineHeight: '1.35rem' }],
      },
    },
  },
  plugins: [],
}

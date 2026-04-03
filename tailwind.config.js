/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        night: {
          50: '#f0f0ff',
          100: '#e1e1f5',
          200: '#c3c3eb',
          300: '#9494d6',
          400: '#6b6bba',
          500: '#4a4a9e',
          600: '#363682',
          700: '#252566',
          800: '#1a1a4a',
          900: '#0d0d2e',
          950: '#07071a',
        },
        gold: {
          300: '#f5d78a',
          400: '#f0c75a',
          500: '#d4a853',
          600: '#b8882e',
          700: '#8f6820',
        },
        coral: {
          400: '#ff8080',
          500: '#e05c5c',
          600: '#c04040',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pulseGold: { '0%, 100%': { boxShadow: '0 0 0 0 rgba(212,168,83,0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(212,168,83,0)' } },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'gold': '0 0 20px rgba(212, 168, 83, 0.3)',
        'inner-dark': 'inset 0 2px 8px rgba(0,0,0,0.5)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'glow': '0 0 40px rgba(212, 168, 83, 0.15)',
      }
    },
  },
  plugins: [],
}

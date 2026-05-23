/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['"Space Grotesk"', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(212, 175, 55, 0.2), 0 0 80px rgba(223, 186, 107, 0.1)',
        'glow-strong': '0 0 30px rgba(212, 175, 55, 0.35), 0 0 60px rgba(26, 26, 26, 0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'zoom-slow': 'zoom 20s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(0.5deg)' },
        },
        zoom: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' },
        }
      }
    },
  },
  plugins: [],
};

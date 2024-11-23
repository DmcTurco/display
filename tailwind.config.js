/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        slideDown: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        slideUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        }
      },
      animation: {
        slideDown: 'slideDown 0.2s ease-out',
        slideUp: 'slideUp 0.2s ease-out',
        slideDownFast: 'slideDown 0.1s ease-out',
        slideDownSlow: 'slideDown 0.3s ease-out',
      }
    },
  },
  plugins: [],
}
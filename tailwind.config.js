/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#1A5AFF',
        'secondary': '#605be5',
        'purple': '#4E00FE',
        'dark-purple': '#500C89',
        'nxt-primary': '#084BF9',
        'nxt-secondary': '#605be5',
        'light-gray': '#F5F5F5',
        
        'button': {
          'primary': '#1A5AFF',
          'secondary': '#605be5',
          'success': '#008000',
          'error': '#FF0000',
          'warning': '#FFA500',
          'white': '#FFFFFF',
        },
        
        'text': {
          'primary': '#000000',
          'secondary': '#FFFFFF',
          'success': '#FFFFFF',
          'error': '#FFFFFF',
          'white': '#FFFFFF',
        }
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      keyframes: {
        'fade-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-out': {
          '0%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(-10px)',
          },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-in',
      },
    },
  },
  plugins: [],
}


export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      animation: {
        'toast-enter': 'toast-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'toast-exit': 'toast-exit 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        'toast-enter': {
          '0%': { 
            transform: 'translate3d(0, 100%, 0) rotate(3deg)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translate3d(0, 0, 0) rotate(0)',
            opacity: '1'
          }
        },
        'toast-exit': {
          '0%': { 
            transform: 'translate3d(0, 0, 0) rotate(0)',
            opacity: '1'
          },
          '100%': { 
            transform: 'translate3d(100px, 20%, 0) rotate(-3deg)',
            opacity: '0'
          }
        }
      }
    }
  }
}
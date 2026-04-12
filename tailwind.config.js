/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: '#7A8C6E',
          light:   '#A8B89A',
          dark:    '#4A5E40',
          mist:    '#D4DCCC',
        },
        blush: {
          DEFAULT: '#E8B4B8',
          light:   '#F4D6D8',
          dark:    '#C98088',
        },
        dustyRose: {
          DEFAULT: '#C47E85',
          light:   '#D9A8AC',
          dark:    '#9A5A60',
        },
        ivory: {
          DEFAULT: '#F8F3EC',
          light:   '#FDFAF6',
          dark:    '#EDE4D8',
        },
        warmGreen: {
          DEFAULT: '#5C7A4E',
          light:   '#84A472',
          dark:    '#3A5030',
        },
        bark: {
          DEFAULT: '#4A3728',
          light:   '#6B5242',
          dark:    '#2A1F18',
        },
        gold: {
          DEFAULT: '#C9A87C',
          light:   '#DBBF96',
          dark:    '#A08050',
        },
      },
      fontFamily: {
        serif:  ['"Cormorant Garamond"', 'Georgia', 'serif'],
        script: ['"Dancing Script"', 'cursive'],
        sans:   ['"Lato"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'petal-drift': 'petalDrift 8s ease-in-out infinite',
        'fade-up':     'fadeUp 0.8s ease forwards',
        'bloom':       'bloom 1.2s ease forwards',
        'pulse-slow':  'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        petalDrift: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%':  { transform: 'translateY(-12px) rotate(8deg)' },
          '66%':  { transform: 'translateY(-6px) rotate(-5deg)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        bloom: {
          from: { opacity: '0', transform: 'scale(0.85)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },
      backgroundImage: {
        'garden-gradient': 'linear-gradient(160deg, #F8F3EC 0%, #D4DCCC 50%, #F4D6D8 100%)',
        'hero-vignette':   'radial-gradient(ellipse at center, rgba(58,80,48,0.05) 0%, rgba(30,50,25,0.75) 100%)',
      },
    },
  },
  plugins: [],
}

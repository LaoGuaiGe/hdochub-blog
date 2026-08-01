import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './stores/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        white: '#FFFFFF',
        red: {
          DEFAULT: '#FF0000'
        },
        yellow: {
          DEFAULT: '#FFFF00'
        },
        green: {
          DEFAULT: '#008000'
        },
        blue: {
          DEFAULT: '#0000FF'
        },
        ink: {
          900: '#1A1A1A',
          700: '#4D4D4D',
          500: '#808080',
          300: '#B3B3B3',
          200: '#E0E0E0',
          100: '#F5F5F5'
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', "'SF Mono'", 'Menlo', 'Consolas', "'Liberation Mono'", "'Courier New'", 'monospace'],
        sans: ["'Helvetica Neue'", 'Arial', "'PingFang SC'", "'Microsoft YaHei'", 'sans-serif']
      },
      borderRadius: {
        none: '0',
        DEFAULT: '0',
        sm: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        full: '0'
      },
      boxShadow: {
        none: 'none',
        DEFAULT: 'none',
        sm: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        inner: 'none'
      },
      transitionDuration: {
        DEFAULT: '0.05s',
        fast: '0.05s'
      },
      transitionTimingFunction: {
        DEFAULT: 'linear'
      },
      fontSize: {
        'caption': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.02em' }],
        'tiny': ['0.6875rem', { lineHeight: '1.4' }],
        'small': ['0.8125rem', { lineHeight: '1.5' }],
        'body-ui': ['0.9375rem', { lineHeight: '1.5' }],
        'body': ['1rem', { lineHeight: '1.7' }],
        'h6': ['1rem', { lineHeight: '1.4' }],
        'h5': ['1.125rem', { lineHeight: '1.4' }],
        'h4': ['1.25rem', { lineHeight: '1.35' }],
        'h3': ['1.5rem', { lineHeight: '1.3' }],
        'h2': ['2rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'h1': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }]
      },
      borderWidth: {
        DEFAULT: '2px',
        '0': '0',
        '1': '1px',
        '2': '2px',
        '3': '3px',
        '4': '4px'
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
        '16': '64px'
      },
      maxWidth: {
        'content': '680px',
        'list': '1200px',
        'admin': '1280px',
        'search': '800px'
      }
    }
  },
  corePlugins: {
    preflight: true
  },
  plugins: []
}

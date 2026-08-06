/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        panel: 'rgb(var(--color-panel) / <alpha-value>)',
        'panel-2': 'rgb(var(--color-panel-2) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        'text-dim': 'rgb(var(--color-text-dim) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        profit: 'rgb(var(--color-profit) / <alpha-value>)',
        long: 'rgb(var(--color-profit) / <alpha-value>)',
        loss: 'rgb(var(--color-loss) / <alpha-value>)',
        short: 'rgb(var(--color-loss) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}

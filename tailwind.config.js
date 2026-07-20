/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0D12',
        panel: '#12161D',
        'panel-2': '#1A1F28',
        border: '#262C38',
        text: '#E7EBF0',
        'text-dim': '#8B96AC',
        accent: '#4D8DF7',
        profit: '#22C58B',
        long: '#22C58B',
        loss: '#F0555F',
        short: '#F0555F',
        warning: '#F4B860',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}

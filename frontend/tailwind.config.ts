import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FCFAF9',
        surface: '#FFFFFF',
        'surface-muted': '#FAF7F5',
        'text-primary': '#0F172A',
        'text-secondary': '#475569',
        accent: {
          DEFAULT: '#F85E75',
          600: '#E24A62',
        },
        success: '#16A34A',
        caution: '#F59E0B',
        border: '#E9E1DC',
        ring: '#F5C2CB',
        'neutral-200': '#EEE7E2',
        // Dark mode colors
        dark: {
          background: '#0B0B0C',
          surface: '#141416',
          'surface-muted': '#1A1A1C',
          text: '#FFFFFF',
          'text-secondary': '#A3A3A3',
          border: '#222225',
          accent: '#FF6B86',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      animation: {
        'fade-in': 'fadeIn 0.18s ease-out',
        'slide-up': 'slideUp 0.22s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(6px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }: any) {
      addUtilities({
        '.focus-ring': {
          '@apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background': {},
        },
        '.hit-target': {
          '@apply min-h-[44px] flex items-center': {},
        },
      });
    },
  ],
};

export default config;
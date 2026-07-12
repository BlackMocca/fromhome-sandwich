import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      screens: {
        xs: { min: '400px', max: '639px' },
      },
      colors: {
        // Design tokens from DESIGN.md — From Home Sandwich palette
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#695848',
          light: '#7d6a58',
          dark: '#574739',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        action: {
          DEFAULT: '#e0b554',
          light: '#ebc873',
          dark: '#d1a23f',
        },
        success: {
          DEFAULT: '#5e845a',
          light: '#6f966b',
          dark: '#4e724a',
        },
        destructive: {
          DEFAULT: '#d9827a',
          foreground: '#ffffff',
        },
        surface: '#f9f8f8',
        border: 'hsl(var(--border))',
      },
      fontFamily: {
        kanit: ['var(--font-kanit)', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.5rem', // 8px — standard shadcn/ui radius
        md: '0.375rem',
        sm: '0.25rem',
      },
      spacing: {
        // Tailwind spacing scale (4–24px)
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;

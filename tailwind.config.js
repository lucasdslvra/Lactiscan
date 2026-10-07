const { hairlineWidth } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // « Étiquette » visual system from the MilkApp mockup. Mirrored in `LABEL` (src/lib/theme.ts).
      fontFamily: {
        display: ['BigShouldersDisplay_900Black'],
        'display-bold': ['BigShouldersDisplay_800ExtraBold'],
        body: ['AtkinsonHyperlegibleNext_400Regular'],
        'body-bold': ['AtkinsonHyperlegibleNext_700Bold'],
        mono: ['AtkinsonHyperlegibleMono_400Regular'],
        'mono-semibold': ['AtkinsonHyperlegibleMono_600SemiBold'],
      },
      colors: {
        paper: { DEFAULT: '#F3EFE6', dim: '#E9E3D6', hatch: '#E2DACA' },
        field: '#FFFDF7',
        ink: { DEFAULT: '#17150F', muted: '#4A463C', soft: '#CFC9BC' },
        scanline: '#FF5A3C',
        link: '#1E3FAE',
        // Dairy ingredients highlighted in the list.
        mark: { DEFAULT: '#F6D3CC', ink: '#7A1A10' },
        verdict: {
          milk: { DEFAULT: '#B0281C', fg: '#FBF7EE', rule: '#E7A69D' },
          lactose: '#E8AE2E',
          traces: '#F4C095',
          free: '#A9CBF7',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [require('tailwindcss-animate')],
};

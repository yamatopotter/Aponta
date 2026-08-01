import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Paleta "Botânico Farmacêutico" — ver docs/ARQUITETURA.md e a proposta
        // de identidade visual aprovada (musgo = Ponto, ameixa = Chamados/RH).
        // Tokens estáticos usados pelos componentes já existentes no app:
        ink: '#1E241D',
        inksoft: '#5C6456',
        line: '#E2E1D3',
        info: { DEFAULT: '#3E6B7A', soft: '#DCE8EA' },
        // DEFAULT escurecido: o tom antigo (#B7863A) sobre warn.soft media 2.56:1,
        // bem abaixo do mínimo 4.5:1 da WCAG AA — este mede 5.47:1.
        warn: { DEFAULT: '#745425', soft: '#F1E3CC' },
        sidebar: '#2C3A28',

        // Tokens via CSS variable (src/app/globals.css) — usados pelos
        // componentes shadcn/ui em src/components/ui, e também disponíveis
        // para o resto do app (bg-primary, text-foreground, border-border...).
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          soft: '#E3E9DD',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          soft: '#EEDFE6',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        danger: { DEFAULT: 'hsl(var(--destructive))', soft: '#F2DCD5' },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      borderRadius: {
        xl2: '18px',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;

import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#16241F',
        inksoft: '#5B6B63',
        line: '#E1E8E3',
        primary: { DEFAULT: '#0B6E4F', soft: '#DCEFE6' },
        info: { DEFAULT: '#2A6F97', soft: '#DCEAF2' },
        warn: { DEFAULT: '#B8790E', soft: '#F6E7CF' },
        danger: { DEFAULT: '#B23A2E', soft: '#F6DCD8' },
        muted: '#F3F5F3',
        sidebar: '#122A22',
      },
      borderRadius: {
        xl2: '18px',
      },
    },
  },
  plugins: [],
};

export default config;

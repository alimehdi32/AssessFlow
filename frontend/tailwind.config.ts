import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#E8501A', hover: '#D04517' },
        navy: '#1E1E2E',
        sidebar: '#FFFFFF',
        'content-bg': '#F5F5F5',
        accent: '#7C3AED',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      borderRadius: { card: '12px', btn: '8px', pill: '24px' },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
export default config

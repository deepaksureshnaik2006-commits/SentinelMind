/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#070D18',
          card: '#0B1422',
          elevated: '#101D2E',
          border: '#168DCE',
          blue: '#38BDF8',
          cyan: '#22D3EE',
          violet: '#A78BFA',
          emerald: '#34D399',
          amber: '#FBBF24',
          coral: '#FB7185',
          text: '#E2F3FF',
          muted: '#8BA8C2',
          glow: 'rgba(56, 189, 248, 0.25)',
        },
        background: {
          DEFAULT: '#070D18',
          secondary: '#0B1422',
          card: '#0B1422',
          hover: '#101D2E',
          border: '#168DCE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};

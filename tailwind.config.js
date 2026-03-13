/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0A0C17',
          2: '#12152A',
          3: '#1C2040',
          4: '#22264A',
        },
        gold: {
          DEFAULT: '#C9A84C',
          dim: 'rgba(201,168,76,0.4)',
          bg: 'rgba(201,168,76,0.06)',
        },
        cream: '#F5F0E8',
        muted: {
          DEFAULT: '#8A8FA8',
          2: '#5A5F78',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Lora', 'Georgia', 'serif'],
        ui: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

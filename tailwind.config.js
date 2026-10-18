/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#1a1412',
          card: '#2a1f1c',
          text: {
            primary: '#e6d5c8',
            secondary: '#cbbba8', // Increased brightness for 4.5:1+ contrast
          },
          accent: '#d4a574',
        }
      }
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F5F7FF',
          100: '#EBF0FF',
          500: '#4747C4',
          600: '#3838A8',
          700: '#2C2E8C',
          900: '#1A1A2E',
        },
        accent: {
          400: '#33C4C4',
          500: '#00B4B4',
          600: '#009999',
          700: '#008080',
        },
        cream: {
          50: '#FAF8F5',
          100: '#F3EFEA',
          200: '#E6DFD5',
          300: '#D8CFC0',
          800: '#2A2825',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
};

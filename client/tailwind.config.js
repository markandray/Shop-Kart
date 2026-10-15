/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      colors: {
        ink: '#1C1B19',
        paper: '#FBF9F5',
        moss: '#2F5D50',
        mossDark: '#1E3F36',
        saffron: '#E1A73A',
        clay: '#B4552E',
        line: '#E4E0D6',
      },
      boxShadow: {
        card: '0 1px 0 0 #E4E0D6',
      },
    },
  },
  plugins: [],
}

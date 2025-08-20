export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
theme: {
  extend: {},
  container: {
    center: true,  // Centers the container horizontally
    padding: '1rem', // Adds padding on the sides
screens: {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px', // custom for very large screens
},
  },
},
  plugins: [],
}

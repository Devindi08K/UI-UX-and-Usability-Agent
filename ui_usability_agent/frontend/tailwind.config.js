/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00FFFF', // Cyan
        secondary: '#FFFFFF', // White
        accent: '#000000', // Black
        neutral: '#F3F4F6', // Light gray
        'cyan-dark': '#00BFFF', // Dark cyan
        'gray-dark': '#374151', // Dark gray
      },
    },
  },
  plugins: [],
}
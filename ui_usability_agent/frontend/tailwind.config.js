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
        // Dark theme with cyan accents
        'dark-bg': '#0f172a', // Deep navy background
        'dark-card': '#1e293b', // Dark slate for cards
        'dark-hover': '#334155', // Lighter slate for hover
        primary: '#06b6d4', // Vibrant cyan
        'primary-light': '#22d3ee', // Light cyan
        'primary-dark': '#0891b2', // Dark cyan
        secondary: '#e2e8f0', // Light gray/white
        accent: '#f0f9fa', // Very light cyan tint
        neutral: '#64748b', // Medium gray
        'text-primary': '#f1f5f9', // Nearly white text
        'text-secondary': '#cbd5e1', // Light gray text
        'text-dark-bg': '#ffffff', // White text for dark backgrounds
      },
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#6366f1', // Indigo
        secondary: '#ec4899', // Pink
        accent: '#8b5cf6', // Violet
        bg: '#f8fafc',
        surface: '#ffffff',
        cat40: '#3b82f6', // Needs - Blue
        cat30: '#a855f7', // Wants - Purple
        cat20: '#22c55e', // Savings - Green
        cat10: '#f97316', // Giving - Orange
      }
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#10B981', // Emerald 500
        'primary-focus': '#059669', // Emerald 600
        'background': '#111827', // Gray 900
        'surface': '#1F2937', // Gray 800
        'on-surface': '#F9FAFB', // Gray 50
        'on-surface-secondary': '#9CA3AF', // Gray 400
      },
    },
  },
  plugins: [],
}

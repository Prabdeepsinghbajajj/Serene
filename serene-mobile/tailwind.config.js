/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'slate-primary': '#1A1A18',
        'slate-2': '#222220',
        'cream': '#F5F0E8',
        'cream-2': '#EDE5D4',
        'sage-50': '#EEF5EB',
        'sage-100': '#D0E8C8',
        'sage-300': '#8ABD80',
        'sage-500': '#4E7A44',
        'sage-700': '#2F5027',
        'amber': '#D4883A',
      },
    },
  },
  plugins: [],
}

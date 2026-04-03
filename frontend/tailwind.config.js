/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold:   { DEFAULT: "#D4A017", light: "#F5E6C8", dark: "#8B6914" },
        silver: { DEFAULT: "#A8A9AD", light: "#E8E8EA", dark: "#6B6C6F" },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

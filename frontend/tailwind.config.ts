/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        signal: {
          blue: "#2c6bed",
          "blue-hover": "#2459c7",
          green: "#00a884",
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', '"Helvetica Neue"', "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: {
        bubble: "0 1px 0.5px rgba(0,0,0,0.13)",
      },
    },
  },
  plugins: [],
};

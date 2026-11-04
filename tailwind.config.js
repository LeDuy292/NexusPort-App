/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "signal": "#ff682c",
        "signal-orange": "#ff682c",
        "carbon": "#080808",
        "graphite": "#1a1a1a",
        "surface": "#141414",
        "border": "rgba(255,255,255,0.08)",
        "muted": "rgba(255,255,255,0.4)",
        "paper": "#ffffff",
        "success": "#48bb78",
        "warning": "#f6ad55",
        "error": "#fc5b5b",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["SpaceGrotesk", "sans-serif"],
      },
    },
  },
  plugins: [],
};

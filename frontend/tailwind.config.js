/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // Enables class-based dark mode
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f4ff",
          100: "#d9e2ff",
          500: "#4f46e5", // Indigo accent
          600: "#4338ca",
          700: "#3730a3",
        },
        dark: {
          50: "#1e293b",
          100: "#0f172a",
          200: "#020617", // Pure dark deep glass base
        }
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
      },
      keyframes: {
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" }
        }
      }
    },
  },
  plugins: [],
}

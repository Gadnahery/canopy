/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light theme palette for CANOPIX (requested exact values)
        base:    "#F5F7F4", // main background
        "bg-light": "#F1F8F2",
        surface: "#FFFFFF", // card/surface
        raised:  "#FFFFFF",
        line:    "#DDE7DE", // border
        text: {
          DEFAULT: "#263238", // primary text
          secondary: "#607D8B",
        },
        primary: {
          DEFAULT: "#1B5E20", // Primary Forest Green
          600: "#2E7D32", // Secondary Green (also success)
          300: "#8BC34A", // Accent/Lime
        },
        success: "#2E7D32",
        warning: "#F9A825",
        error: "#C62828",
        forest: {
          50: "#F1F8F2",
          100: "#E6F3E8",
          200: "#CFE7CF",
          300: "#8BC34A",
          400: "#5DA34A",
          500: "#1B5E20",
          600: "#2E7D32",
          700: "#225B25",
          800: "#1A4A1B",
          900: "#143813",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(34,197,94,0.15), 0 8px 30px -10px rgba(34,197,94,0.25)",
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 24px 48px -28px rgba(0,0,0,0.8)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: 0, transform: "translateY(8px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        "pulse-ring": { "0%": { boxShadow: "0 0 0 0 rgba(34,197,94,0.5)" }, "70%": { boxShadow: "0 0 0 8px rgba(34,197,94,0)" }, "100%": { boxShadow: "0 0 0 0 rgba(34,197,94,0)" } },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease both",
        "pulse-ring": "pulse-ring 2s infinite",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // near-black surfaces with a faint green tint
        base:    "#070b09",
        surface: "#0d1310",
        raised:  "#121a15",
        line:    "#1e2a22",
        // forest green ramp (accent)
        forest: {
          50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac",
          400: "#4ade80", 500: "#22c55e", 600: "#16a34a", 700: "#15803d",
          800: "#166534", 900: "#14532d", 950: "#052e16",
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

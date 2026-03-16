import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070A12",
        panel: "#111828",
        accent: "#7A8BFF",
        mint: "#6EE7D7"
      },
      boxShadow: {
        glow: "0 0 80px rgba(122,139,255,0.25)"
      }
    }
  },
  plugins: []
};

export default config;

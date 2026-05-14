import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core backgrounds
        stadium: "#0A0705",   // Deep dark chocolate black
        surface: "#140E0A",   // Dark surface
        // Brand accents
        primary: "#FF6B35",   // Vibrant orange
        "primary-dark": "#CC4A1E",
        glow: "#FF8C42",      // Warm amber glow
        accent: "#F97316",    // Secondary orange
        // Text
        "text-primary": "#F0F4FF",    // Near-white
        "text-secondary": "#8B99B5",  // Muted blue-grey
        // Semantic
        success: "#22C55E",   
        warning: "#F59E0B",   
        danger: "#EF4444",    
        neutral: "#6B7280",   
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"], 
        heading: ["Plus Jakarta Sans", "sans-serif"], 
        body: ["Plus Jakarta Sans", "sans-serif"],    
        mono: ["DM Mono", "monospace"],               
      },
      borderRadius: {
        pill: "9999px",
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        card: "0 0 24px rgba(255, 107, 53, 0.1)",
        "card-hover": "0 0 36px rgba(255, 107, 53, 0.2)",
        primary: "0 0 24px rgba(255, 107, 53, 0.3)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 16px rgba(255, 140, 66, 0.15)" },
          "50%": { boxShadow: "0 0 32px rgba(255, 140, 66, 0.4)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-150%) skewX(-20deg)" },
          "100%": { transform: "translateX(250%) skewX(-20deg)" },
        },
        "text-gradient": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        }
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        shimmer: "shimmer 2.5s ease-in-out infinite",
        "text-gradient": "text-gradient 4s ease infinite",
        "pulse-slow": "pulse-slow 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;

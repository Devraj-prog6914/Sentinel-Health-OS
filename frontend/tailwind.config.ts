import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        card: "var(--card-bg)",
        "card-hover": "var(--card-hover-bg)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
        },
        risk: {
          low: "var(--risk-low)",
          medium: "var(--risk-medium)",
          high: "var(--risk-high)",
          critical: "var(--risk-critical)",
        },
        ai: {
          DEFAULT: "var(--ai-brand)",
          glow: "var(--ai-glow)",
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)",
        "glass-card": "linear-gradient(180deg, rgba(16, 17, 20, 0.7) 0%, rgba(10, 11, 13, 0.9) 100%)",
        "neon-glow": "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)"
      },
      boxShadow: {
        "glass-glow": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "neon-pulse": "0 0 15px rgba(244, 63, 94, 0.4)",
        "ai-pulse": "0 0 20px rgba(99, 102, 241, 0.3)"
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glowPulse 2s infinite ease-in-out",
        "wave-breath": "waveBreath 1.5s infinite ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "scale-in": "scaleIn 0.3s ease-out"
      },
      keyframes: {
        glowPulse: {
          "0%, 100%": { opacity: "0.2", filter: "blur(8px)" },
          "50%": { opacity: "0.6", filter: "blur(12px)" }
        },
        waveBreath: {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1.0)" }
        },
        slideUp: {
          "0%": { transform: "translateY(15px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        scaleIn: {
          "0%": { transform: "scale(0.96)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" }
        }
      }
    },
  },
  plugins: [],
};

export default config;

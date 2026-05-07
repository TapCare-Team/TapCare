import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f5f1e8",
        ink: "#1f2933",
        accent: "#1f6f78",
        accentSoft: "#dcefee",
        alert: "#c05621",
        success: "#276749",
        muted: "#6b7280",
        panel: "#fffdf8"
      },
      boxShadow: {
        panel: "0 16px 40px rgba(31, 41, 51, 0.08)"
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;

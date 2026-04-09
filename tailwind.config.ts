import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ef2987",
        dark: "#282828",
        light: "#f4f2f7",
        blue: "#4d61f4",
        text: "#1a1a1a",
        muted: "#5d5d5d",
        accent: "#ffbe30",
      },
      boxShadow: {
        soft: "0 16px 48px rgba(0, 0, 0, 0.12)",
      },
      maxWidth: {
        content: "1200px",
      },
      fontFamily: {
        sans: [
          "var(--font-primary)",
          "Poppins",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;

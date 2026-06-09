import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: "#0f172a",
        "sidebar-hover": "#1e293b",
        "sidebar-active": "#4f46e5",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

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
        lavender: "#eac2ff",
        "electric-blue": "#e0f2fe",
        "deep-purple": {
          DEFAULT: "#0f0a1f",
          surface: "#1a103c",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist)", "sans-serif"],
        display: ["var(--font-dm-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

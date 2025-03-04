import type { Config } from "tailwindcss";
import scrollbarHide from 'tailwind-scrollbar-hide'

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Kanit', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        action: "var(--action)",
        success: "var(--success)",
        error: "var(--error)",
      },
    },
  },
  plugins: [
    scrollbarHide
  ],
} satisfies Config;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // 鲸纬品牌色系
        earth: { 50: "#fdf6ee", 100: "#f5e6c8", 200: "#e8c78a", 300: "#d4a34f", 400: "#c28a2e", 500: "#a06e1e", 600: "#7d5517", 700: "#5e4013", 800: "#4a3310", 900: "#3a280d" },
        forest: { 50: "#edf7f0", 100: "#d0ebd7", 200: "#a3d7b3", 300: "#6fbc89", 400: "#439f67", 500: "#2d7d4e", 600: "#23633e", 700: "#1d4e31", 800: "#173d27", 900: "#112e1d" },
        sky: { 50: "#eef6fb", 100: "#d4e8f4", 200: "#b0d2ea", 300: "#7fb5db", 400: "#5297c9", 500: "#367cb3", 600: "#286297", 700: "#1f4d78", 800: "#1b3f61", 900: "#183450" },
        // 保留的基础色
        surface: "#faf8f5",
        "surface-container-low": "#f5f2ed",
        "surface-container": "#efebe6",
        "surface-variant": "#e2ddd7",
        "on-surface": "#1a1c1e",
        "on-surface-variant": "#49453f",
        background: "#faf8f5",
        "on-background": "#1a1c1e",
        "outline-variant": "#cfc9c0",
        outline: "#857a71",
        error: "#c62828",
        "error-container": "#ffcdd2",
        "on-error": "#ffffff",
        "on-error-container": "#410002",
        // 主色 — 以森林绿为品牌色
        primary: "#2d7d4e",
        "primary-container": "#a3d7b3",
        "on-primary": "#ffffff",
        "on-primary-container": "#0a2e1a",
        // 辅助 — 天蓝
        secondary: "#367cb3",
        "secondary-container": "#b0d2ea",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#0a2e4a",
        // 强调 — 土红
        tertiary: "#c28a2e",
        "tertiary-container": "#f5e6c8",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#3a280d",
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
      },
      spacing: {
        "stack-lg": "24px",
        "margin-mobile": "20px",
        unit: "4px",
        "stack-sm": "8px",
        "stack-md": "16px",
        gutter: "12px",
      },
      fontFamily: {
        "headline-lg-mobile": ["Plus Jakarta Sans", "sans-serif"],
        "label-sm": ["Plus Jakarta Sans", "sans-serif"],
        "label-md": ["Plus Jakarta Sans", "sans-serif"],
        "headline-xl": ["Plus Jakarta Sans", "sans-serif"],
        "headline-lg": ["Plus Jakarta Sans", "sans-serif"],
        "body-lg": ["Be Vietnam Pro", "sans-serif"],
        "body-md": ["Be Vietnam Pro", "sans-serif"],
      },
      fontSize: {
        "headline-lg-mobile": ["22px", { lineHeight: "28px", fontWeight: "700" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "700" }],
        "label-md": ["14px", { lineHeight: "20px", fontWeight: "600" }],
        "headline-xl": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "800" }],
        "headline-lg": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
      },
    },
  },
  plugins: [],
}

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "background": "#0b1326",
        "on-primary-fixed": "#23005c",
        "error-container": "#93000a",
        "surface-tint": "#d0bcff",
        "secondary-fixed": "#c9e6ff",
        "outline-variant": "#494454",
        "inverse-primary": "#6d3bd7",
        "on-surface": "#dae2fd",
        "tertiary": "#e2c62d",
        "surface-bright": "#31394d",
        "on-tertiary-fixed-variant": "#524600",
        "tertiary-container": "#c4ab01",
        "on-secondary-fixed": "#001e2f",
        "primary": "#d0bcff",
        "surface-container-highest": "#2d3449",
        "surface-variant": "#2d3449",
        "surface-container-low": "#131b2e",
        "secondary-container": "#00a2e6",
        "primary-fixed": "#e9ddff",
        "surface-container-lowest": "#060e20",
        "inverse-surface": "#dae2fd",
        "surface-dim": "#0b1326",
        "surface": "#0b1326",
        "surface-container-high": "#222a3d",
        "surface-container": "#171f33",
        "inverse-on-surface": "#283044",
        "on-primary-fixed-variant": "#5516be",
        "on-primary": "#3c0091",
        "on-secondary-container": "#00344e",
        "tertiary-fixed": "#ffe24c",
        "outline": "#958ea0",
        "on-background": "#dae2fd",
        "on-error-container": "#ffdad6",
        "on-primary-container": "#340080",
        "on-surface-variant": "#cbc3d7",
        "on-tertiary-fixed": "#211b00",
        "on-secondary": "#00344d",
        "primary-fixed-dim": "#d0bcff",
        "secondary": "#89ceff",
        "on-tertiary": "#393000",
        "secondary-fixed-dim": "#89ceff",
        "error": "#ffb4ab",
        "on-error": "#690005",
        "on-secondary-fixed-variant": "#004c6e",
        "primary-container": "#a078ff",
        "on-tertiary-container": "#4a3f00",
        "tertiary-fixed-dim": "#e2c62d"
      },
      borderRadius: {
        "DEFAULT": "1rem",
        "lg": "2rem",
        "xl": "3rem",
        "full": "9999px"
      },
      spacing: {
        "card-gap": "24px",
        "container-padding": "24px",
        "base": "8px",
        "gutter": "20px",
        "safe": "env(safe-area-inset-bottom, 20px)"
      },
      fontFamily: {
        "body-lg": ["Plus Jakarta Sans"],
        "headline-md": ["Quicksand"],
        "headline-lg": ["Quicksand"],
        "body-md": ["Plus Jakarta Sans"],
        "label-sm": ["Plus Jakarta Sans"],
        "display-lg": ["Quicksand"],
        "label-md": ["Plus Jakarta Sans"]
      },
      fontSize: {
        "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}],
        "headline-md": ["24px", {"lineHeight": "1.3", "fontWeight": "600"}],
        "headline-lg": ["32px", {"lineHeight": "1.2", "fontWeight": "700"}],
        "body-md": ["16px", {"lineHeight": "1.5", "fontWeight": "400"}],
        "label-sm": ["12px", {"lineHeight": "1.2", "fontWeight": "700"}],
        "display-lg": ["48px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700"}],
        "label-md": ["14px", {"lineHeight": "1.4", "letterSpacing": "0.01em", "fontWeight": "600"}]
      }
    },
  },
  plugins: [],
};
export default config;

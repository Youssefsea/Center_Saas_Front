import type { Config } from "tailwindcss";
import rtl from "tailwindcss-rtl";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  plugins: [rtl],
};

export default config;

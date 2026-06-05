import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 12px 28px rgba(24, 24, 27, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

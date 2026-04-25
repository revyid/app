import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: './',
  plugins: [
    // kimi-plugin-inspect-react is dev-only; skip in production build
    ...(command === 'serve' ? [require('kimi-plugin-inspect-react').inspectAttr()] : []),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: [
      '.trycloudflare.com'
    ]
  }
}));

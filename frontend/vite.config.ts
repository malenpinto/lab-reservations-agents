import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react(), tailwindcss()],
  server: {
    proxy: { "/api": "http://localhost:3000" },
  },
  build: { outDir: "../dist/frontend", emptyOutDir: true },
});

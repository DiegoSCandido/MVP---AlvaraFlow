import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5173,
    // Em desenvolvimento o frontend chama /api e o Vite encaminha para a API,
    // evitando CORS e mantendo a mesma origem do build de producao.
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY ?? "http://localhost:3333",
        changeOrigin: true,
      },
    },
  },
});

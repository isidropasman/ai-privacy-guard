import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const apiTarget =
  (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env?.API_URL ?? "http://localhost:8787";

export default defineConfig({
  plugins: [react()],
  // La landing ocupa la raíz del dominio, así que el dashboard cuelga de
  // /dashboard y sus assets tienen que resolverse contra ese prefijo.
  base: "/dashboard/",
  server: {
    port: 5173,
    // El dashboard y el API comparten origen en producción. En desarrollo el
    // proxy reproduce esa condición, así la cookie de sesión funciona igual y
    // no hace falta CORS ni credenciales cross-site.
    proxy: {
      "/admin": { target: apiTarget, changeOrigin: false },
      "/health": { target: apiTarget, changeOrigin: false },
    },
  },
});

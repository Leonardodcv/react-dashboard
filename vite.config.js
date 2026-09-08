import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuración mínima de Vite: solo necesitamos el plugin de React
// para soportar JSX y Fast Refresh durante el desarrollo.
export default defineConfig({
  plugins: [react()],
});

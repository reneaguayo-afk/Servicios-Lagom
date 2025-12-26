import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Inyecta la variable de entorno para que process.env.API_KEY sea válido en el navegador
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Načtení env proměnných pro build proces ze souborů.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Bezpečné vložení API klíče.
      // DŮLEŽITÉ: Pořadí je env.API_KEY (ze souboru) || process.env.API_KEY (z Vercel CI/CD) || ''
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || '')
    }
  };
});
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Načtení env proměnných
  // Používáme prázdný objekt jako fallback pro process.cwd, pokud by v prostředí chyběl
  const env = loadEnv(mode, (process as any).cwd ? (process as any).cwd() : '.', '');
  
  return {
    plugins: [react()],
    define: {
      // Vercel injectuje env proměnné při buildu.
      // Zde zajistíme, že 'process.env.API_KEY' v kódu bude nahrazeno skutečnou hodnotou.
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});
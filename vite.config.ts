import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Načtení env proměnných pro build proces
  // Fix: Property 'cwd' does not exist on type 'Process' - casting to any
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Toto umožní používat process.env.API_KEY v klientském kódu,
      // i když Vite standardně používá import.meta.env.
      // Vercel automaticky poskytne env proměnné během buildu.
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});
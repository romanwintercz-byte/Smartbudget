import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Načtení env proměnných pro build proces.
  // Používáme process.cwd() pro získání aktuálního adresáře.
  // Třetí argument '' zajistí načtení všech env proměnných, ne jen těch s prefixem VITE_.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Bezpečné vložení API klíče.
      // Toto umožní používat process.env.API_KEY v klientském kódu.
      // Pokud env.API_KEY není definován (např. v CI/CD bez env vars), vloží se prázdný řetězec,
      // což je bezpečnější než nechat undefined, které může způsobit chyby při nahrazování nebo běhu.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  };
});
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

// Carica le variabili d'ambiente per la modalità corrente
export default defineConfig(({mode}) => {
  // Invece di caricare solo da file, ora usiamo process.env, che è dove GitHub Actions mette i secrets
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: '/dashOlha.github.io/',
    plugins: [react(), tailwindcss()],
    // Definiamo TUTTE le variabili che l'app deve vedere, non solo quella di Gemini
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_SUPABASE_ADMIN_EMAIL': JSON.stringify(env.VITE_SUPABASE_ADMIN_EMAIL),
      'import.meta.env.VITE_SUPABASE_ADMIN_PASSWORD': JSON.stringify(env.VITE_SUPABASE_ADMIN_PASSWORD),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
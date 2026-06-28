import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ATTENZIONE: Variabili d'ambiente di Supabase mancanti. Assicurati di aver impostato VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nei Secrets.");
}

// Usiamo i placeholder solo per evitare che l'app crashi istantaneamente, ma le chiamate falliranno
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

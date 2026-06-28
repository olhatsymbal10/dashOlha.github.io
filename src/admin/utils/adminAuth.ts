import { supabase } from '../../lib/supabase';

/**
 * Utility per l'autenticazione admin con PIN.
 */
const ADMIN_PIN = "1234"; // PIN fisso richiesto
const SESSION_KEY = "admin_authenticated";

const ADMIN_EMAIL = import.meta.env.VITE_SUPABASE_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = import.meta.env.VITE_SUPABASE_ADMIN_PASSWORD || '';

/**
 * Verifica se il PIN inserito è corretto e salva la sessione.
 * Se sono presenti credenziali admin, esegue anche il login Supabase.
 * @param pin Il PIN inserito dall'utente.
 * @returns Oggetto con successo e messaggio di errore opzionale.
 */
export const loginAdmin = async (pin: string): Promise<{ success: boolean; error?: string }> => {
  if (pin !== ADMIN_PIN) {
    return { success: false, error: 'PIN errato. Riprova.' };
  }

  // PIN corretto - salva la sessione locale
  sessionStorage.setItem(SESSION_KEY, 'true');

  // Prova il login Supabase se le credenziali sono impostate
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      if (error || !data.session) {
        console.warn('Login Supabase fallito - verrai visto come anon. Le recensioni da approvare potrebbero non essere visibili. Errore:', error?.message);
      }
    } catch (err) {
      console.warn('Errore durante il login Supabase:', err);
    }
  } else {
    console.warn('Credenziali admin Supabase non impostate. La dashboard funziona ma non vedrai le recensioni non approvate.');
  }

  return { success: true };
};

/**
 * Rimuove la sessione admin.
 */
export const logoutAdmin = async (): Promise<void> => {
  sessionStorage.removeItem(SESSION_KEY);
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
};

/**
 * Controlla se l'admin è attualmente autenticato.
 * @returns true se autenticato, false altrimenti.
 */
export const isAdminAuthenticated = (): boolean => {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
};

// Variabile per evitare loop infiniti di tentativi di login falliti
let autoLoginAttempted = false;

/**
 * Tenta di effettuare il login automatico a Supabase se l'utente è entrato
 * con il PIN ma la sessione di Supabase è scaduta o assente.
 */
export const ensureSupabaseSession = async () => {
  if (isAdminAuthenticated()) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      if (ADMIN_EMAIL && ADMIN_PASSWORD) {
        if (autoLoginAttempted) return;
        autoLoginAttempted = true;
        
        console.log('Sessione Supabase assente. Tentativo di auto-login in corso...');
        const { error } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        });
        
        if (error) {
          console.error("Errore di auto-login Supabase:", error.message);
        }
      } else {
        console.warn('Impossibile fare auto-login su Supabase: VITE_SUPABASE_ADMIN_EMAIL o PASSWORD mancanti nel file .env');
      }
    }
  }
};

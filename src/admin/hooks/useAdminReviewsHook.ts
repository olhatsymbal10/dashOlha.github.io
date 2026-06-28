import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ensureSupabaseSession } from '../utils/adminAuth';

export interface Review {
  id: string;
  nome: string;
  stelle: number;
  testo: string;
  approvata: boolean;
  created_at: string;
  deleted_at?: string;
}

export const useAdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error("Credenziali Supabase mancanti. Assicurati di aver creato un file .env con VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
      }

      // Tenta di ripristinare la sessione di Supabase (se assente ma siamo loggati col PIN)
      await ensureSupabaseSession();
      
      // Debug: avvisa in console se l'admin non è autenticato su Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn("ATTENZIONE: Non sei autenticato su Supabase. Le recensioni 'Da Approvare' potrebbero essere nascoste dal database.");
      }

      const { data, error } = await supabase
        .from('recensioni')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data as Review[]);
    } catch (err: any) {
      setError(err.message || 'Errore durante il caricamento delle recensioni');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return; // Non provare a connettersi se mancano le credenziali
    }

    // Sottoscrizione real-time per aggiornamenti
    const channel = supabase
      .channel('admin-reviews')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recensioni' },
        (payload) => {
          console.log('Review change received!', payload);
          fetchReviews(); // Ricarica tutto per semplicità
        }
      )
      .subscribe();

    // Ricarica quando l'app torna in primo piano (es. su cellulare)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchReviews();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const approveReview = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('recensioni')
        .update({ approvata: true })
        .eq('id', id)
        .select();
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("Modifica bloccata da Supabase (Policy RLS mancante).");
      }
      
      setReviews((prev) => 
        prev.map((r) => r.id === id ? { ...r, approvata: true } : r)
      );
      return { success: true };
    } catch (err: any) {
      console.error("Errore durante l'approvazione:", err);
      return { success: false, error: err.message };
    }
  };

  const deleteReview = async (id: string) => {
    try {
      // Soft delete: imposta deleted_at al timestamp attuale
      const { data, error } = await supabase
        .from('recensioni')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .select();
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("Eliminazione bloccata da Supabase (Policy RLS mancante).");
      }
      
      setReviews((prev) => prev.filter((r) => r.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('Errore durante la cancellazione:', err);
      return { success: false, error: err.message };
    }
  };

  const restoreReview = async (id: string) => {
    try {
      // Ripristina la recensione pulendo deleted_at
      const { data, error } = await supabase
        .from('recensioni')
        .update({ deleted_at: null })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("Ripristino bloccato da Supabase (Policy RLS mancante).");
      }

      return { success: true };
    } catch (err: any) {
      console.error('Errore durante il ripristino:', err);
      return { success: false, error: err.message };
    }
  };

  const getDeletedReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('recensioni')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      
      return { deleted: data as Review[], success: true };
    } catch (err: any) {
      console.error('Errore nel recupero elementi eliminati:', err);
      return { deleted: [], success: false, error: err.message };
    }
  };

  return { reviews, loading, error, approveReview, deleteReview, restoreReview, getDeletedReviews, refetch: fetchReviews };
};

/**
 * Hook per il fetch e la gestione real-time delle prenotazioni.
 */
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  booking_type: 'online' | 'manual_block';
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  note?: string;
  service_duration: number;
  buffer_minutes: number;
  source: string;
  admin_note?: string;
  is_seen_by_admin: boolean;
  created_at: string;
  deleted_at?: string;
}

export const useAdminBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Controllo credenziali mancanti
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error("Credenziali Supabase mancanti. Assicurati di aver creato un file .env con VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
      }

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .is('deleted_at', null)
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      setBookings(data as Booking[]);
    } catch (err: any) {
      setError(err.message || 'Errore durante il caricamento delle prenotazioni');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return; // Non provare a connettersi se mancano le credenziali
    }

    // Sottoscrizione real-time per aggiornamenti
    const channel = supabase
      .channel('admin-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Change received!', payload);
          fetchBookings(); // Ricarica tutto per semplicità
        }
      )
      .subscribe();

    // Ricarica quando l'app torna in primo piano (es. su cellulare)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchBookings();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const deleteBooking = async (id: string) => {
    try {
      // Soft delete: imposta deleted_at al timestamp attuale
      const { data, error } = await supabase
        .from('bookings')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("Eliminazione bloccata da Supabase (Policy RLS mancante).");
      }

      setBookings((prev) => prev.filter((b) => b.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('Errore durante la cancellazione:', err);
      return { success: false, error: err.message };
    }
  };

  const restoreBooking = async (id: string) => {
    try {
      // Ripristina la prenotazione pulendo deleted_at
      const { data, error } = await supabase
        .from('bookings')
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

  const getDeletedBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      
      return { deleted: data as Booking[], success: true };
    } catch (err: any) {
      console.error('Errore nel recupero elementi eliminati:', err);
      return { deleted: [], success: false, error: err.message };
    }
  };

  return { bookings, loading, error, deleteBooking, restoreBooking, getDeletedBookings, refetch: fetchBookings };
};

/**
 * Hook per la gestione delle notifiche in-app persistenti.
 */
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Booking } from './useAdminBookings';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Booking[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadBookings = async () => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) return;
    
    try {
      // Cerca le prenotazioni online che non sono ancora state viste
      // Nota: usiamo un filtro più permissivo per supportare sia booking_type che source
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('is_seen_by_admin', false)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Filtriamo lato client per assicurarci di prendere solo quelle online
        const onlineBookings = (data as any[]).filter(b => 
          b.booking_type === 'online'
        );
        
        setNotifications(onlineBookings as Booking[]);
        setUnreadCount(onlineBookings.length);
      }
    } catch (err) {
      console.error("Errore nel fetch delle notifiche:", err);
    }
  };

  useEffect(() => {
    fetchUnreadBookings();

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return;
    }

    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload) => {
          const newBookingRaw = payload.new as any;
          
          const isOnline = newBookingRaw.booking_type === 'online';
                           
          // Aggiungi alla lista se è una prenotazione online
          if (isOnline) {
            const newBooking: Booking = newBookingRaw as Booking;
            
            setNotifications((prev) => {
              // Evita duplicati se fetchUnreadBookings ha già caricato questa notifica
              if (prev.some(b => b.id === newBooking.id)) return prev;
              return [newBooking, ...prev];
            });
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    // Ricarica le notifiche quando l'app torna in primo piano (es. su cellulare)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadBookings();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    // Azzeriamo SOLO il contatore (il badge rosso sparisce), 
    // ma NON svuotiamo l'array 'notifications' così restano visibili nella tendina!
    setUnreadCount(0);

    // Aggiorna il database
    try {
      // Aggiorniamo tutte le prenotazioni non viste, indipendentemente dal tipo,
      // per evitare problemi con colonne mancanti (booking_type vs source)
      await supabase
        .from('bookings')
        .update({ is_seen_by_admin: true })
        .eq('is_seen_by_admin', false);
    } catch (err) {
      console.error("Errore nell'aggiornamento delle notifiche:", err);
    }
  };

  return { notifications, unreadCount, markAllAsRead };
};

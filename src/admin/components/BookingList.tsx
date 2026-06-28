/**
 * Lista delle prenotazioni con filtri e azioni.
 */
import React, { useState } from 'react';
import { format, isToday, isThisWeek, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Trash2, Plus } from 'lucide-react';
import { useAdminBookings, Booking } from '../hooks/useAdminBookings';
import { DeleteBookingModal } from './DeleteBookingModal';
import { BlockSlotForm } from './BlockSlotForm';
import { ErrorModal } from './ErrorModal';

type FilterType = 'all' | 'today' | 'week';

export const BookingList: React.FC = () => {
  const { bookings, loading, error, deleteBooking, refetch } = useAdminBookings();
  const [filter, setFilter] = useState<FilterType>('all');
  const [showBlockForm, setShowBlockForm] = useState(false);
  
  // Stato per la modale di cancellazione
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorModal, setErrorModal] = useState<{isOpen: boolean, title: string, message: string}>({ isOpen: false, title: '', message: '' });

  const filteredBookings = bookings.filter((booking) => {
    if (!booking.start_time) return false;
    try {
      const date = parseISO(booking.start_time);
      if (filter === 'today') return isToday(date);
      if (filter === 'week') return isThisWeek(date, { weekStartsOn: 1 });
      return true;
    } catch (e) {
      return true;
    }
  });

  const handleDeleteConfirm = async () => {
    if (!bookingToDelete) return;
    setIsDeleting(true);
    const result = await deleteBooking(bookingToDelete.id);
    setIsDeleting(false);
    
    if (result.success) {
      setBookingToDelete(null);
    } else {
      setBookingToDelete(null);
      setErrorModal({
        isOpen: true,
        title: "Impossibile eliminare",
        message: `${result.error}\n\nAssicurati di aver aggiunto le policy RLS per DELETE su Supabase.`
      });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Caricamento prenotazioni...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Errore: {error}</div>;
  }

  return (
    <div className="pb-20">
      {/* Header e Filtri */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setFilter('today')}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
              filter === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Oggi
          </button>
          <button
            onClick={() => setFilter('week')}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
              filter === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Questa Settimana
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tutte
          </button>
        </div>

        {!showBlockForm && (
          <button
            onClick={() => setShowBlockForm(true)}
            className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-3 rounded-xl font-medium hover:bg-blue-100 transition-colors min-h-[48px]"
          >
            <Plus size={20} />
            Aggiungi Blocco WhatsApp
          </button>
        )}
      </div>

      {showBlockForm && (
        <BlockSlotForm 
          onSuccess={() => {
            setShowBlockForm(false);
            refetch(); // Forza il ricaricamento immediato
          }} 
          onCancel={() => setShowBlockForm(false)} 
        />
      )}

      {/* Lista Prenotazioni */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
            Nessuna prenotazione trovata.
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const isWhatsApp = booking.booking_type === 'manual_block';
            
            return (
              <div key={booking.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">
                      {isWhatsApp ? (booking.note || 'Blocco WhatsApp') : (booking.name || 'Cliente Sconosciuto')}
                    </h4>
                    <p className="text-gray-600 text-sm">{booking.service}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    isWhatsApp ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {isWhatsApp ? 'WhatsApp' : 'Online'}
                  </span>
                </div>
                
                <div className="flex justify-between items-end mt-4">
                  <div className="text-sm text-gray-600">
                    <div className="font-medium text-gray-900">
                      {booking.start_time ? format(parseISO(booking.start_time), "EEEE d MMMM", { locale: it }) : 'Data non valida'}
                    </div>
                    {booking.service_duration !== undefined && booking.service_duration >= 1440 ? (
                      <div className="text-red-600 font-medium mt-1">Tutto il giorno</div>
                    ) : (
                      <div>Ore {booking.start_time ? format(parseISO(booking.start_time), "HH:mm") : '--:--'} • {booking.service_duration ?? '--'} min</div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setBookingToDelete(booking)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Elimina prenotazione"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <DeleteBookingModal
        isOpen={!!bookingToDelete}
        onClose={() => setBookingToDelete(null)}
        onConfirm={handleDeleteConfirm}
        bookingName={bookingToDelete?.name || bookingToDelete?.note || 'Blocco WhatsApp'}
        isDeleting={isDeleting}
      />

      <ErrorModal 
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
      />
    </div>
  );
};

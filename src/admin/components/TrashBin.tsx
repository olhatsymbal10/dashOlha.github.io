/**
 * Cestino con elementi eliminati (prenotazioni e recensioni).
 * Permette di visualizzare e recuperare elementi eliminati per sbaglio.
 */
import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, Trash, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { useAdminBookings, Booking } from '../hooks/useAdminBookings';
import { useAdminReviews, Review } from '../hooks/useAdminReviewsHook';
import { ErrorModal } from './ErrorModal';
import { ConfirmModal } from './ConfirmModal';

type TabType = 'bookings' | 'reviews';

interface DeletedBooking extends Booking {
  deleted_at: string;
}

interface DeletedReview extends Review {
  deleted_at: string;
}

export const TrashBin: React.FC = () => {
  const { getDeletedBookings, restoreBooking } = useAdminBookings();
  const { getDeletedReviews, restoreReview } = useAdminReviews();
  
  // --- IMPOSTAZIONI COLORI CESTINO ---
  // Puoi incollare qui qualsiasi codice colore HEX (trovi i codici cercando "color picker" su Google)
  const customColors = {
    testo_e_icona: "#ff0000",   // Ora impostato su rosso acceso
    sfondo_attorno: "#ffeeee",  // Rosso chiaro per lo sfondo del pulsante quando selezionato
    linea_sotto: "#ff0000"      // La linea che separa i pulsanti dal resto della pagina
  };

  const [activeTab, setActiveTab] = useState<TabType>('bookings');
  const [deletedBookings, setDeletedBookings] = useState<DeletedBooking[]>([]);
  const [deletedReviews, setDeletedReviews] = useState<DeletedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  
  const [errorModal, setErrorModal] = useState<{isOpen: boolean, title: string, message: string}>({ 
    isOpen: false, 
    title: '', 
    message: '' 
  });
  const [itemToRestore, setItemToRestore] = useState<{ id: string, type: 'booking' | 'review' } | null>(null);

  const loadDeletedItems = async () => {
    setLoading(true);
    try {
      const bookingsResult = await getDeletedBookings();
      const reviewsResult = await getDeletedReviews();
      
      if (bookingsResult.success) {
        setDeletedBookings(bookingsResult.deleted as DeletedBooking[]);
      }
      if (reviewsResult.success) {
        setDeletedReviews(reviewsResult.deleted as DeletedReview[]);
      }
    } catch (err) {
      console.error('Errore nel caricamento elementi eliminati:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeletedItems();
  }, []);

  const handleRestore = async () => {
    if (!itemToRestore) return;
    
    setIsRestoring(itemToRestore.id);
    
    try {
      let result;
      if (itemToRestore.type === 'booking') {
        result = await restoreBooking(itemToRestore.id);
        if (result.success) {
          setDeletedBookings(prev => prev.filter(b => b.id !== itemToRestore.id));
        }
      } else {
        result = await restoreReview(itemToRestore.id);
        if (result.success) {
          setDeletedReviews(prev => prev.filter(r => r.id !== itemToRestore.id));
        }
      }

      if (!result.success) {
        setErrorModal({
          isOpen: true,
          title: "Errore di Ripristino",
          message: result.error || "Si è verificato un errore sconosciuto."
        });
      }

      setItemToRestore(null);
    } finally {
      setIsRestoring(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Caricamento cestino...</div>;
  }

  return (
    <div 
      className="pb-20 trash-container"
      style={{
        '--color-trash-text': customColors.testo_e_icona,
        '--color-trash-bg': customColors.sfondo_attorno,
      } as React.CSSProperties}
    >
      {/* Tabs */}
      <div 
        className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b"
        style={{ borderBottomColor: customColors.linea_sotto }}
      >
        <button
          onClick={() => setActiveTab('bookings')}
          className={`trash-tab ${activeTab === 'bookings' ? 'active' : ''}`}
        >
          <Trash2 size={16} />
          Prenotazioni ({deletedBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`trash-tab ${activeTab === 'reviews' ? 'active' : ''}`}
        >
          <Trash2 size={16} />
          Recensioni ({deletedReviews.length})
        </button>
      </div>

      {/* Avviso */}
      <div className="mb-6 trash-warning">
        <AlertCircle size={20} />
        <div>
          <strong>Nota:</strong> Gli elementi rimangono nel cestino per 30 giorni prima di essere eliminati permanentemente.
        </div>
      </div>

      {/* Prenotazioni Eliminate */}
      {activeTab === 'bookings' && (
        <div className="space-y-3">
          {deletedBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
              Nessuna prenotazione nel cestino.
            </div>
          ) : (
            deletedBookings.map((booking) => (
              <div
                key={booking.id}
                className="trash-item bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {booking.name || 'Senza nome'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {booking.service || 'Servizio sconosciuto'} · {booking.email || 'email non disponibile'}
                    </p>
                    {booking.start_time && (
                      <p className="text-sm text-gray-500 mt-1">
                        {format(parseISO(booking.start_time), 'PPp', { locale: it })}
                      </p>
                    )}
                    <p className="text-xs text-red-600 mt-2">
                      Eliminato: {format(parseISO(booking.deleted_at), 'PPp', { locale: it })}
                    </p>
                  </div>
                  <button
                    onClick={() => setItemToRestore({ id: booking.id, type: 'booking' })}
                    disabled={isRestoring === booking.id}
                    className="restore-button"
                    title="Ripristina prenotazione"
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Recensioni Eliminate */}
      {activeTab === 'reviews' && (
        <div className="space-y-3">
          {deletedReviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
              Nessuna recensione nel cestino.
            </div>
          ) : (
            deletedReviews.map((review) => (
              <div
                key={review.id}
                className="trash-item bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{review.nome}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      {'⭐'.repeat(review.stelle)}
                      <span className="text-sm text-gray-600 ml-1">({review.stelle}/5)</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {review.testo}
                    </p>
                    <div className="mt-2 flex gap-2 items-center">
                      {review.approvata && (
                        <span className="trash-badge approved">
                          Approvata
                        </span>
                      )}
                      <span className="text-xs text-red-600">
                        Eliminata: {format(parseISO(review.deleted_at), 'PPp', { locale: it })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setItemToRestore({ id: review.id, type: 'review' })}
                    disabled={isRestoring === review.id}
                    className="restore-button"
                    title="Ripristina recensione"
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modali */}
      <ConfirmModal
        isOpen={itemToRestore !== null}
        title="Ripristina elemento"
        message={`Vuoi ripristinare questo elemento dal cestino?`}
        onConfirm={handleRestore}
        onCancel={() => setItemToRestore(null)}
        confirmText="Ripristina"
        cancelText="Annulla"
        isLoading={isRestoring !== null}
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

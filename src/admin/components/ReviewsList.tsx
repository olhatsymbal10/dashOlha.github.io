import React, { useState } from 'react';
import { Check, Trash2, Star } from 'lucide-react';
import { useAdminReviews, Review } from '../hooks/useAdminReviewsHook';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { ErrorModal } from './ErrorModal';
import { ConfirmModal } from './ConfirmModal';

export const ReviewList: React.FC = () => {
  const { reviews, loading, error, approveReview, deleteReview } = useAdminReviews();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  const [errorModal, setErrorModal] = useState<{isOpen: boolean, title: string, message: string}>({ isOpen: false, title: '', message: '' });
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  const filteredReviews = reviews.filter((review) => {
    if (filter === 'pending') return !review.approvata;
    if (filter === 'approved') return review.approvata;
    return true;
  });

  const handleApprove = async (id: string) => {
    setIsProcessing(id);
    const result = await approveReview(id);
    setIsProcessing(null);
    if (!result.success) {
      setErrorModal({
        isOpen: true,
        title: "Errore di Approvazione",
        message: result.error || "Si è verificato un errore sconosciuto."
      });
    }
  };

  const confirmDelete = (id: string) => {
    setReviewToDelete(id);
  };

  const handleDelete = async () => {
    if (!reviewToDelete) return;
    
    setIsProcessing(reviewToDelete);
    const result = await deleteReview(reviewToDelete);
    setIsProcessing(null);
    setReviewToDelete(null);
    
    if (!result.success) {
      setErrorModal({
        isOpen: true,
        title: "Errore di Eliminazione",
        message: result.error || "Si è verificato un errore sconosciuto."
      });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Caricamento recensioni...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Errore: {error}</div>;
  }

  return (
    <div className="pb-20">
      {/* Filtri */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
            filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Da Approvare
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
            filter === 'approved' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Approvate
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

      {/* Lista Recensioni */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
            Nessuna recensione trovata.
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">
                    {review.nome || 'Anonimo'}
                  </h4>
                  <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < (review.stelle || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  review.approvata ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {review.approvata ? 'Approvata' : 'In attesa'}
                </span>
              </div>
              
              <p className="text-gray-700 mt-3 text-sm italic">"{review.testo}"</p>
              
              <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-50">
                <div className="text-xs text-gray-500">
                  {review.created_at ? format(parseISO(review.created_at), "d MMMM yyyy, HH:mm", { locale: it }) : ''}
                </div>
                
                <div className="flex gap-2">
                  {!review.approvata && (
                    <button
                      onClick={() => handleApprove(review.id)}
                      disabled={isProcessing === review.id}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                      aria-label="Approva recensione"
                    >
                      <Check size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => confirmDelete(review.id)}
                    disabled={isProcessing === review.id}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                    aria-label="Elimina recensione"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ErrorModal 
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
      />

      <ConfirmModal
        isOpen={!!reviewToDelete}
        title="Elimina Recensione"
        message="Sei sicuro di voler eliminare definitivamente questa recensione? L'operazione non può essere annullata."
        onConfirm={handleDelete}
        onCancel={() => setReviewToDelete(null)}
        isProcessing={!!isProcessing}
      />
    </div>
  );
};

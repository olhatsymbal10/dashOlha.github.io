/**
 * Form per inserire un blocco slot da WhatsApp.
 */
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface BlockSlotFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const BlockSlotForm: React.FC<BlockSlotFormProps> = ({ onSuccess, onCancel }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [service, setService] = useState('');
  const [duration, setDuration] = useState(60);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  
  // Mock servizi, in un'app reale verrebbero da Supabase
  const services = [
    { id: '1', name: 'Massaggio Rilassante', duration: 80 },
    { id: '2', name: 'Massaggio Linfodrenante', duration: 60 },
    { id: '3', name: 'Massaggio Sportivo', duration: 60 },
    { id: '4', name: 'Antica terapia Del Fuoco', duration: 120 },
    { id: '5', name: 'Massaggio "Plastica fasciale del corpo e viso', duration: 60 },
    { id: '6', name: 'Massaggio Olistico', duration: 60 },
    { id: '7', name: 'Massaggio Con Il Piede', duration: 60 },
    
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let startDateTime: Date;
      let endDateTime: Date;
      let finalDuration = duration;
      let finalBuffer = 10;

      if (isAllDay) {
        startDateTime = new Date(`${date}T00:00:00`);
        endDateTime = new Date(`${date}T23:59:59`);
        finalDuration = 1440; // 24 ore in minuti
        finalBuffer = 0;
      } else {
        startDateTime = new Date(`${date}T${time}`);
        endDateTime = new Date(startDateTime.getTime() + (duration + finalBuffer) * 60000);
      }

      const { error: insertError } = await supabase.from('bookings').insert([
        {
          name: isAllDay ? 'GIORNO BLOCCATO' : 'BLOCCO WHATSAPP',
          service: isAllDay ? 'Giorno Intero' : (service || 'Blocco Manuale'),
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          service_duration: finalDuration,
          buffer_minutes: finalBuffer,
          booking_type: 'manual_block',
          source: 'manual_block',
          note: note,
          email: null,
          phone: null,
          is_seen_by_admin: false,
        }
      ]);

      if (insertError) throw insertError;
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Errore durante il salvataggio del blocco.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Nuovo Blocco WhatsApp</h3>
      
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
          <input
            type="checkbox"
            id="isAllDay"
            checked={isAllDay}
            onChange={(e) => setIsAllDay(e.target.checked)}
            className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="isAllDay" className="ml-3 block text-sm font-medium text-gray-700">
            Blocca tutto il giorno
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={isAllDay ? "col-span-2" : ""}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[48px]"
            />
          </div>
          {!isAllDay && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ora</label>
              <input
                type="time"
                required={!isAllDay}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[48px]"
              />
            </div>
          )}
        </div>

        {!isAllDay && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servizio (Opzionale)</label>
              <select
                value={service}
                onChange={(e) => {
                  setService(e.target.value);
                  const selectedService = services.find(s => s.name === e.target.value);
                  if (selectedService) setDuration(selectedService.duration);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[48px]"
              >
                <option value="">Seleziona un servizio...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.name}>{s.name} ({s.duration} min)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durata (minuti)</label>
              <input
                type="number"
                required={!isAllDay}
                min="15"
                step="15"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[48px]"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note (Opzionale)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Es. Nome cliente WhatsApp"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[48px]"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 min-h-[48px]"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 min-h-[48px]"
          >
            {loading ? 'Salvataggio...' : 'Salva Blocco'}
          </button>
        </div>
      </form>
    </div>
  );
};

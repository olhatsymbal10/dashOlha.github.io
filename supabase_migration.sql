-- Aggiungi colonna per distinguere prenotazioni "blocco WhatsApp"
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'online';
-- Valori: 'online' | 'whatsapp_block'

-- Aggiungi colonna note opzionale
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- Esempio di creazione tabella se non esiste (per test locale)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  service TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER NOT NULL,
  source TEXT DEFAULT 'online',
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

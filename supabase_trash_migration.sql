-- Aggiungi colonna deleted_at per soft delete su bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Aggiungi colonna deleted_at per soft delete su recensioni
ALTER TABLE recensioni ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Crea index per query più efficienti
CREATE INDEX IF NOT EXISTS idx_bookings_deleted_at ON bookings(deleted_at);
CREATE INDEX IF NOT EXISTS idx_recensioni_deleted_at ON recensioni(deleted_at);

-- Aggiungi policy RLS per permettere la lettura anonima (visto che l'admin usa la chiave anonima con PIN)
-- Se le tabelle non hanno RLS abilitato, questo comando non farà danni. Se ce l'hanno, risolverà il problema.

-- =================================================================
-- Tabella: bookings
-- =================================================================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policy per SELECT: Chiunque può leggere le prenotazioni.
DROP POLICY IF EXISTS public_select_bookings ON public.bookings;
CREATE POLICY public_select_bookings ON public.bookings FOR SELECT USING (true);

-- Policy per UPDATE/DELETE: Solo gli utenti autenticati (admin) possono modificare o eliminare.
DROP POLICY IF EXISTS admin_update_delete_bookings ON public.bookings;
CREATE POLICY admin_update_delete_bookings ON public.bookings FOR ALL USING (auth.role() = 'authenticated');

-- =================================================================
-- Tabella: recensioni
-- =================================================================
ALTER TABLE public.recensioni ENABLE ROW LEVEL SECURITY;

-- Policy per SELECT: Chiunque può leggere le recensioni.
DROP POLICY IF EXISTS public_select_recensioni ON public.recensioni;
CREATE POLICY public_select_recensioni ON public.recensioni FOR SELECT USING (true);

-- Policy per UPDATE/DELETE: Solo gli utenti autenticati (admin) possono modificare o eliminare.
DROP POLICY IF EXISTS admin_update_delete_recensioni ON public.recensioni;
CREATE POLICY admin_update_delete_recensioni ON public.recensioni FOR ALL USING (auth.role() = 'authenticated');

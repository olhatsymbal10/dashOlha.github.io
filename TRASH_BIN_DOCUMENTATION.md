# Sistema di Cestino - Soft Delete

## Panoramica

Il sistema di cestino consente di recuperare prenotazioni e recensioni eliminate per sbaglio. Invece di cancellare permanentemente i dati, essi vengono "soft-deleted" (contrassegnati come eliminati) e rimangono nel cestino per 30 giorni prima di essere permanentemente rimossi.

## Implementazione

### 1. **Database (Supabase)**

Esegui la migrazione per aggiungere la colonna `deleted_at`:

```sql
-- File: supabase_trash_migration.sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE recensioni ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_bookings_deleted_at ON bookings(deleted_at);
CREATE INDEX IF NOT EXISTS idx_recensioni_deleted_at ON recensioni(deleted_at);
```

### 2. **Hook Modificati**

#### `useAdminBookings.ts`
- `deleteBooking()`: Ora imposta `deleted_at` al timestamp corrente (soft delete)
- `restoreBooking()`: Ripristina una prenotazione pulendo `deleted_at`
- `getDeletedBookings()`: Recupera tutte le prenotazioni eliminate
- Query principale: filtra automaticamente elementi con `deleted_at = null`

#### `useAdminReviewsHook.ts`
- `deleteReview()`: Soft delete della recensione
- `restoreReview()`: Ripristina una recensione
- `getDeletedReviews()`: Recupera tutte le recensioni eliminate
- Query principale: filtra automaticamente elementi con `deleted_at = null`

### 3. **Componente TrashBin**

Nuovo componente in `src/admin/components/TrashBin.tsx` che mostra:

- **Due tab**: Prenotazioni eliminate e Recensioni eliminate
- **Contatore**: Numero di elementi in ciascun tab
- **Informazioni dettagliate**:
  - Nome cliente / autore
  - Dettagli della prenotazione (servizio, email, data/ora)
  - Valutazione e testo della recensione
  - Data/ora di eliminazione
- **Pulsante Ripristina**: Ripristina l'elemento dal cestino
- **Avviso**: Ricorda che gli elementi rimangono 30 giorni

### 4. **CSS Coerente**

File: `src/admin.css`

Variabili CSS per coerenza visiva:
- `--color-trash-bg`: Sfondo elementi cestino (rosso)
- `--color-trash-text`: Testo elementi cestino
- `--color-restore-bg`: Sfondo pulsante ripristino (verde)
- `--color-restore-text`: Testo pulsante ripristino
- `--color-warning-bg`: Sfondo avviso

Classi personalizzate:
- `.trash-container`: Contenitore con animazione
- `.trash-item`: Elemento nel cestino con hover effect
- `.restore-button`: Pulsante ripristino con animazione rotazione
- `.trash-warning`: Stile per l'avviso
- `.trash-tab`: Stile per i tab
- `.trash-badge`: Badge di stato (es. "Approvata")

### 5. **Interfaccia Utente**

#### AdminApp.tsx
- Aggiunto tab "Cestino" nel header con icona Trash2
- Colore del tab: rosso per distinguerlo (rosso = attenzione/pericolo)
- Accessibile come terza tab dopo Prenotazioni e Recensioni

## Flusso di Utilizzo

### Eliminazione
1. Utente clicca il pulsante "Elimina" su una prenotazione/recensione
2. L'elemento viene soft-deleted (deleted_at = now())
3. Elemento scompare dalle liste principali
4. Elemento appare nel Cestino con data di eliminazione

### Ripristino
1. Utente accede al tab "Cestino"
2. Sceglie un elemento da ripristinare
3. Clicca il pulsante "Ripristina" (icona RotateCcw)
4. Conferma con modale
5. L'elemento viene ripristinato (deleted_at = null)
6. Elemento scompare dal Cestino e torna nelle liste principali

## Customizzazione

### Cambiare il periodo di conservazione
Nel database, aggiungi una procedura per eliminare permanentemente gli elementi dopo 30 giorni:

```sql
-- Elimina permanentemente gli elementi dopo 30 giorni
DELETE FROM bookings 
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '30 days';

DELETE FROM recensioni 
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '30 days';
```

### Modifi il colore del tema
Modifica in `src/admin.css`:

```css
:root {
  --color-trash-bg: #fef2f2;        /* Sfondo rosso chiaro */
  --color-trash-text: #dc2626;      /* Rosso scuro */
  --color-restore-bg: #f0fdf4;      /* Verde chiaro */
  --color-restore-text: #16a34a;    /* Verde scuro */
}
```

## Note Importanti

1. **Policy RLS**: Assicurati che le policy RLS di Supabase permettono UPDATE su `deleted_at`
2. **Performance**: L'indice su `deleted_at` migliora le query
3. **Tema scuro**: Le variabili CSS hanno supporto per `prefers-color-scheme: dark`
4. **Responsive**: Layout ottimizzato per mobile

## File Modificati

- ✅ `supabase_trash_migration.sql` - Migrazione database
- ✅ `src/admin/hooks/useAdminBookings.ts` - Hook con soft delete
- ✅ `src/admin/hooks/useAdminReviewsHook.ts` - Hook con soft delete
- ✅ `src/admin/components/TrashBin.tsx` - Nuovo componente
- ✅ `src/admin/AdminApp.tsx` - Aggiunto tab Cestino
- ✅ `src/admin.css` - Stili personalizzati
- ✅ `src/main.tsx` - Import admin.css

## Prossimi Passi (Opzionali)

1. Aggiungere filtri temporali nel Cestino ("Ultimi 7 giorni", "Ultimi 30 giorni")
2. Aggiungere ricerca nel Cestino
3. Aggiungere pulsante "Ripristina tutto" nel Cestino
4. Aggiungere statistiche: "Tot. elementi eliminati"
5. Aggiungere log di audit per tracciare chi ha eliminato/ripristinato

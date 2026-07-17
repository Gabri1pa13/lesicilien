# CRM — Le Sicilien

CRM interno per gestire la crescita del portfolio (obiettivo: 100+ immobili), integrato nell'admin esistente (Next.js + Supabase).

## Setup

1. **Schema database**: esegui `supabase/crm_schema.sql` nel SQL Editor di Supabase (dopo `schema.sql`, già in uso per le richieste concierge).
2. **Variabili d'ambiente**: sono già quelle usate dal resto del progetto —
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` (quest'ultima necessaria per la creazione di nuovi utenti team da `/admin/crm/team`).
3. **Primo utente admin**: crea un utente da Supabase Studio (Authentication → Users → Add user) oppure via SQL, poi aggiorna il suo ruolo:
   ```sql
   update profiles set role = 'admin' where email = 'tuo@email.it';
   ```
   Da lì potrai invitare il resto del team direttamente da `/admin/crm/team`.

## Struttura

- `/admin/crm` — dashboard con KPI (immobili, pipeline, prenotazioni, task, payout)
- `/admin/crm/proprietari` — pipeline di acquisizione proprietari (lead → attivo), con timeline attività
- `/admin/crm/immobili` — portfolio immobili, con spese collegate
- `/admin/crm/prenotazioni` — prenotazioni per immobile, con calcolo automatico di commissione e payout stimato
- `/admin/crm/ospiti` — CRM ospiti (creato automaticamente anche dalle prenotazioni)
- `/admin/crm/task` — task operativi (pulizie, manutenzioni, check-in/out) assegnabili al team
- `/admin/crm/contabilita` — generazione automatica dei rendiconti/payout ai proprietari per periodo
- `/admin/crm/team` — gestione membri del team e ruoli

## Ruoli

| Ruolo | Accesso |
|---|---|
| `admin` | tutto, incluso team |
| `manager` | tutto tranne team |
| `sales` | dashboard, proprietari, ospiti |
| `accountant` | dashboard, immobili, prenotazioni, spese, payout |
| `cleaning` | solo i propri task, può aggiornarne lo stato |

I permessi sono verificati sia lato client (per mostrare/nascondere le sezioni) sia lato server in ogni endpoint `/api/crm/*` (vedi `lib/crmAuth.js`).

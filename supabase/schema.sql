-- ============================================================
-- Le Sicilien · Extras Booking System — Supabase Schema
-- Esegui nel SQL Editor del tuo progetto Supabase
-- ============================================================

create table if not exists requests (
  id               uuid        default gen_random_uuid() primary key,
  created_at       timestamptz default now(),
  service_id       text        not null,
  service_name     text        not null,
  service_price    text,
  nome             text        not null,
  email            text        not null,
  telefono         text,
  data_desiderata  date,
  orario           text,
  persone          integer     default 1,
  note             text,
  revolut_link     text,        -- link Revolut inviato al cliente al momento della conferma
  status           text        default 'pending'
                               check (status in ('pending','confirmed','rejected','paid'))
);

-- Row Level Security
alter table requests enable row level security;

-- Admin (utenti autenticati) → accesso totale
create policy "Admin full access" on requests
  for all using (auth.role() = 'authenticated');

-- Ospiti → solo inserimento
create policy "Guest insert only" on requests
  for insert with check (true);

-- ============================================================
-- Se hai già creato la tabella in precedenza, aggiungi:
-- ALTER TABLE requests ADD COLUMN IF NOT EXISTS revolut_link text;
-- ALTER TABLE requests ADD COLUMN IF NOT EXISTS orario text;
-- ============================================================

-- ============================================================
-- Le Sicilien · CRM — Supabase Schema
-- Esegui nel SQL Editor del tuo progetto Supabase (dopo schema.sql)
-- ============================================================

-- ------------------------------------------------------------
-- PROFILES — membri del team collegati a auth.users, con ruolo
-- ------------------------------------------------------------
create table if not exists profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text        not null default 'sales'
                           check (role in ('admin','manager','sales','accountant','cleaning')),
  active      boolean     default true,
  created_at  timestamptz default now()
);

alter table profiles enable row level security;

create policy "Authenticated read profiles" on profiles
  for select using (auth.role() = 'authenticated');

create policy "Admin manage profiles" on profiles
  for all using (auth.role() = 'authenticated');

-- Crea automaticamente un profilo quando viene creato un utente auth
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'sales')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Helper generico per updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------
-- OWNERS — pipeline acquisizione + anagrafica proprietari immobili
-- ------------------------------------------------------------
create table if not exists owners (
  id              uuid        default gen_random_uuid() primary key,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  name            text        not null,
  company         text,
  email           text,
  phone           text,
  source          text,       -- referral, sito, evento, cold outreach...
  stage           text        not null default 'lead'
                               check (stage in ('lead','contattato','in_trattativa','contratto_inviato','attivo','in_pausa','perso')),
  commission_pct  numeric(5,2) default 20,
  notes           text,
  estimated_value numeric(10,2), -- ricavo annuo stimato dell'immobile, per dare priorità alla pipeline
  next_follow_up  date,          -- prossimo richiamo/contatto programmato
  lost_reason     text,          -- motivo quando stage = 'perso'
  assigned_to     uuid        references profiles(id) on delete set null,
  created_by      uuid        references profiles(id) on delete set null
);

-- Se la tabella owners esiste già da un'installazione precedente:
alter table owners add column if not exists estimated_value numeric(10,2);
alter table owners add column if not exists next_follow_up date;
alter table owners add column if not exists lost_reason text;

alter table owners enable row level security;
create policy "Authenticated full access owners" on owners
  for all using (auth.role() = 'authenticated');

create index if not exists owners_stage_idx on owners(stage);
create index if not exists owners_follow_up_idx on owners(next_follow_up);

drop trigger if exists owners_set_updated_at on owners;
create trigger owners_set_updated_at before update on owners
  for each row execute function set_updated_at();

-- Log attività / interazioni con il proprietario (timeline CRM)
create table if not exists owner_activities (
  id          uuid        default gen_random_uuid() primary key,
  created_at  timestamptz default now(),
  owner_id    uuid        not null references owners(id) on delete cascade,
  type        text        not null default 'note'
                           check (type in ('note','call','email','meeting','stage_change')),
  content     text        not null,
  created_by  uuid        references profiles(id) on delete set null
);

alter table owner_activities enable row level security;
create policy "Authenticated full access owner_activities" on owner_activities
  for all using (auth.role() = 'authenticated');

create index if not exists owner_activities_owner_idx on owner_activities(owner_id);

-- ------------------------------------------------------------
-- PROPERTIES — portfolio immobili gestiti
-- ------------------------------------------------------------
create table if not exists properties (
  id              uuid        default gen_random_uuid() primary key,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  owner_id        uuid        references owners(id) on delete set null,
  name            text        not null,
  address         text,
  city            text        default 'Palermo',
  type            text        default 'villa'
                               check (type in ('villa','appartamento','casa','yacht','altro')),
  bedrooms        integer,
  bathrooms       integer,
  max_guests      integer,
  base_price      numeric(10,2),
  cleaning_fee    numeric(10,2),
  commission_pct  numeric(5,2), -- override della commissione del proprietario, se impostata
  status          text        not null default 'onboarding'
                               check (status in ('onboarding','active','inactive')),
  photo_url       text,
  notes           text
);

alter table properties enable row level security;
create policy "Authenticated full access properties" on properties
  for all using (auth.role() = 'authenticated');

create index if not exists properties_owner_idx on properties(owner_id);
create index if not exists properties_status_idx on properties(status);

drop trigger if exists properties_set_updated_at on properties;
create trigger properties_set_updated_at before update on properties
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- GUESTS — anagrafica ospiti (CRM ospiti / storico / marketing)
-- ------------------------------------------------------------
create table if not exists guests (
  id                uuid        default gen_random_uuid() primary key,
  created_at        timestamptz default now(),
  name              text        not null,
  email             text,
  phone             text,
  nationality       text,
  tags              text[],
  notes             text,
  marketing_opt_in  boolean     default false
);

alter table guests enable row level security;
create policy "Authenticated full access guests" on guests
  for all using (auth.role() = 'authenticated');

create index if not exists guests_email_idx on guests(email);

-- ------------------------------------------------------------
-- BOOKINGS — prenotazioni per immobile
-- ------------------------------------------------------------
create table if not exists bookings (
  id             uuid        default gen_random_uuid() primary key,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  property_id    uuid        not null references properties(id) on delete cascade,
  guest_id       uuid        references guests(id) on delete set null,
  guest_name     text,
  guest_email    text,
  guest_phone    text,
  channel        text        default 'diretta'
                              check (channel in ('diretta','airbnb','booking','vrbo','altro')),
  check_in       date        not null,
  check_out      date        not null,
  guests_count   integer     default 1,
  total_amount   numeric(10,2) default 0,
  commission_pct numeric(5,2),
  status         text        not null default 'confermata'
                              check (status in ('confermata','in_attesa','cancellata','completata')),
  notes          text,
  created_by     uuid        references profiles(id) on delete set null,
  check (check_out > check_in)
);

alter table bookings enable row level security;
create policy "Authenticated full access bookings" on bookings
  for all using (auth.role() = 'authenticated');

create index if not exists bookings_property_idx on bookings(property_id);
create index if not exists bookings_checkin_idx on bookings(check_in);
create index if not exists bookings_status_idx on bookings(status);

drop trigger if exists bookings_set_updated_at on bookings;
create trigger bookings_set_updated_at before update on bookings
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- TASKS — operatività: pulizie, manutenzioni, check-in/out
-- ------------------------------------------------------------
create table if not exists tasks (
  id            uuid        default gen_random_uuid() primary key,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  property_id   uuid        references properties(id) on delete cascade,
  booking_id    uuid        references bookings(id) on delete set null,
  type          text        not null default 'pulizia'
                             check (type in ('pulizia','manutenzione','check_in','check_out','altro')),
  title         text        not null,
  description   text,
  due_date      date,
  assigned_to   uuid        references profiles(id) on delete set null,
  status        text        not null default 'da_fare'
                             check (status in ('da_fare','in_corso','fatto')),
  created_by    uuid        references profiles(id) on delete set null
);

alter table tasks enable row level security;
create policy "Authenticated full access tasks" on tasks
  for all using (auth.role() = 'authenticated');

create index if not exists tasks_assigned_idx on tasks(assigned_to);
create index if not exists tasks_status_idx on tasks(status);
create index if not exists tasks_due_idx on tasks(due_date);

drop trigger if exists tasks_set_updated_at on tasks;
create trigger tasks_set_updated_at before update on tasks
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- EXPENSES — spese per immobile (usate nel calcolo dei payout)
-- ------------------------------------------------------------
create table if not exists expenses (
  id            uuid        default gen_random_uuid() primary key,
  created_at    timestamptz default now(),
  property_id   uuid        not null references properties(id) on delete cascade,
  category      text        default 'altro',
  amount        numeric(10,2) not null,
  expense_date  date        default current_date,
  description   text,
  created_by    uuid        references profiles(id) on delete set null
);

alter table expenses enable row level security;
create policy "Authenticated full access expenses" on expenses
  for all using (auth.role() = 'authenticated');

create index if not exists expenses_property_idx on expenses(property_id);

-- ------------------------------------------------------------
-- PAYOUTS — rendiconti/pagamenti periodici ai proprietari
-- ------------------------------------------------------------
create table if not exists payouts (
  id                 uuid        default gen_random_uuid() primary key,
  created_at         timestamptz default now(),
  owner_id           uuid        not null references owners(id) on delete cascade,
  period_start       date        not null,
  period_end         date        not null,
  gross_revenue      numeric(10,2) default 0,
  commission_amount  numeric(10,2) default 0,
  expenses_amount    numeric(10,2) default 0,
  net_payout         numeric(10,2) default 0,
  status             text        not null default 'bozza'
                                  check (status in ('bozza','inviato','pagato')),
  notes              text,
  created_by         uuid        references profiles(id) on delete set null,
  check (period_end > period_start)
);

alter table payouts enable row level security;
create policy "Authenticated full access payouts" on payouts
  for all using (auth.role() = 'authenticated');

create index if not exists payouts_owner_idx on payouts(owner_id);

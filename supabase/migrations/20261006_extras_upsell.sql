-- ============================================================
-- Extras upsell: richieste con date di soggiorno, pagamento SumUp
-- tracciato, nuovi servizi (protezione, pacchetti, soggiorno & regali).
-- Rieseguibile senza effetti collaterali.
-- ============================================================

alter table requests add column if not exists checkin           date;
alter table requests add column if not exists checkout          date;
alter table requests add column if not exists amount            numeric(10,2);
alter table requests add column if not exists sumup_checkout_id text;
alter table requests add column if not exists payment_link      text;
alter table requests add column if not exists paid_at           timestamptz;
alter table requests add column if not exists lang              text default 'it';
alter table requests add column if not exists kind              text default 'request';

create index if not exists requests_sumup_checkout_id_idx on requests (sumup_checkout_id);

-- I prezzi letti dal backend per i pagamenti online vengono da qui:
-- ogni servizio deve avere un service_id univoco.
create unique index if not exists services_service_id_key on services (service_id) where service_id is not null;

insert into services (service_id, name, category, price, description, active)
select v.service_id, v.name, v.category, v.price, v.description, true
from (values
  ('viaggia_tranquillo', 'Viaggia Tranquillo — niente cauzione, danni accidentali coperti fino a 1.000€', 'protezione', '9€/notte',
   'Nessuna cauzione da versare. Copre i danni accidentali alla struttura e agli arredi fino a 1.000€ (rotture, macchie, piccoli incidenti). Esclusi: danni intenzionali o da grave negligenza, feste non autorizzate, furti, smarrimento chiavi.'),
  ('smarrimento_chiavi', 'Protezione smarrimento chiavi — sostituzione e intervento senza costi', 'protezione', '15€/soggiorno',
   'Se perdete le chiavi o restate chiusi fuori, interveniamo e sostituiamo chiavi e serratura senza costi aggiuntivi.'),
  ('pk_arrivo',    'Arrivo Perfetto — transfer A/R, early check-in & kit benvenuto', 'pacchetti', '129€', 'Risparmi 11€ rispetto ai servizi singoli.'),
  ('pk_frigo_2',   'Frigo Pieno & Colazione — per 2 persone', 'pacchetti', '59€', 'Spesa base in frigo all''arrivo + colazione del primo giorno.'),
  ('pk_frigo_4',   'Frigo Pieno & Colazione — per 4 persone', 'pacchetti', '89€', 'Spesa base in frigo all''arrivo + colazione del primo giorno.'),
  ('pk_romantico', 'Romantico in Villa — fiori, prosecco, petali, candele & late checkout', 'pacchetti', '129€', null),
  ('pk_partenza',  'Partenza Comoda — late checkout, deposito bagagli & transfer', 'pacchetti', '109€', null),
  ('pk_famiglia',  'Famiglia Serena — kit bebè, 3h di babysitter & kit giochi', 'pacchetti', '99€', null),
  ('notte_extra',  'Notte extra prima o dopo il soggiorno', 'soggiorno', '-10% sulla tariffa', 'Verifichiamo la disponibilità e vi inviamo il prezzo scontato.'),
  ('pulizia_app',  'Pulizia extra a metà soggiorno — appartamento', 'soggiorno', '60€', null),
  ('pulizia_villa','Pulizia extra a metà soggiorno — villa', 'soggiorno', '100€', null),
  ('animali',      'Animali ammessi (cani — gatti non ammessi)', 'soggiorno', '50€/soggiorno', null),
  ('gift_100',     'Gift card Le Sicilien — 100€', 'soggiorno', '100€', null),
  ('gift_250',     'Gift card Le Sicilien — 250€', 'soggiorno', '250€', null),
  ('gift_500',     'Gift card Le Sicilien — 500€', 'soggiorno', '500€', null),
  ('gift_750',     'Gift card Le Sicilien — 750€', 'soggiorno', '750€', null),
  ('gift_1000',    'Gift card Le Sicilien — 1000€', 'soggiorno', '1000€', null)
) as v(service_id, name, category, price, description)
where not exists (select 1 from services s where s.service_id = v.service_id);

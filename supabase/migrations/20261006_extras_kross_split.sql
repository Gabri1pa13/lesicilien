-- ============================================================
-- I servizi prenotabili direttamente si vendono da Krossbooking
-- (guest portal + booking engine). Sul sito restano i servizi su
-- richiesta, la notte extra e le gift card.
-- Rieseguibile senza effetti collaterali.
-- ============================================================

update services set active = false
where service_id in (
  'viaggia_tranquillo', 'smarrimento_chiavi',
  'pk_frigo_2', 'pk_frigo_4', 'pk_romantico',
  'pulizia_app', 'pulizia_villa', 'animali',
  'kit_bebe'
);

update services set price = '-10%' where service_id = 'notte_extra';

import { createClient } from "@supabase/supabase-js";

const NAME_TO_ID = {
  "Transfer aeroporto — solo andata": "transfer_one",
  "Transfer aeroporto/stazione — A/R": "transfer_ar",
  "Servizio bagagli — deposito & consegna": "bagagli",
  "Early check-in (dalle 10:00)": "early_checkin",
  "Late check-in (dalle 23:00 in poi)": "late_checkin",
  "Late check-out (fino alle 18:00)": "late_checkout",
  "Kit benvenuto — vino & prodotti locali": "kit_base",
  "Kit benvenuto premium — champagne & dolci": "kit_premium",
  "Frigorifero pre-rifornito — spesa base": "frigo_base",
  "Frigorifero pre-rifornito — spesa premium": "frigo_premium",
  "Kit bebè — lettino, seggiolone & vasca": "kit_bebe",
  "Biancheria extra": "biancheria_extra",
  "Cambio biancheria mid-stay": "cambio_biancheria",
  "Servizio lavanderia": "lavanderia",
  "Servizio stireria": "stireria",
  "Colazione consegnata in villa": "colazione",
  "Private chef — cena per 2–4 persone": "chef_4",
  "Private chef — cena per 5–8 persone": "chef_8",
  "Prenotazione ristorante — corsia preferenziale": "ristorante",
  "Street food tour guidato (2h)": "streetfood",
  "Corso di cucina siciliana (3h, pranzo incluso)": "cucina",
  "Aperitivo di benvenuto in villa": "aperitivo_app",
  "Tour privato centro storico (3h · fino a 6 persone)": "tour_centro",
  "Escursione Etna — giornata intera con transfer": "etna",
  "Escursione Valle dei Templi": "templi",
  "Scala dei Turchi & Agrigento — giornata": "scala_turchi",
  "Visita cantina con degustazione": "cantina",
  "Tour mercati storici — Ballarò & Vucciria": "mercati",
  "Esperienza mattutina mercato del pesce": "mercato_pesce",
  "Aperitivo al Tramonto in Navigazione · 2.5h · max 12 pax": "whale_aperitivo_nav",
  "Aperitivo Esclusivo Ormeggiata · 2.5h · max 12 pax": "whale_aperitivo_orm",
  "Cena Gourmet Ormeggiata · 3.5h · max 8 pax": "whale_cena_orm",
  "Cena Panoramica in Navigazione · 4h · max 8 pax": "whale_cena_nav",
  "Giornata Completa in Catamarano · 10h · max 12 pax": "whale_giornata",
  "Luxury 2 Giorni · 39h · max 12 pax": "whale_2giorni",
  "Weekly Charter · 7 giorni / 6 notti · max 12 pax": "whale_weekly",
  "Massaggio rilassante in villa (60 min)": "massaggio_relax",
  "Massaggio decontratturante in villa (60 min)": "massaggio_dec",
  "Massaggio coppia — simultaneo (60 min)": "massaggio_coppia",
  "Personal trainer (sessione 60 min)": "personal_trainer",
  "Yoga privato in villa (60 min)": "yoga",
  "Babysitter certificata": "babysitter",
  "Guida turistica privata — mezza giornata (4h)": "guida_mezza",
  "Guida turistica privata — giornata intera": "guida_intera",
  "Assistente & interprete per pratiche": "interprete",
  "Servizio fotografico professionale (1h)": "foto_1h",
  "Servizio fotografico premium — editing incluso (2h)": "foto_2h",
  "Organizzazione proposta di matrimonio": "proposta",
  "Pacchetto luna di miele — kit, esperienze & foto": "luna_miele",
};

const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const NORM_TO_ID = {};
for (const [name, id] of Object.entries(NAME_TO_ID)) {
  NORM_TO_ID[norm(name)] = id;
}

export async function GET() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
  );

  const { data: services, error } = await supabase.from("services").select("id, name, service_id");
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  const results = { updated: [], skipped: [], unmatched: [] };

  for (const svc of services) {
    if (svc.service_id) { results.skipped.push(svc.name); continue; }
    const slug = NAME_TO_ID[svc.name] || NORM_TO_ID[norm(svc.name)];
    if (!slug) { results.unmatched.push(svc.name); continue; }
    const { error: upErr } = await supabase.from("services").update({ service_id: slug }).eq("id", svc.id);
    if (upErr) results.unmatched.push(`${svc.name} (err: ${upErr.message})`);
    else results.updated.push(`${svc.name} → ${slug}`);
  }

  return Response.json({ ok: true, ...results });
}

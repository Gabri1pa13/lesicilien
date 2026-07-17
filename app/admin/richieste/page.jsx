"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";

const WA_DEFAULT_TEMPLATE = `🛒 *Richiesta Concierge — Le Sicilien*\n\n*Servizio:* {servizio}\n*Prezzo:* {prezzo}\n*Nome:* {nome}\n*Email:* {email}\n*Tel:* {telefono}\n*Data:* {data} ore {orario}\n*Persone:* {persone}\n*Note:* {note}`;

function WaPreview({ text }) {
  if (!text) return null;
  const parts = text.split(/(\{[a-z]+\})/g);
  return (
    <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#3A3530", background: "#F7F4EE", border: "1px solid #E0D9CC", padding: "10px 13px", whiteSpace: "pre-wrap", lineHeight: "1.7", marginTop: "6px" }}>
      {parts.map((part, i) =>
        /^\{[a-z]+\}$/.test(part)
          ? <span key={i} style={{ color: "#0891b2", fontWeight: "600" }}>{part}</span>
          : part
      )}
    </div>
  );
}
import { createClient } from "@supabase/supabase-js";

const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const REVOLUT_BASE = "https://revolut.me/gabriel1r6";

const BRAND = {
  gold: "#BFA05A", cream: "#FAF8F3",
  dark: "#1A1814", border: "#E0D9CC", textMuted: "#8A8278",
};

const STATUS = {
  pending:   { label: "In attesa",  color: "#92702A", bg: "#FDF6E3", dot: "#E6A817" },
  confirmed: { label: "Confermata", color: "#2E7D32", bg: "#E8F5E9", dot: "#4CAF50" },
  rejected:  { label: "Rifiutata",  color: "#C62828", bg: "#FFEBEE", dot: "#EF5350" },
  paid:      { label: "Pagata ✓",   color: "#1565C0", bg: "#E3F2FD", dot: "#42A5F5" },
};

const CATEGORIES = [
  { slug: "trasporti", label: "Trasporti & Logistica" },
  { slug: "comfort",   label: "Comfort" },
  { slug: "chef",      label: "Private Chef & Dining" },
  { slug: "esperienze",label: "Esperienze & Tour Privati" },
  { slug: "yacht",     label: "Yacht Charter" },
  { slug: "wellness",  label: "Wellness & Benessere" },
  { slug: "famiglia",  label: "Famiglia & Assistenza" },
  { slug: "momenti",   label: "Momenti Indimenticabili" },
];

const CATALOG_FLAT = [
  // Trasporti & Logistica
  { id: "transfer_one",        name: "Transfer aeroporto — solo andata",                        category: "trasporti", category_label: "Trasporti & Logistica",      price: "45€",           mode: "direct",   revolut_amount: 45,  sort_order: 0 },
  { id: "transfer_ar",         name: "Transfer aeroporto/stazione — A/R",                        category: "trasporti", category_label: "Trasporti & Logistica",      price: "80€",           mode: "direct",   revolut_amount: 80,  sort_order: 1 },
  { id: "bagagli",             name: "Servizio bagagli — deposito & consegna",                   category: "trasporti", category_label: "Trasporti & Logistica",      price: "10€",           mode: "direct",   revolut_amount: 10,  sort_order: 2 },
  // Comfort in Villa
  { id: "early_checkin",       name: "Early check-in (dalle 10:00)",                            category: "comfort",   category_label: "Comfort",           price: "25€",           mode: "direct",   revolut_amount: 25,  sort_order: 0 },
  { id: "late_checkin",        name: "Late check-in (dalle 23:00 in poi)",                      category: "comfort",   category_label: "Comfort",           price: "20€",           mode: "direct",   revolut_amount: 20,  sort_order: 1 },
  { id: "late_checkout",       name: "Late check-out (fino alle 18:00)",                        category: "comfort",   category_label: "Comfort",           price: "30€",           mode: "request",  revolut_amount: null, sort_order: 2 },
  { id: "kit_base",            name: "Kit benvenuto — vino & prodotti locali",                  category: "comfort",   category_label: "Comfort",           price: "35€",           mode: "direct",   revolut_amount: 35,  sort_order: 3 },
  { id: "kit_premium",         name: "Kit benvenuto premium — champagne & dolci",               category: "comfort",   category_label: "Comfort",           price: "65€",           mode: "direct",   revolut_amount: 65,  sort_order: 4 },
  { id: "frigo_base",          name: "Frigorifero pre-rifornito — spesa base",                  category: "comfort",   category_label: "Comfort",           price: "40€",           mode: "request",  revolut_amount: null, sort_order: 5 },
  { id: "frigo_premium",       name: "Frigorifero pre-rifornito — spesa premium",               category: "comfort",   category_label: "Comfort",           price: "80€",           mode: "request",  revolut_amount: null, sort_order: 6 },
  { id: "kit_bebe",            name: "Kit bebè — lettino, seggiolone & vasca",                  category: "comfort",   category_label: "Comfort",           price: "30€/soggiorno", mode: "request",  revolut_amount: null, sort_order: 7 },
  { id: "biancheria_extra",    name: "Biancheria extra",                                        category: "comfort",   category_label: "Comfort",           price: "15€",           mode: "direct",   revolut_amount: 15,  sort_order: 8 },
  { id: "cambio_biancheria",   name: "Cambio biancheria mid-stay",                              category: "comfort",   category_label: "Comfort",           price: "20€",           mode: "request",  revolut_amount: null, sort_order: 9 },
  { id: "lavanderia",          name: "Servizio lavanderia",                                     category: "comfort",   category_label: "Comfort",           price: "20€",           mode: "request",  revolut_amount: null, sort_order: 10 },
  { id: "stireria",            name: "Servizio stireria",                                       category: "comfort",   category_label: "Comfort",           price: "15€",           mode: "request",  revolut_amount: null, sort_order: 11 },
  // Private Chef & Dining
  { id: "colazione",           name: "Colazione consegnata in villa",                           category: "chef",      category_label: "Private Chef & Dining",      price: "12€/persona",   mode: "request",  revolut_amount: null, sort_order: 0 },
  { id: "chef_4",              name: "Private chef — cena per 2–4 persone",                    category: "chef",      category_label: "Private Chef & Dining",      price: "120€",          mode: "request",  revolut_amount: null, sort_order: 1 },
  { id: "chef_8",              name: "Private chef — cena per 5–8 persone",                    category: "chef",      category_label: "Private Chef & Dining",      price: "200€",          mode: "request",  revolut_amount: null, sort_order: 2 },
  { id: "ristorante",          name: "Prenotazione ristorante — corsia preferenziale",          category: "chef",      category_label: "Private Chef & Dining",      price: "10€",           mode: "direct",   revolut_amount: 10,  sort_order: 3 },
  { id: "streetfood",          name: "Street food tour guidato (2h)",                           category: "chef",      category_label: "Private Chef & Dining",      price: "35€/persona",   mode: "request",  revolut_amount: null, sort_order: 4 },
  { id: "cucina",              name: "Corso di cucina siciliana (3h, pranzo incluso)",          category: "chef",      category_label: "Private Chef & Dining",      price: "75€/persona",   mode: "request",  revolut_amount: null, sort_order: 5 },
  { id: "aperitivo_app",       name: "Aperitivo di benvenuto in villa",                        category: "chef",      category_label: "Private Chef & Dining",      price: "25€/persona",   mode: "request",  revolut_amount: null, sort_order: 6 },
  // Esperienze & Tour Privati
  { id: "tour_centro",         name: "Tour privato centro storico (3h · fino a 6 persone)",    category: "esperienze",category_label: "Esperienze & Tour Privati",   price: "80€",           mode: "request",  revolut_amount: null, sort_order: 0 },
  { id: "etna",                name: "Escursione Etna — giornata intera con transfer",          category: "esperienze",category_label: "Esperienze & Tour Privati",   price: "90€/persona",   mode: "request",  revolut_amount: null, sort_order: 1 },
  { id: "templi",              name: "Escursione Valle dei Templi",                             category: "esperienze",category_label: "Esperienze & Tour Privati",   price: "85€/persona",   mode: "request",  revolut_amount: null, sort_order: 2 },
  { id: "scala_turchi",        name: "Scala dei Turchi & Agrigento — giornata",                category: "esperienze",category_label: "Esperienze & Tour Privati",   price: "90€/persona",   mode: "request",  revolut_amount: null, sort_order: 3 },
  { id: "cantina",             name: "Visita cantina con degustazione",                        category: "esperienze",category_label: "Esperienze & Tour Privati",   price: "55€/persona",   mode: "request",  revolut_amount: null, sort_order: 4 },
  { id: "mercati",             name: "Tour mercati storici — Ballarò & Vucciria",              category: "esperienze",category_label: "Esperienze & Tour Privati",   price: "25€/persona",   mode: "request",  revolut_amount: null, sort_order: 5 },
  { id: "mercato_pesce",       name: "Esperienza mattutina mercato del pesce",                 category: "esperienze",category_label: "Esperienze & Tour Privati",   price: "20€/persona",   mode: "request",  revolut_amount: null, sort_order: 6 },
  // Yacht Charter
  { id: "whale_aperitivo_nav", name: "Aperitivo al Tramonto in Navigazione · 2.5h · max 12 pax", category: "yacht",  category_label: "Yacht Charter",              price: "da 2.700€",     mode: "request",  revolut_amount: null, sort_order: 0 },
  { id: "whale_aperitivo_orm", name: "Aperitivo Esclusivo Ormeggiata · 2.5h · max 12 pax",    category: "yacht",     category_label: "Yacht Charter",              price: "da 1.800€",     mode: "request",  revolut_amount: null, sort_order: 1 },
  { id: "whale_cena_orm",      name: "Cena Gourmet Ormeggiata · 3.5h · max 8 pax",            category: "yacht",     category_label: "Yacht Charter",              price: "da 2.000€",     mode: "request",  revolut_amount: null, sort_order: 2 },
  { id: "whale_cena_nav",      name: "Cena Panoramica in Navigazione · 4h · max 8 pax",       category: "yacht",     category_label: "Yacht Charter",              price: "da 3.000€",     mode: "request",  revolut_amount: null, sort_order: 3 },
  { id: "whale_giornata",      name: "Giornata Completa in Catamarano · 10h · max 12 pax",    category: "yacht",     category_label: "Yacht Charter",              price: "da 3.000€",     mode: "request",  revolut_amount: null, sort_order: 4 },
  { id: "whale_2giorni",       name: "Luxury 2 Giorni · 39h · max 12 pax",                    category: "yacht",     category_label: "Yacht Charter",              price: "da 6.000€",     mode: "request",  revolut_amount: null, sort_order: 5 },
  { id: "whale_weekly",        name: "Weekly Charter · 7 giorni / 6 notti · max 12 pax",      category: "yacht",     category_label: "Yacht Charter",              price: "da 15.000€",    mode: "request",  revolut_amount: null, sort_order: 6 },
  // Wellness & Benessere
  { id: "massaggio_relax",     name: "Massaggio rilassante in villa (60 min)",                 category: "wellness",  category_label: "Wellness & Benessere",       price: "70€",           mode: "request",  revolut_amount: null, sort_order: 0 },
  { id: "massaggio_dec",       name: "Massaggio decontratturante in villa (60 min)",           category: "wellness",  category_label: "Wellness & Benessere",       price: "80€",           mode: "request",  revolut_amount: null, sort_order: 1 },
  { id: "massaggio_coppia",    name: "Massaggio coppia — simultaneo (60 min)",                 category: "wellness",  category_label: "Wellness & Benessere",       price: "130€",          mode: "request",  revolut_amount: null, sort_order: 2 },
  { id: "personal_trainer",    name: "Personal trainer (sessione 60 min)",                     category: "wellness",  category_label: "Wellness & Benessere",       price: "50€",           mode: "request",  revolut_amount: null, sort_order: 3 },
  { id: "yoga",                name: "Yoga privato in villa (60 min)",                         category: "wellness",  category_label: "Wellness & Benessere",       price: "45€",           mode: "request",  revolut_amount: null, sort_order: 4 },
  // Famiglia & Assistenza
  { id: "babysitter",          name: "Babysitter certificata",                                 category: "famiglia",  category_label: "Famiglia & Assistenza",      price: "15€/h",         mode: "request",  revolut_amount: null, sort_order: 0 },
  { id: "guida_mezza",         name: "Guida turistica privata — mezza giornata (4h)",          category: "famiglia",  category_label: "Famiglia & Assistenza",      price: "120€",          mode: "request",  revolut_amount: null, sort_order: 1 },
  { id: "guida_intera",        name: "Guida turistica privata — giornata intera",              category: "famiglia",  category_label: "Famiglia & Assistenza",      price: "200€",          mode: "request",  revolut_amount: null, sort_order: 2 },
  { id: "interprete",          name: "Assistente & interprete per pratiche",                   category: "famiglia",  category_label: "Famiglia & Assistenza",      price: "40€/h",         mode: "request",  revolut_amount: null, sort_order: 3 },
  // Momenti Indimenticabili
  { id: "foto_1h",             name: "Servizio fotografico professionale (1h)",                category: "momenti",   category_label: "Momenti Indimenticabili",    price: "120€",          mode: "request",  revolut_amount: null, sort_order: 0 },
  { id: "foto_2h",             name: "Servizio fotografico premium — editing incluso (2h)",    category: "momenti",   category_label: "Momenti Indimenticabili",    price: "200€",          mode: "request",  revolut_amount: null, sort_order: 1 },
  { id: "proposta",            name: "Organizzazione proposta di matrimonio",                  category: "momenti",   category_label: "Momenti Indimenticabili",    price: "350€",          mode: "request",  revolut_amount: null, sort_order: 2 },
  { id: "luna_miele",          name: "Pacchetto luna di miele — kit, esperienze & foto",       category: "momenti",   category_label: "Momenti Indimenticabili",    price: "450€",          mode: "request",  revolut_amount: null, sort_order: 3 },
];

// ─── MODAL CONFERMA ──────────────────────────────────────────────────────────
function ConfirmModal({ request, onClose, onConfirmed }) {
  const [importo, setImporto] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const revolutLink = importo ? `${REVOLUT_BASE}/${importo.replace(/[^0-9]/g, "")}` : "";

  const handleConfirm = async () => {
    if (!importo) { setError("Inserisci l'importo da richiedere al cliente"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id, email: request.email, nome: request.nome,
          serviceName: request.service_name, servicePrice: request.service_price,
          dataDesiderata: request.data_desiderata, persone: request.persone,
          revolutLink, messageExtra: message,
        }),
      });
      if (!res.ok) throw new Error();
      onConfirmed(request.id);
      onClose();
    } catch { setError("Errore nell'invio. Riprova."); }
    setLoading(false);
  };

  return (
    <div style={cm.overlay} onClick={onClose}>
      <div style={cm.modal} onClick={e => e.stopPropagation()}>
        <div style={cm.header}>
          <p style={cm.tag}>CONFERMA DISPONIBILITÀ</p>
          <h3 style={cm.title}>{request.service_name}</h3>
          <p style={cm.sub}>
            <strong>{request.nome}</strong> · {request.email}
            {request.data_desiderata && ` · ${request.data_desiderata}`}
            {request.persone && ` · ${request.persone} pax`}
          </p>
        </div>
        <div style={cm.divider} />
        <div style={cm.body}>
          <div style={cm.field}>
            <label style={cm.fieldLabel}>Importo da richiedere (€) <span style={{ color: BRAND.gold }}>*</span></label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input style={{ ...cm.input, flex: 1 }} type="number" placeholder="es. 3500"
                value={importo} onChange={e => { setImporto(e.target.value); setError(""); }} />
              <span style={cm.importoLabel}>€</span>
            </div>
            {importo && (
              <div style={cm.linkPreview}>
                <span style={cm.linkPreviewLabel}>Link generato:</span>
                <a href={revolutLink} target="_blank" rel="noreferrer" style={cm.linkPreviewUrl}>{revolutLink}</a>
              </div>
            )}
            {error && <p style={cm.error}>{error}</p>}
          </div>
          <div style={cm.field}>
            <label style={cm.fieldLabel}>Messaggio al cliente (opzionale)</label>
            <textarea style={cm.textarea} rows={3}
              placeholder="es. Vi aspettiamo sabato alle 19:30 al porto..."
              value={message} onChange={e => setMessage(e.target.value)} />
          </div>
          <div style={cm.preview}>
            <p style={cm.previewTag}>📧 EMAIL AL CLIENTE</p>
            <p style={cm.previewText}>
              Il cliente riceverà: conferma disponibilità · riepilogo servizio
              {importo && ` · link pagamento Revolut (${importo}€)`}
              {message && " · il tuo messaggio personalizzato"}
            </p>
          </div>
        </div>
        <div style={cm.footer}>
          <button style={cm.btnCancel} onClick={onClose}>Annulla</button>
          <button
            style={{ ...cm.btnConfirm, opacity: importo ? 1 : 0.45, cursor: importo ? "pointer" : "not-allowed" }}
            onClick={handleConfirm} disabled={loading || !importo}>
            {loading ? "Invio..." : "✓ Conferma & Invia Email"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL RIFIUTO ────────────────────────────────────────────────────────────
function RejectModal({ request, onClose, onRejected }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id, email: request.email, nome: request.nome,
          serviceName: request.service_name, dataDesiderata: request.data_desiderata,
          messageExtra: message,
        }),
      });
      onRejected(request.id);
      onClose();
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div style={cm.overlay} onClick={onClose}>
      <div style={{ ...cm.modal, maxWidth: "460px" }} onClick={e => e.stopPropagation()}>
        <div style={cm.header}>
          <p style={{ ...cm.tag, color: "#EF5350" }}>RIFIUTO RICHIESTA</p>
          <h3 style={cm.title}>{request.service_name}</h3>
          <p style={cm.sub}>Il cliente riceverà un'email cortese di rifiuto.</p>
        </div>
        <div style={cm.divider} />
        <div style={cm.body}>
          <div style={cm.field}>
            <label style={cm.fieldLabel}>Motivazione / messaggio al cliente (opzionale)</label>
            <textarea style={cm.textarea} rows={3}
              placeholder="es. Siamo spiacenti, non siamo disponibili nella data richiesta..."
              value={message} onChange={e => setMessage(e.target.value)} />
          </div>
        </div>
        <div style={cm.footer}>
          <button style={cm.btnCancel} onClick={onClose}>Annulla</button>
          <button style={{ ...cm.btnConfirm, background: "#C62828" }} onClick={handleReject} disabled={loading}>
            {loading ? "Invio..." : "✕ Rifiuta & Notifica Cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL SERVIZIO (crea / modifica) ────────────────────────────────────────
function ServiceModal({ service, onClose, onSaved }) {
  const isEdit = !!service;
  const catDefault = CATEGORIES[0];
  const [form, setForm] = useState({
    name:           service?.name           || "",
    category:       service?.category       || catDefault.slug,
    category_label: service?.category_label || catDefault.label,
    description:    service?.description    || "",
    wa_message:     service?.wa_message     || WA_DEFAULT_TEMPLATE,
    price:          service?.price          || "",
    revolut_amount: service?.revolut_amount != null ? String(service.revolut_amount) : "",
    deposit_amount: service?.deposit_amount != null ? String(service.deposit_amount) : "",
    total_amount:   service?.total_amount   != null ? String(service.total_amount)   : "",
    mode:           service?.mode           || "request",
    sort_order:     service?.sort_order     != null ? String(service.sort_order) : "0",
    active:         service?.active         !== false,
    image_url:      service?.image_url      || null,
  });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError]     = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleCategoryChange = (slug) => {
    const cat = CATEGORIES.find(c => c.slug === slug) || catDefault;
    setForm(p => ({ ...p, category: cat.slug, category_label: cat.label }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUploading(true); setImgError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/services/image", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Errore upload");
      set("image_url", json.url);
    } catch (err) { setImgError(err.message); }
    setImgUploading(false);
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!form.name.trim())  { setError("Il nome è obbligatorio");   return; }
    if (!form.price.trim()) { setError("Il prezzo è obbligatorio");  return; }
    setLoading(true); setError("");
    try {
      const payload = {
        ...form,
        revolut_amount: form.revolut_amount ? parseInt(form.revolut_amount)   : null,
        deposit_amount: form.deposit_amount ? parseFloat(form.deposit_amount) : null,
        total_amount:   form.total_amount   ? parseFloat(form.total_amount)   : null,
        wa_message:     (form.wa_message.trim() && form.wa_message.trim() !== WA_DEFAULT_TEMPLATE) ? form.wa_message.trim() : null,
        sort_order:     parseInt(form.sort_order) || 0,
        ...(isEdit ? { id: service.id } : {}),
      };
      const res = await fetch("/api/admin/services", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Errore");
      onSaved(json.data, !isEdit);
      onClose();
    } catch (e) { setError(e.message || "Errore nel salvataggio. Riprova."); }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", background: "#fff", border: `1px solid ${BRAND.border}`,
    padding: "10px 13px", fontSize: "14px", fontFamily: "'Jost',sans-serif",
    color: BRAND.dark, transition: "border-color .2s",
  };
  const labelStyle = {
    display: "block", fontSize: "9px", letterSpacing: ".18em",
    color: BRAND.textMuted, textTransform: "uppercase", marginBottom: "7px",
  };

  return (
    <div style={cm.overlay} onClick={onClose}>
      <div style={{ ...cm.modal, maxWidth: "560px" }} onClick={e => e.stopPropagation()}>
        <div style={cm.header}>
          <p style={cm.tag}>{isEdit ? "MODIFICA SERVIZIO" : "NUOVO SERVIZIO"}</p>
          <h3 style={cm.title}>{isEdit ? service.name : "Aggiungi un servizio"}</h3>
        </div>
        <div style={cm.divider} />
        <div style={{ ...cm.body, display: "grid", gap: "16px" }}>

          {/* Nome */}
          <div>
            <label style={labelStyle}>Nome servizio *</label>
            <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)}
              placeholder="es. Transfer aeroporto — solo andata" />
          </div>

          {/* Categoria + Prezzo */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Categoria *</label>
              <select style={{ ...inputStyle, cursor: "pointer" }}
                value={form.category} onChange={e => handleCategoryChange(e.target.value)}>
                {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Prezzo (testo) *</label>
              <input style={inputStyle} value={form.price} onChange={e => set("price", e.target.value)}
                placeholder="es. 45€ oppure da 2.700€" />
            </div>
          </div>

          {/* Modalità + Importo Revolut */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Modalità *</label>
              <select style={{ ...inputStyle, cursor: "pointer" }}
                value={form.mode} onChange={e => set("mode", e.target.value)}>
                <option value="request">Su richiesta</option>
                <option value="direct">Prenotazione diretta (Revolut)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Importo Revolut (€){form.mode === "direct" ? " *" : ""}</label>
              <input style={inputStyle} type="number" value={form.revolut_amount}
                onChange={e => set("revolut_amount", e.target.value)}
                placeholder={form.mode === "direct" ? "es. 45" : "—"}
                disabled={form.mode !== "direct"} />
            </div>
          </div>

          {/* Descrizione */}
          <div>
            <label style={labelStyle}>Descrizione (mostrata all'ospite al momento della prenotazione)</label>
            <textarea style={{ ...inputStyle, resize: "vertical" }} rows={2}
              value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Dettagli aggiuntivi mostrati al cliente..." />
            <p style={{ fontSize: "11px", color: BRAND.textMuted, fontFamily: "'Jost',sans-serif", marginTop: "-10px" }}>
              La descrizione viene tradotta automaticamente in tutte le lingue (EN, FR, DE, PL, ZH) al salvataggio.
            </p>
          </div>

          {/* Messaggio WhatsApp */}
          <div>
            <label style={labelStyle}>Messaggio WhatsApp</label>
            <p style={{ fontSize: "11px", color: BRAND.textMuted, fontFamily: "'Jost',sans-serif", marginBottom: "8px" }}>
              Le variabili in <span style={{ color: "#0891b2", fontWeight: "600" }}>celeste</span> vengono sostituite automaticamente con i dati inseriti dall'ospite.
            </p>
            <textarea style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: "12px" }} rows={9}
              value={form.wa_message} onChange={e => set("wa_message", e.target.value)} />
            <p style={{ fontSize: "10px", color: BRAND.textMuted, fontFamily: "'Jost',sans-serif", marginTop: "6px", marginBottom: "4px" }}>ANTEPRIMA</p>
            <WaPreview text={form.wa_message} />
          </div>

          {/* Pagamento parziale */}
          <div>
            <label style={labelStyle}>Pagamento parziale (opzionale)</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ ...labelStyle, marginBottom: "5px" }}>Acconto (€)</label>
                <input style={inputStyle} type="number" value={form.deposit_amount}
                  onChange={e => set("deposit_amount", e.target.value)} placeholder="es. 500" />
              </div>
              <div>
                <label style={{ ...labelStyle, marginBottom: "5px" }}>Totale (€)</label>
                <input style={inputStyle} type="number" value={form.total_amount}
                  onChange={e => set("total_amount", e.target.value)} placeholder="es. 3000" />
              </div>
            </div>
            {form.deposit_amount && form.total_amount && parseFloat(form.total_amount) > parseFloat(form.deposit_amount) && (
              <p style={{ fontSize: "11px", color: BRAND.textMuted, fontFamily: "'Jost',sans-serif", marginTop: "7px" }}>
                Saldo rimanente: {(parseFloat(form.total_amount) - parseFloat(form.deposit_amount)).toFixed(0)}€ — da saldare all'erogazione del servizio
              </p>
            )}
          </div>

          {/* Immagine */}
          <div>
            <label style={labelStyle}>Immagine del servizio</label>
            {form.image_url ? (
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <img src={form.image_url} alt="" style={{ width: "120px", height: "76px", objectFit: "cover", border: `1px solid ${BRAND.border}`, display: "block" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ display: "inline-block", padding: "6px 14px", fontSize: "10px", letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", background: "transparent", color: BRAND.textMuted, border: `1px solid ${BRAND.border}`, fontFamily: "'Jost',sans-serif" }}>
                    ↑ Cambia
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} disabled={imgUploading} />
                  </label>
                  <button type="button" style={{ padding: "6px 14px", fontSize: "10px", letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", background: "#FFEBEE", color: "#C62828", border: "1px solid #EF9A9A", fontFamily: "'Jost',sans-serif" }}
                    onClick={() => set("image_url", null)}>✕ Rimuovi</button>
                </div>
              </div>
            ) : (
              <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px", border: `1px dashed ${BRAND.border}`, cursor: imgUploading ? "wait" : "pointer", background: "#fff" }}>
                <span style={{ fontSize: "12px", color: BRAND.textMuted, fontFamily: "'Jost',sans-serif" }}>
                  {imgUploading ? "Caricamento in corso..." : "📎 Clicca per caricare un'immagine (JPG, PNG, WebP)"}
                </span>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} disabled={imgUploading} />
              </label>
            )}
            {imgError && <p style={{ fontSize: "11px", color: "#C62828", marginTop: "6px", fontFamily: "'Jost',sans-serif" }}>{imgError}</p>}
          </div>

          {/* Ordine + Attivo */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", alignItems: "end" }}>
            <div>
              <label style={labelStyle}>Ordine (posizione nella categoria)</label>
              <input style={inputStyle} type="number" value={form.sort_order}
                onChange={e => set("sort_order", e.target.value)} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "2px" }}>
              <input type="checkbox" id="svc_active" checked={form.active}
                onChange={e => set("active", e.target.checked)}
                style={{ width: "16px", height: "16px", cursor: "pointer" }} />
              <label htmlFor="svc_active" style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>
                Visibile ai clienti
              </label>
            </div>
          </div>

          {error && <p style={{ fontSize: "12px", color: "#C62828", fontWeight: "500" }}>{error}</p>}
        </div>
        <div style={cm.footer}>
          <button style={cm.btnCancel} onClick={onClose}>Annulla</button>
          <button style={cm.btnConfirm} onClick={handleSave} disabled={loading}>
            {loading ? "Salvataggio..." : isEdit ? "✓ Salva modifiche" : "✓ Crea servizio"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TAB FOTO CATALOGO ────────────────────────────────────────────────────────
function CatalogPhotosTab() {
  const [dbServices, setDbServices] = useState([]);
  const [imgMap, setImgMap]         = useState({}); // catalog item id → image_url
  const [nameToDb, setNameToDb]     = useState({}); // service name → db record
  const [uploading, setUploading]   = useState({}); // item id → bool
  const [errors, setErrors]         = useState({}); // item id → error string

  useEffect(() => { loadDb(); }, []);

  const loadDb = async () => {
    const res = await fetch("/api/admin/services");
    const { data } = await res.json();
    const services = data || [];
    setDbServices(services);
    const nm = {};
    const bySlug = {};
    services.forEach(s => {
      nm[s.name] = s;
      if (s.service_id) bySlug[s.service_id] = s;
    });
    setNameToDb(nm);
    const im = {};
    CATALOG_FLAT.forEach(item => {
      const svc = bySlug[item.id] || nm[item.name];
      if (svc?.image_url) im[item.id] = svc.image_url;
    });
    setImgMap(im);
  };

  const handleUpload = async (e, item) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(p => ({ ...p, [item.id]: true }));
    setErrors(p => ({ ...p, [item.id]: "" }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/admin/services/image", { method: "POST", body: fd });
      const { url, error: upErr } = await uploadRes.json();
      if (!uploadRes.ok || !url) throw new Error(upErr || "Upload fallito");

      const existing = nameToDb[item.name];
      if (existing) {
        const updates = { image_url: url };
        if (!existing.service_id) updates.service_id = item.id;
        const r = await fetch("/api/admin/services", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: existing.id, ...updates }),
        });
        if (!r.ok) throw new Error("Salvataggio fallito");
      } else {
        const r = await fetch("/api/admin/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_id: item.id,
            name: item.name, category: item.category, category_label: item.category_label,
            price: item.price, mode: item.mode, revolut_amount: item.revolut_amount,
            sort_order: item.sort_order, active: true, image_url: url,
          }),
        });
        if (!r.ok) throw new Error("Salvataggio fallito");
      }
      setImgMap(p => ({ ...p, [item.id]: url }));
      await loadDb();
    } catch (err) {
      setErrors(p => ({ ...p, [item.id]: err.message }));
    }
    setUploading(p => ({ ...p, [item.id]: false }));
  };

  const handleRemove = async (item) => {
    const existing = nameToDb[item.name];
    if (!existing) return;
    await fetch("/api/admin/services", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: existing.id, image_url: null }),
    });
    setImgMap(p => { const n = { ...p }; delete n[item.id]; return n; });
    await loadDb();
  };

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: CATALOG_FLAT.filter(item => item.category === cat.slug),
  }));

  return (
    <div>
      <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "13px", color: BRAND.textMuted, marginBottom: "24px" }}>
        Gestisci le foto del catalogo servizi. Le immagini vengono mostrate sulla pagina Servizi del sito.
      </p>
      {grouped.map(group => (
        <div key={group.slug} style={{ marginBottom: "36px" }}>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "18px", fontWeight: "400", color: BRAND.dark, marginBottom: "12px", paddingBottom: "8px", borderBottom: `1px solid ${BRAND.border}` }}>
            {group.label}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "12px" }}>
            {group.items.map(item => {
              const imgUrl   = imgMap[item.id];
              const isUp     = uploading[item.id];
              const errMsg   = errors[item.id];
              return (
                <div key={item.id} style={{ background: "#fff", border: `1px solid ${BRAND.border}`, display: "flex", flexDirection: "column" }}>
                  {imgUrl ? (
                    <img src={imgUrl} alt={item.name} style={{ width: "100%", height: "120px", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ width: "100%", height: "120px", background: BRAND.cream, display: "flex", alignItems: "center", justifyContent: "center", border: `1px dashed ${BRAND.border}` }}>
                      <span style={{ fontSize: "11px", color: BRAND.textMuted, fontFamily: "'Jost',sans-serif" }}>Nessuna foto</span>
                    </div>
                  )}
                  <div style={{ padding: "8px 10px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                    <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "11px", color: BRAND.dark, lineHeight: "1.4" }}>{item.name}</p>
                    {errMsg && <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "10px", color: "#C62828" }}>{errMsg}</p>}
                    <div style={{ display: "flex", gap: "6px", marginTop: "auto" }}>
                      <label style={{
                        flex: 1, textAlign: "center", padding: "5px 8px", fontSize: "10px",
                        letterSpacing: ".08em", textTransform: "uppercase", cursor: isUp ? "wait" : "pointer",
                        background: BRAND.dark, color: BRAND.gold, border: "none",
                        fontFamily: "'Jost',sans-serif", whiteSpace: "nowrap",
                      }}>
                        {isUp ? "..." : imgUrl ? "↑ Cambia" : "+ Foto"}
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleUpload(e, item)} disabled={isUp} />
                      </label>
                      {imgUrl && (
                        <button onClick={() => handleRemove(item)} style={{
                          padding: "5px 8px", fontSize: "10px", cursor: "pointer",
                          background: "#FFEBEE", color: "#C62828", border: "1px solid #EF9A9A",
                          fontFamily: "'Jost',sans-serif",
                        }}>✕</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TAB SERVIZI ──────────────────────────────────────────────────────────────
function ServicesTab() {
  const [services, setServices]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editModal, setEditModal]   = useState(null); // null | service | "new"
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/services");
    const { data } = await res.json();
    setServices(data || []);
    setLoading(false);
  };

  const handleSaved = (data, isNew) => {
    if (isNew) setServices(p => [...p, data]);
    else setServices(p => p.map(s => s.id === data.id ? data : s));
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch("/api/admin/services", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    setServices(p => p.filter(s => s.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  };

  const toggleActive = async (svc) => {
    const res = await fetch("/api/admin/services", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: svc.id, active: !svc.active }),
    });
    const { data } = await res.json();
    setServices(p => p.map(s => s.id === svc.id ? data : s));
  };

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: services.filter(s => s.category === cat.slug).sort((a, b) => a.sort_order - b.sort_order),
  })).filter(g => g.items.length > 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "13px", color: BRAND.textMuted }}>
          {services.length} servizi totali · {services.filter(s => s.active).length} visibili
        </p>
        <button style={s.refreshBtn} onClick={() => setEditModal("new")}>+ Nuovo servizio</button>
      </div>

      {loading ? (
        <div style={s.empty}>Caricamento...</div>
      ) : services.length === 0 ? (
        <div style={s.empty}>Nessun servizio. Clicca "+ Nuovo servizio" per iniziare.</div>
      ) : (
        grouped.map(group => (
          <div key={group.slug} style={{ marginBottom: "32px" }}>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "18px", fontWeight: "400", color: BRAND.dark, marginBottom: "12px", paddingBottom: "8px", borderBottom: `1px solid ${BRAND.border}` }}>
              {group.label}
            </p>
            <div style={{ background: "#fff", border: `1px solid ${BRAND.border}` }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Nome", "Prezzo", "Modalità", "Stato", "Azioni"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.items.map(svc => (
                    <tr key={svc.id}>
                      <td style={s.td}>
                        <div style={{ fontWeight: "500", color: BRAND.dark }}>{svc.name}</div>
                        {svc.description && <div style={{ fontSize: "12px", color: BRAND.textMuted, marginTop: "2px" }}>{svc.description}</div>}
                      </td>
                      <td style={{ ...s.td, fontFamily: "'Cormorant Garamond',serif", fontSize: "16px" }}>{svc.price}</td>
                      <td style={s.td}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          padding: "3px 8px", fontSize: "11px",
                          color: svc.mode === "direct" ? "#2E7D32" : "#92702A",
                          background: svc.mode === "direct" ? "#E8F5E9" : "#FDF6E3",
                        }}>
                          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: svc.mode === "direct" ? "#4CAF50" : "#E6A817", display: "inline-block" }} />
                          {svc.mode === "direct" ? "Diretta" : "Su richiesta"}
                        </span>
                      </td>
                      <td style={s.td}>
                        <button onClick={() => toggleActive(svc)} style={{
                          border: "none", cursor: "pointer", fontSize: "11px", fontFamily: "'Jost',sans-serif",
                          padding: "3px 10px",
                          background: svc.active ? "#E8F5E9" : "#F5F5F5",
                          color: svc.active ? "#2E7D32" : BRAND.textMuted,
                        }}>
                          {svc.active ? "✓ Visibile" : "Nascosto"}
                        </button>
                      </td>
                      <td style={s.td}>
                        <div style={s.actions}>
                          <button style={s.btnConfirm} onClick={() => setEditModal(svc)}>✎ Modifica</button>
                          <button style={s.btnReject}  onClick={() => setDeleteTarget(svc)}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Modal servizio */}
      {(editModal !== null) && (
        <ServiceModal
          service={editModal === "new" ? null : editModal}
          onClose={() => setEditModal(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Conferma eliminazione */}
      {deleteTarget && (
        <div style={cm.overlay} onClick={() => setDeleteTarget(null)}>
          <div style={{ ...cm.modal, maxWidth: "400px" }} onClick={e => e.stopPropagation()}>
            <div style={cm.header}>
              <p style={{ ...cm.tag, color: "#EF5350" }}>ELIMINA SERVIZIO</p>
              <h3 style={cm.title}>{deleteTarget.name}</h3>
              <p style={cm.sub}>Questa azione è irreversibile.</p>
            </div>
            <div style={cm.footer}>
              <button style={cm.btnCancel} onClick={() => setDeleteTarget(null)}>Annulla</button>
              <button style={{ ...cm.btnConfirm, background: "#C62828" }} onClick={handleDelete} disabled={deleting}>
                {deleting ? "Eliminazione..." : "✕ Elimina"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB RICHIESTE ─────────────────────────────────────────────────────────────
function RequestsTab() {
  const [requests, setRequests]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState("all");
  const [confirmModal, setConfirmModal] = useState(null);
  const [rejectModal, setRejectModal]   = useState(null);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/requests");
      const { data } = await res.json();
      setRequests(data || []);
    } catch (e) {
      console.error("Errore fetch requests:", e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmed = (id) => setRequests(p => p.map(r => r.id === id ? { ...r, status: "confirmed" } : r));
  const handleRejected  = (id) => setRequests(p => p.map(r => r.id === id ? { ...r, status: "rejected"  } : r));
  const markPaid = async (id) => {
    await fetch("/api/admin/mark-paid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setRequests(p => p.map(r => r.id === id ? { ...r, status: "paid" } : r));
  };

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);
  const counts = {
    all:       requests.length,
    pending:   requests.filter(r => r.status === "pending").length,
    confirmed: requests.filter(r => r.status === "confirmed").length,
    paid:      requests.filter(r => r.status === "paid").length,
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
        <button onClick={fetchRequests} style={s.refreshBtn}>↻ Aggiorna</button>
      </div>

      {/* STATS */}
      <div style={s.stats}>
        {[["all","Totali"],["pending","In attesa"],["confirmed","Confermate"],["paid","Pagate"]].map(([k, label]) => (
          <button key={k} style={{ ...s.stat, ...(filter === k ? s.statActive : {}) }} onClick={() => setFilter(k)}>
            <span style={{ ...s.statNum, color: filter === k ? BRAND.gold : BRAND.dark }}>{counts[k]}</span>
            <span style={s.statLabel}>{label}</span>
          </button>
        ))}
      </div>

      {/* TABELLA */}
      {loading ? (
        <div style={s.empty}>Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>Nessuna richiesta trovata.</div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {["Data","Cliente","Servizio","Prezzo","Data servizio","Pax","Stato","Azioni"].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const st = STATUS[r.status] || STATUS.pending;
                return (
                  <tr key={r.id}>
                    <td style={s.td}>{new Date(r.created_at).toLocaleDateString("it-IT")}</td>
                    <td style={s.td}>
                      <div style={s.clientName}>{r.nome}</div>
                      <a href={`mailto:${r.email}`} style={s.clientEmail}>{r.email}</a>
                      {r.telefono && <div style={s.clientPhone}>{r.telefono}</div>}
                    </td>
                    <td style={s.td}>
                      <div style={s.serviceName}>{r.service_name}</div>
                      {r.note && <div style={s.noteText}>💬 {r.note}</div>}
                    </td>
                    <td style={{ ...s.td, fontFamily: "'Cormorant Garamond',serif", fontSize: "17px", fontWeight: "500", color: BRAND.dark }}>
                      {r.service_price}
                    </td>
                    <td style={s.td}>{r.data_desiderata || "—"}</td>
                    <td style={{ ...s.td, textAlign: "center" }}>{r.persone}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, color: st.color, background: st.bg }}>
                        <span style={{ ...s.dot, background: st.dot }} />{st.label}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        {r.status === "pending" && (
                          <>
                            <button style={s.btnConfirm} onClick={() => setConfirmModal(r)}>✓ Conferma</button>
                            <button style={s.btnReject}  onClick={() => setRejectModal(r)}>✕</button>
                          </>
                        )}
                        {r.status === "confirmed" && (
                          <button style={s.btnPaid} onClick={() => markPaid(r.id)}>💳 Pagata</button>
                        )}
                        {r.revolut_link && (
                          <a href={r.revolut_link} target="_blank" rel="noreferrer" style={s.btnIcon} title="Link Revolut">💳</a>
                        )}
                        <a href={`mailto:${r.email}`} style={s.btnIcon} title="Email">✉</a>
                        {r.telefono && (
                          <a href={`https://wa.me/${r.telefono.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={s.btnIcon} title="WhatsApp">💬</a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {confirmModal && <ConfirmModal request={confirmModal} onClose={() => setConfirmModal(null)} onConfirmed={handleConfirmed} />}
      {rejectModal  && <RejectModal  request={rejectModal}  onClose={() => setRejectModal(null)}  onRejected={handleRejected}  />}
    </>
  );
}

// ─── PANNELLO PRINCIPALE ──────────────────────────────────────────────────────
export default function AdminPanel() {
  const [tab, setTab] = useState("foto");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    getSupabase().auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (!session) { window.location.href = "/admin/login"; return; }
      setAuthChecked(true);
    });
    return () => { mounted = false; };
  }, []);

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", background: BRAND.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Jost',sans-serif", color: BRAND.textMuted }}>
        Caricamento...
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Jost:wght@300;400;500&display=swap');
        *{box-sizing:border-box}
        input:focus,textarea:focus,select:focus{outline:none;border-color:${BRAND.gold}!important}
        tbody tr:hover td{background:#FDFCF8} td{transition:background .15s}
      `}</style>
      <div style={s.page}>
        <div style={s.header}>
          <div>
            <p style={s.headerTag}>LE SICILIEN · ADMIN</p>
            <h1 style={s.title}>Pannello Admin</h1>
          </div>
          <div style={{ display: "flex", gap: "0", alignItems: "center" }}>
            <a href="/admin/crm" style={{ ...s.refreshBtn, textDecoration: "none", marginRight: "12px", display: "inline-block" }}>CRM →</a>
            <button
              style={{ ...s.tabBtn, ...(tab === "richieste" ? s.tabActive : {}) }}
              onClick={() => setTab("richieste")}>Richieste</button>
            <button
              style={{ ...s.tabBtn, ...(tab === "foto" ? s.tabActive : {}) }}
              onClick={() => setTab("foto")}>Foto Servizi</button>
            <button
              style={{ ...s.tabBtn, ...(tab === "servizi" ? s.tabActive : {}) }}
              onClick={() => setTab("servizi")}>Servizi</button>
            <button
              style={{ ...s.refreshBtn, marginLeft: "12px", background: "transparent", color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}
              onClick={async () => { await getSupabase().auth.signOut(); window.location.href = "/admin/login"; }}>
              Esci
            </button>
          </div>
        </div>

        {tab === "richieste" ? <RequestsTab /> : tab === "foto" ? <CatalogPhotosTab /> : <ServicesTab />}
      </div>
    </>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = {
  page:       { fontFamily: "'Jost',sans-serif", padding: "40px 32px", background: BRAND.cream, minHeight: "100vh" },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" },
  headerTag:  { fontSize: "10px", letterSpacing: ".25em", color: BRAND.gold, textTransform: "uppercase", marginBottom: "6px" },
  title:      { fontFamily: "'Cormorant Garamond',serif", fontSize: "32px", fontWeight: "400", color: BRAND.dark, margin: 0 },
  refreshBtn: { background: BRAND.dark, color: BRAND.gold, border: "none", padding: "10px 20px", cursor: "pointer", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "'Jost',sans-serif" },
  tabBtn:     { background: "transparent", color: BRAND.textMuted, border: `1px solid ${BRAND.border}`, borderRight: "none", padding: "10px 22px", cursor: "pointer", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "'Jost',sans-serif" },
  tabActive:  { background: BRAND.dark, color: BRAND.gold, borderColor: BRAND.dark },
  stats:      { display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" },
  stat:       { background: "#fff", border: `1px solid ${BRAND.border}`, padding: "18px 28px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", minWidth: "110px", fontFamily: "'Jost',sans-serif", transition: "all .2s" },
  statActive: { background: BRAND.dark, borderColor: BRAND.dark },
  statNum:    { fontSize: "28px", fontWeight: "500" },
  statLabel:  { fontSize: "10px", color: BRAND.textMuted, textTransform: "uppercase", letterSpacing: ".1em" },
  empty:      { textAlign: "center", padding: "80px", color: BRAND.textMuted, fontFamily: "'Cormorant Garamond',serif", fontSize: "20px" },
  tableWrap:  { background: "#fff", border: `1px solid ${BRAND.border}`, overflow: "auto" },
  table:      { width: "100%", borderCollapse: "collapse", minWidth: "960px" },
  th:         { padding: "14px 16px", textAlign: "left", fontSize: "9px", textTransform: "uppercase", letterSpacing: ".15em", color: BRAND.textMuted, borderBottom: `1px solid ${BRAND.border}`, background: BRAND.cream, fontFamily: "'Jost',sans-serif", fontWeight: "500" },
  td:         { padding: "16px", fontSize: "13px", verticalAlign: "top", borderBottom: `1px solid ${BRAND.border}` },
  clientName: { fontWeight: "500", marginBottom: "3px", color: BRAND.dark },
  clientEmail:{ color: BRAND.gold, fontSize: "12px", textDecoration: "none", display: "block" },
  clientPhone:{ color: BRAND.textMuted, fontSize: "12px", marginTop: "2px" },
  serviceName:{ fontWeight: "500", marginBottom: "4px", color: BRAND.dark, lineHeight: "1.4" },
  noteText:   { fontSize: "12px", color: BRAND.textMuted, fontStyle: "italic", marginTop: "4px" },
  badge:      { display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: "500" },
  dot:        { width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, display: "inline-block" },
  actions:    { display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" },
  btnConfirm: { background: "#E8F5E9", color: "#2E7D32", border: "1px solid #A5D6A7", padding: "5px 10px", cursor: "pointer", fontSize: "11px", fontWeight: "600", fontFamily: "'Jost',sans-serif" },
  btnReject:  { background: "#FFEBEE", color: "#C62828", border: "1px solid #EF9A9A", padding: "5px 9px", cursor: "pointer", fontSize: "12px" },
  btnPaid:    { background: "#E3F2FD", color: "#1565C0", border: "1px solid #90CAF9", padding: "5px 10px", cursor: "pointer", fontSize: "11px", fontWeight: "600", fontFamily: "'Jost',sans-serif" },
  btnIcon:    { background: BRAND.cream, border: `1px solid ${BRAND.border}`, padding: "5px 8px", textDecoration: "none", fontSize: "14px", cursor: "pointer" },
};

const cm = {
  overlay:          { position: "fixed", inset: 0, background: "rgba(26,24,20,.85)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", backdropFilter: "blur(8px)" },
  modal:            { background: BRAND.cream, width: "100%", maxWidth: "540px", border: `1px solid ${BRAND.border}`, fontFamily: "'Jost',sans-serif" },
  header:           { padding: "32px 32px 24px" },
  tag:              { fontSize: "9px", letterSpacing: ".28em", color: BRAND.gold, textTransform: "uppercase", marginBottom: "10px" },
  title:            { fontFamily: "'Cormorant Garamond',serif", fontSize: "22px", fontWeight: "400", color: BRAND.dark, marginBottom: "8px" },
  sub:              { fontSize: "13px", fontWeight: "300", color: BRAND.textMuted, lineHeight: "1.6" },
  divider:          { height: "1px", background: BRAND.border },
  body:             { padding: "24px 32px" },
  field:            { marginBottom: "20px" },
  fieldLabel:       { display: "block", fontSize: "9px", letterSpacing: ".18em", color: BRAND.textMuted, textTransform: "uppercase", marginBottom: "8px" },
  input:            { width: "100%", background: "#fff", border: `1px solid ${BRAND.border}`, padding: "11px 14px", fontSize: "16px", fontFamily: "'Jost',sans-serif", fontWeight: "400", color: BRAND.dark, transition: "border-color .2s" },
  importoLabel:     { fontFamily: "'Cormorant Garamond',serif", fontSize: "20px", color: BRAND.textMuted },
  linkPreview:      { marginTop: "10px", padding: "10px 14px", background: "#fff", border: `1px solid ${BRAND.border}` },
  linkPreviewLabel: { fontSize: "9px", letterSpacing: ".15em", color: BRAND.textMuted, textTransform: "uppercase", display: "block", marginBottom: "4px" },
  linkPreviewUrl:   { fontSize: "13px", color: BRAND.gold, textDecoration: "none", wordBreak: "break-all" },
  textarea:         { width: "100%", background: "#fff", border: `1px solid ${BRAND.border}`, padding: "11px 14px", fontSize: "13px", fontFamily: "'Jost',sans-serif", fontWeight: "300", color: BRAND.dark, resize: "vertical", lineHeight: "1.6" },
  error:            { fontSize: "12px", color: "#C62828", marginTop: "6px", fontWeight: "500" },
  preview:          { background: "#fff", border: `1px solid ${BRAND.border}`, padding: "14px 16px", marginTop: "4px" },
  previewTag:       { fontSize: "9px", letterSpacing: ".18em", color: BRAND.gold, textTransform: "uppercase", marginBottom: "8px", display: "block" },
  previewText:      { fontSize: "13px", fontWeight: "300", color: BRAND.textMuted, lineHeight: "1.7" },
  footer:           { display: "flex", gap: "10px", justifyContent: "flex-end", padding: "20px 32px 28px", borderTop: `1px solid ${BRAND.border}` },
  btnCancel:        { background: "transparent", color: BRAND.textMuted, border: `1px solid ${BRAND.border}`, padding: "11px 22px", fontSize: "11px", letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Jost',sans-serif" },
  btnConfirm:       { background: BRAND.dark, color: BRAND.gold, border: "none", padding: "12px 24px", fontSize: "11px", fontWeight: "500", letterSpacing: ".12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Jost',sans-serif", transition: "background .2s" },
};

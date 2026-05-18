"use client";
import { useState, useEffect } from "react";

// ─── CONFIG — REVOLUT REALE ─────────────────────────────────────────────────
const CONFIG = {
  whatsappNumber: "393273751480",
  adminEmail: "info@lesicilien.com",
  revolut: {
    // Link con importo precompilato per i servizi a prenotazione diretta
    transfer_one:     "https://revolut.me/gabriel1r6/45",
    transfer_ar:      "https://revolut.me/gabriel1r6/80",
    bagagli:          "https://revolut.me/gabriel1r6/10",
    early_checkin:    "https://revolut.me/gabriel1r6/25",
    late_checkin:     "https://revolut.me/gabriel1r6/20",
    late_checkout:    "https://revolut.me/gabriel1r6/30",
    kit_base:         "https://revolut.me/gabriel1r6/35",
    kit_premium:      "https://revolut.me/gabriel1r6/65",
    biancheria_extra: "https://revolut.me/gabriel1r6/15",
    ristorante:       "https://revolut.me/gabriel1r6/10",
    // Fallback generico (senza importo) — non dovrebbe mai servire
    default:          "https://revolut.me/gabriel1r6",
  },
};

// Default photos per service (picsum.photos — seed stabile per ogni servizio)
const P = (id) => `https://picsum.photos/seed/${id}/800/500`;
const SVCID_IMG = {
  transfer_one:        P("airport-taxi"),
  transfer_ar:         P("airport-shuttle"),
  bagagli:             P("luggage-travel"),
  early_checkin:       P("hotel-checkin"),
  late_checkin:        P("hotel-night"),
  late_checkout:       P("hotel-checkout"),
  kit_base:            P("wine-sicily"),
  kit_premium:         P("champagne-luxury"),
  frigo_base:          P("fridge-grocery"),
  frigo_premium:       P("gourmet-food"),
  kit_bebe:            P("baby-crib"),
  biancheria_extra:    P("white-linen"),
  cambio_biancheria:   P("fresh-linen"),
  lavanderia:          P("laundry-clean"),
  stireria:            P("ironing-shirt"),
  colazione:           P("breakfast-tray"),
  chef_4:              P("private-chef"),
  chef_8:              P("dinner-party"),
  ristorante:          P("restaurant-table"),
  streetfood:          P("street-food-market"),
  cucina:              P("cooking-class"),
  aperitivo_app:       P("aperitivo-terrace"),
  tour_centro:         P("palermo-centro"),
  etna:                P("etna-volcano"),
  templi:              P("agrigento-temples"),
  scala_turchi:        P("scala-turchi-cliff"),
  cantina:             P("wine-cellar"),
  mercati:             P("sicily-market"),
  mercato_pesce:       P("fish-market"),
  whale_aperitivo_nav: P("catamaran-sunset"),
  whale_aperitivo_orm: P("yacht-moored"),
  whale_cena_orm:      P("yacht-dinner"),
  whale_cena_nav:      P("sailing-dinner"),
  whale_giornata:      P("catamaran-day"),
  whale_2giorni:       P("luxury-yacht"),
  whale_weekly:        P("sailing-weekly"),
  massaggio_relax:     P("massage-relax"),
  massaggio_dec:       P("massage-deep"),
  massaggio_coppia:    P("couples-massage"),
  personal_trainer:    P("personal-trainer"),
  yoga:                P("yoga-villa"),
  babysitter:          P("babysitter-child"),
  guida_mezza:         P("tour-guide"),
  guida_intera:        P("private-guide"),
  interprete:          P("interpreter"),
  foto_1h:             P("photography-session"),
  foto_2h:             P("photo-editing"),
  proposta:            P("marriage-proposal"),
  luna_miele:          P("honeymoon-couple"),
};

const BRAND = {
  gold: "#BFA05A", goldLight: "#D4B97A",
  cream: "#FAF8F3", creamDark: "#F2EFE7",
  dark: "#1A1814", darkMid: "#2C2820",
  text: "#3A3530", textMuted: "#8A8278",
  border: "#E0D9CC",
};

const SERVICES = [
  {
    category: "Trasporti & Logistica", icon: "✦",
    items: [
      { id: "transfer_one",     name: "Transfer aeroporto — solo andata",          price: "45€",           type: "direct" },
      { id: "transfer_ar",      name: "Transfer aeroporto/stazione — A/R",          price: "80€",           type: "direct" },
      { id: "bagagli",          name: "Servizio bagagli — deposito & consegna",     price: "10€",           type: "direct" },
    ],
  },
  {
    category: "Comfort", icon: "✦",
    items: [
      { id: "early_checkin",    name: "Early check-in (dalle 10:00)",               price: "25€",           type: "direct" },
      { id: "late_checkin",     name: "Late check-in (dalle 23:00 in poi)",         price: "20€",           type: "direct" },
      { id: "late_checkout",    name: "Late check-out (fino alle 18:00)",           price: "30€",           type: "request" },
      { id: "kit_base",         name: "Kit benvenuto — vino & prodotti locali",     price: "35€",           type: "direct" },
      { id: "kit_premium",      name: "Kit benvenuto premium — champagne & dolci",  price: "65€",           type: "direct" },
      { id: "frigo_base",       name: "Frigorifero pre-rifornito — spesa base",     price: "40€",           type: "request" },
      { id: "frigo_premium",    name: "Frigorifero pre-rifornito — spesa premium",  price: "80€",           type: "request" },
      { id: "kit_bebe",         name: "Kit bebè — lettino, seggiolone & vasca",     price: "30€/soggiorno", type: "request" },
      { id: "biancheria_extra", name: "Biancheria extra",                           price: "15€",           type: "direct" },
      { id: "cambio_biancheria",name: "Cambio biancheria mid-stay",                 price: "20€",           type: "request" },
      { id: "lavanderia",       name: "Servizio lavanderia",                        price: "20€",           type: "request" },
      { id: "stireria",         name: "Servizio stireria",                          price: "15€",           type: "request" },
    ],
  },
  {
    category: "Private Chef & Dining", icon: "✦",
    items: [
      { id: "colazione",        name: "Colazione consegnata in villa",              price: "12€/persona",   type: "request" },
      { id: "chef_4",           name: "Private chef — cena per 2–4 persone",       price: "120€",          type: "request" },
      { id: "chef_8",           name: "Private chef — cena per 5–8 persone",       price: "200€",          type: "request" },
      { id: "ristorante",       name: "Prenotazione ristorante — corsia preferenziale", price: "10€",      type: "direct" },
      { id: "streetfood",       name: "Street food tour guidato (2h)",             price: "35€/persona",   type: "request" },
      { id: "cucina",           name: "Corso di cucina siciliana (3h, pranzo incluso)", price: "75€/persona", type: "request" },
      { id: "aperitivo_app",    name: "Aperitivo di benvenuto in villa",           price: "25€/persona",   type: "request" },
    ],
  },
  {
    category: "Esperienze & Tour Privati", icon: "✦",
    note: "Transfer non incluso per destinazioni fuori Palermo",
    items: [
      { id: "tour_centro",      name: "Tour privato centro storico (3h · fino a 6 persone)", price: "80€", type: "request" },
      { id: "etna",             name: "Escursione Etna — giornata intera con transfer",       price: "90€/persona", type: "request" },
      { id: "templi",           name: "Escursione Valle dei Templi",                          price: "85€/persona", type: "request" },
      { id: "scala_turchi",     name: "Scala dei Turchi & Agrigento — giornata",             price: "90€/persona", type: "request" },
      { id: "cantina",          name: "Visita cantina con degustazione",                     price: "55€/persona", type: "request" },
      { id: "mercati",          name: "Tour mercati storici — Ballarò & Vucciria",           price: "25€/persona", type: "request" },
      { id: "mercato_pesce",    name: "Esperienza mattutina mercato del pesce",              price: "20€/persona", type: "request" },
    ],
  },
  {
    category: "Yacht Charter — Catamarano Whale", icon: "⛵",
    note: "Fountaine Pajot Eleuthera 60 · 18 metri · Porto base: Palermo · Soggetto a disponibilità",
    items: [
      { id: "whale_aperitivo_nav", name: "Aperitivo al Tramonto in Navigazione · 2.5h · max 12 pax", price: "da 2.700€", type: "request" },
      { id: "whale_aperitivo_orm", name: "Aperitivo Esclusivo Ormeggiata · 2.5h · max 12 pax",       price: "da 1.800€", type: "request" },
      { id: "whale_cena_orm",      name: "Cena Gourmet Ormeggiata · 3.5h · max 8 pax",               price: "da 2.000€", type: "request" },
      { id: "whale_cena_nav",      name: "Cena Panoramica in Navigazione · 4h · max 8 pax",           price: "da 3.000€", type: "request" },
      { id: "whale_giornata",      name: "Giornata Completa in Catamarano · 10h · max 12 pax",        price: "da 3.000€", type: "request" },
      { id: "whale_2giorni",       name: "Luxury 2 Giorni · 39h · max 12 pax",                       price: "da 6.000€", type: "request" },
      { id: "whale_weekly",        name: "Weekly Charter · 7 giorni / 6 notti · max 12 pax",         price: "da 15.000€", type: "request" },
    ],
  },
  {
    category: "Wellness & Benessere", icon: "✦",
    items: [
      { id: "massaggio_relax",   name: "Massaggio rilassante in villa (60 min)",       price: "70€",  type: "request" },
      { id: "massaggio_dec",     name: "Massaggio decontratturante in villa (60 min)", price: "80€",  type: "request" },
      { id: "massaggio_coppia",  name: "Massaggio coppia — simultaneo (60 min)",       price: "130€", type: "request" },
      { id: "personal_trainer",  name: "Personal trainer (sessione 60 min)",           price: "50€",  type: "request" },
      { id: "yoga",              name: "Yoga privato in villa (60 min)",               price: "45€",  type: "request" },
    ],
  },
  {
    category: "Famiglia & Assistenza", icon: "✦",
    items: [
      { id: "babysitter",    name: "Babysitter certificata",                          price: "15€/h",  type: "request" },
      { id: "guida_mezza",   name: "Guida turistica privata — mezza giornata (4h)",  price: "120€",   type: "request" },
      { id: "guida_intera",  name: "Guida turistica privata — giornata intera",      price: "200€",   type: "request" },
      { id: "interprete",    name: "Assistente & interprete per pratiche",           price: "40€/h",  type: "request" },
    ],
  },
  {
    category: "Momenti Indimenticabili", icon: "✦",
    items: [
      { id: "foto_1h",     name: "Servizio fotografico professionale (1h)",            price: "120€", type: "request" },
      { id: "foto_2h",     name: "Servizio fotografico premium — editing incluso (2h)", price: "200€", type: "request" },
      { id: "proposta",    name: "Organizzazione proposta di matrimonio",              price: "350€", type: "request" },
      { id: "luna_miele",  name: "Pacchetto luna di miele — kit, esperienze & foto",  price: "450€", type: "request" },
    ],
  },
];

// ─── MODAL RICHIESTA ────────────────────────────────────────────────────────
function RequestModal({ service, onClose, onSubmit }) {
  const [form, setForm] = useState({ nome: "", email: "", telefono: "", data: "", note: "", persone: "1" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const canSubmit = form.nome && form.email && form.data;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    await onSubmit({ service, form });
    setLoading(false);
    setSent(true);
  };

  const fields = [
    [{ id: "nome", label: "Nome e cognome *", ph: "Mario Rossi", type: "text" },
     { id: "email", label: "Email *", ph: "mario@email.com", type: "email" }],
    [{ id: "telefono", label: "Telefono", ph: "+39 333 000 0000", type: "text" },
     { id: "data", label: "Data desiderata *", ph: "", type: "date" }],
    [{ id: "persone", label: "N. persone", ph: "1", type: "number" },
     { id: "note", label: "Note & richieste speciali", ph: "Allergie, occasioni...", type: "text" }],
  ];

  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={m.modal} onClick={e => e.stopPropagation()}>
        {sent ? (
          <div style={m.sentBox}>
            <div style={m.sentCheck}>✓</div>
            <p style={m.sentLabel}>RICHIESTA INVIATA</p>
            <h3 style={m.sentTitle}>Ti risponderemo a breve</h3>
            <p style={m.sentText}>Il nostro team verificherà la disponibilità e vi contatterà entro poche ore per confermare e inviarvi il link di pagamento.</p>
            <button style={m.btnGold} onClick={onClose}>Chiudi</button>
          </div>
        ) : (
          <>
            <div style={m.header}>
              <button style={m.closeBtn} onClick={onClose}>✕</button>
              <p style={m.label}>RICHIESTA DI DISPONIBILITÀ</p>
              <h3 style={m.title}>{service.name}</h3>
              {service.description && (
                <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "13px", fontWeight: "300", color: "#8A8278", lineHeight: "1.6", marginTop: "8px" }}>{service.description}</p>
              )}
              {service.deposit_amount != null && service.total_amount != null ? (
                <div style={{ marginTop: "10px" }}>
                  <div style={m.price}>Acconto: {service.deposit_amount}€</div>
                  <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "12px", color: "#8A8278", marginTop: "4px" }}>
                    Saldo rimanente: {(service.total_amount - service.deposit_amount).toFixed(0)}€ all'erogazione · Totale: {service.total_amount}€
                  </p>
                </div>
              ) : (
                <div style={m.price}>{service.price}</div>
              )}
            </div>
            <div style={m.divider} />
            <div style={m.body}>
              {fields.map((row, ri) => (
                <div key={ri} style={m.row}>
                  {row.map(f => (
                    <div key={f.id} style={m.group}>
                      <label style={m.label2}>{f.label}</label>
                      <input
                        style={m.input} type={f.type} placeholder={f.ph}
                        value={form[f.id]}
                        onChange={e => setForm({ ...form, [f.id]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={m.footer}>
              <button style={m.btnOutline} onClick={onClose}>Annulla</button>
              <button
                style={{ ...m.btnGold, opacity: canSubmit ? 1 : 0.4, cursor: canSubmit ? "pointer" : "not-allowed" }}
                onClick={handleSubmit} disabled={loading || !canSubmit}
              >
                {loading ? "Invio..." : "Invia richiesta"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MODAL PRENOTAZIONE DIRETTA ─────────────────────────────────────────────
function DirectBookModal({ service, onClose, onSubmit }) {
  const [form, setForm] = useState({ nome: "", email: "", telefono: "", data: "" });
  const [loading, setLoading] = useState(false);
  const canSubmit = form.nome && form.email;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    await onSubmit({ service, form });
    setLoading(false);
    onClose();
  };

  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={m.modal} onClick={e => e.stopPropagation()}>
        <div style={m.header}>
          <button style={m.closeBtn} onClick={onClose}>✕</button>
          <p style={m.label}>PRENOTAZIONE DIRETTA</p>
          <h3 style={m.title}>{service.name}</h3>
          {service.description && (
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "13px", fontWeight: "300", color: "#8A8278", lineHeight: "1.6", marginTop: "8px" }}>{service.description}</p>
          )}
          {service.deposit_amount != null && service.total_amount != null ? (
            <div style={{ marginTop: "10px" }}>
              <div style={m.price}>Acconto: {service.deposit_amount}€</div>
              <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "12px", color: "#8A8278", marginTop: "4px" }}>
                Saldo rimanente: {(service.total_amount - service.deposit_amount).toFixed(0)}€ all'erogazione · Totale: {service.total_amount}€
              </p>
            </div>
          ) : (
            <div style={m.price}>{service.price}</div>
          )}
        </div>
        <div style={m.divider} />
        <div style={m.body}>
          <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "13px", fontWeight: "300", color: BRAND.textMuted, marginBottom: "20px", lineHeight: "1.7" }}>
            Inserisci i tuoi dati per completare la prenotazione. Verrai reindirizzato al pagamento Revolut.
          </p>
          <div style={m.row}>
            <div style={m.group}>
              <label style={m.label2}>Nome e cognome *</label>
              <input style={m.input} type="text" placeholder="Mario Rossi" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div style={m.group}>
              <label style={m.label2}>Email *</label>
              <input style={m.input} type="email" placeholder="mario@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div style={m.row}>
            <div style={m.group}>
              <label style={m.label2}>Telefono</label>
              <input style={m.input} type="text" placeholder="+39 333 000 0000" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
            </div>
            <div style={m.group}>
              <label style={m.label2}>Data desiderata</label>
              <input style={m.input} type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
            </div>
          </div>
        </div>
        <div style={m.footer}>
          <button style={m.btnOutline} onClick={onClose}>Annulla</button>
          <button
            style={{ ...m.btnGold, opacity: canSubmit ? 1 : 0.4, cursor: canSubmit ? "pointer" : "not-allowed" }}
            onClick={handleSubmit} disabled={loading || !canSubmit}
          >
            {loading ? "..." : "Continua al pagamento →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
export default function ExtrasPage() {
  const [selected, setSelected] = useState(null);
  const [directSelected, setDirectSelected] = useState(null);
  const [imgOverrides,     setImgOverrides]     = useState({});
  const [priceOverrides,   setPriceOverrides]   = useState({});
  const [descOverrides,    setDescOverrides]     = useState({});
  const [depositOverrides, setDepositOverrides] = useState({});
  const [totalOverrides,   setTotalOverrides]   = useState({});
  const [waOverrides,      setWaOverrides]      = useState({});

  useEffect(() => {
    fetch("/api/admin/services")
      .then(r => r.json())
      .then(({ data }) => {
        if (!data) return;
        const imgs = {}, prices = {}, descs = {}, deposits = {}, totals = {}, was = {};
        data.forEach(svc => {
          const key = svc.service_id || svc.name;
          if (svc.image_url)             imgs[key]     = svc.image_url;
          if (svc.price)                 prices[key]   = svc.price;
          if (svc.description)           descs[key]    = svc.description;
          if (svc.deposit_amount != null) deposits[key] = svc.deposit_amount;
          if (svc.total_amount   != null) totals[key]   = svc.total_amount;
          if (svc.wa_message)            was[key]      = svc.wa_message;
        });
        setImgOverrides(imgs);
        setPriceOverrides(prices);
        setDescOverrides(descs);
        setDepositOverrides(deposits);
        setTotalOverrides(totals);
        setWaOverrides(was);
      })
      .catch(() => {});
  }, []);

  const handleDirectBook = (item) => {
    setDirectSelected(item);
  };

  const handleDirectSubmit = async ({ service, form }) => {
    try {
      await fetch("/api/send-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, form }),
      });
    } catch (e) { console.error(e); }
    const link = CONFIG.revolut[service.id] || CONFIG.revolut.default;
    window.open(link, "_blank");
  };

  const handleSubmitRequest = async ({ service, form }) => {
    // 1. Notifica WhatsApp
    const defaultMsg =
      `🛎 *Richiesta Concierge — Le Sicilien*\n\n` +
      `*Servizio:* ${service.name}\n*Prezzo:* ${service.price}\n` +
      `*Nome:* ${form.nome}\n*Email:* ${form.email}\n` +
      `*Tel:* ${form.telefono || "—"}\n*Data:* ${form.data}\n` +
      `*Persone:* ${form.persone}\n*Note:* ${form.note || "—"}`;
    const customMsg = service.wa_message
      ? `${service.wa_message}\n\n---\n*Nome:* ${form.nome}\n*Email:* ${form.email}\n*Tel:* ${form.telefono || "—"}\n*Data:* ${form.data}\n*Persone:* ${form.persone}\n*Note:* ${form.note || "—"}`
      : null;
    const waText = encodeURIComponent(customMsg || defaultMsg);
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${waText}`, "_blank");
    // 2. Salva su DB + notifica email admin
    try {
      await fetch("/api/send-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, form }),
      });
    } catch (e) { console.error(e); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        .ls-card{transition:box-shadow .25s,transform .25s}
        .ls-card:hover{box-shadow:0 12px 40px rgba(0,0,0,.12)!important;transform:translateY(-2px)}
        .ls-btn-dark:hover{background:${BRAND.goldLight}!important}
        .ls-btn-border:hover{background:${BRAND.creamDark}!important}
        .ls-pill:hover{color:#fff!important}
        input:focus{outline:none!important;border-color:${BRAND.gold}!important}
        @media(max-width:640px){
          .ls-grid{grid-template-columns:1fr!important}
          .ls-nav-scroll{display:none!important}
        }
      `}</style>

      <div style={p.page}>
        {/* NAV */}
        <nav style={p.nav}>
          <div style={p.navInner}>
            <span style={p.brand}>LE SICILIEN</span>
            <div style={p.navScroll} className="ls-nav-scroll">
              {SERVICES.map((s, i) => (
                <a key={i} href={`#s${i}`} style={p.pill} className="ls-pill">{s.category}</a>
              ))}
            </div>
            <a href={`https://wa.me/${CONFIG.whatsappNumber}`} target="_blank" rel="noreferrer" style={p.cta}>
              Concierge
            </a>
          </div>
        </nav>

        {/* HERO */}
        <header style={p.hero}>
          <div style={p.heroWrap}>
            <p style={p.heroTag}>CONCIERGE SERVICES · PALERMO & SICILIA</p>
            <h1 style={p.heroH1}>
              Bespoke Experiences<br />
              <em style={{ fontStyle: "italic", color: BRAND.gold }}>for Our Guests</em>
            </h1>
            <div style={p.rule} />
            <p style={p.heroSub}>
              Ogni servizio è curato personalmente dal nostro team.<br />
              Alcuni sono prenotabili subito, altri richiedono la nostra conferma.
            </p>
            <div style={p.legend}>
              <span style={p.li}><span style={p.dotG} />Prenotazione diretta — pagamento via Revolut</span>
              <span style={p.li}><span style={p.dotO} />Su richiesta — confermiamo entro poche ore</span>
            </div>
          </div>
        </header>

        {/* SEZIONI */}
        <main style={p.main}>
          {SERVICES.map((sec, si) => (
            <section key={si} id={`s${si}`} style={p.sec}>
              <div style={p.secHead}>
                <div style={p.secLine} />
                <div>
                  <p style={p.secIcon}>{sec.icon}</p>
                  <h2 style={p.secTitle}>{sec.category}</h2>
                  {sec.note && <p style={p.secNote}>{sec.note}</p>}
                </div>
              </div>
              <div style={p.grid} className="ls-grid">
                {sec.items.map(item => {
                  const imgUrl         = imgOverrides[item.id]  || imgOverrides[item.name]  || SVCID_IMG[item.id];
                  const effectivePrice   = priceOverrides[item.id]   || priceOverrides[item.name]   || item.price;
                  const effectiveDesc    = descOverrides[item.id]    || descOverrides[item.name]    || "";
                  const effectiveDeposit = depositOverrides[item.id] ?? depositOverrides[item.name] ?? null;
                  const effectiveTotal   = totalOverrides[item.id]   ?? totalOverrides[item.name]   ?? null;
                  const effectiveWA      = waOverrides[item.id]      || waOverrides[item.name]      || null;
                  const effectiveItem = { ...item, price: effectivePrice, description: effectiveDesc, deposit_amount: effectiveDeposit, total_amount: effectiveTotal, wa_message: effectiveWA };
                  return (
                    <article key={item.id} style={p.card} className="ls-card">
                      {imgUrl && (
                        <div style={{
                          backgroundImage: `url(${imgUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          height: "155px",
                          width: "calc(100% + 44px)",
                          margin: "-26px -22px 16px",
                          flexShrink: 0,
                        }} />
                      )}
                      <div style={p.cardMeta}>
                        <span style={item.type === "direct" ? p.dotG : p.dotO} />
                        <span style={p.metaTxt}>{item.type === "direct" ? "Prenotazione diretta" : "Su richiesta"}</span>
                      </div>
                      <h3 style={p.cardName}>{item.name}</h3>
                      <div style={p.cardFoot}>
                        <span style={p.cardPrice}>{effectivePrice}</span>
                        <button
                          style={item.type === "direct" ? p.btnDark : p.btnBorder}
                          className={item.type === "direct" ? "ls-btn-dark" : "ls-btn-border"}
                          onClick={() => item.type === "direct" ? handleDirectBook(effectiveItem) : setSelected(effectiveItem)}
                        >
                          {item.type === "direct" ? "Prenota ora" : "Richiedi →"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </main>

        {/* FOOTER */}
        <footer style={p.footer}>
          <p style={p.ftTag}>CONCIERGE 24/7</p>
          <h2 style={p.ftH2}>Hai bisogno di qualcosa<br />che non trovi qui?</h2>
          <p style={p.ftSub}>Il nostro team è disponibile per qualsiasi richiesta — scriveteci su WhatsApp.</p>
          <a href={`https://wa.me/${CONFIG.whatsappNumber}`} target="_blank" rel="noreferrer" style={p.ftBtn}>
            💬 Scrivi al Concierge
          </a>
          <div style={p.ftRule} />
          <p style={p.ftCopy}>© 2025 Le Sicilien · Luxury Real Estate · Palermo, Sicilia</p>
        </footer>
      </div>

      {selected && (
        <RequestModal service={selected} onClose={() => setSelected(null)} onSubmit={handleSubmitRequest} />
      )}
      {directSelected && (
        <DirectBookModal service={directSelected} onClose={() => setDirectSelected(null)} onSubmit={handleDirectSubmit} />
      )}
    </>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────
const p = {
  page:      { fontFamily: "'Jost',sans-serif", background: BRAND.cream, color: BRAND.text, minHeight: "100vh" },
  nav:       { position: "sticky", top: 0, zIndex: 100, background: BRAND.dark, borderBottom: "1px solid rgba(191,160,90,.15)" },
  navInner:  { maxWidth: "1280px", margin: "0 auto", padding: "0 32px", height: "58px", display: "flex", alignItems: "center", gap: "20px" },
  brand:     { fontFamily: "'Cormorant Garamond',serif", fontSize: "15px", fontWeight: "500", letterSpacing: ".22em", color: BRAND.gold, flexShrink: 0 },
  navScroll: { flex: 1, display: "flex", gap: "2px", overflowX: "auto", padding: "6px 0" },
  pill:      { fontFamily: "'Jost',sans-serif", fontSize: "10px", letterSpacing: ".1em", color: "rgba(255,255,255,.45)", textDecoration: "none", padding: "5px 12px", whiteSpace: "nowrap", transition: "color .2s", textTransform: "uppercase" },
  cta:       { flexShrink: 0, background: BRAND.gold, color: BRAND.dark, fontSize: "10px", fontWeight: "500", letterSpacing: ".14em", padding: "8px 18px", textDecoration: "none", textTransform: "uppercase" },
  hero:      { background: BRAND.dark, padding: "96px 32px 80px", textAlign: "center" },
  heroWrap:  { maxWidth: "680px", margin: "0 auto" },
  heroTag:   { fontFamily: "'Jost',sans-serif", fontSize: "10px", letterSpacing: ".28em", color: BRAND.gold, marginBottom: "28px", textTransform: "uppercase" },
  heroH1:    { fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(42px,6vw,68px)", fontWeight: "300", color: "#fff", lineHeight: "1.1", marginBottom: "28px" },
  rule:      { width: "40px", height: "1px", background: BRAND.gold, margin: "0 auto 28px" },
  heroSub:   { fontFamily: "'Jost',sans-serif", fontSize: "15px", fontWeight: "300", color: "rgba(255,255,255,.55)", lineHeight: "1.85", marginBottom: "40px" },
  legend:    { display: "flex", gap: "28px", justifyContent: "center", flexWrap: "wrap" },
  li:        { display: "flex", alignItems: "center", gap: "10px", fontFamily: "'Jost',sans-serif", fontSize: "12px", fontWeight: "300", color: "rgba(255,255,255,.45)" },
  dotG:      { display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#6BAE75", flexShrink: 0 },
  dotO:      { display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: BRAND.gold, flexShrink: 0 },
  main:      { maxWidth: "1280px", margin: "0 auto", padding: "80px 32px 40px" },
  sec:       { marginBottom: "88px" },
  secHead:   { display: "flex", gap: "20px", alignItems: "flex-start", marginBottom: "32px" },
  secLine:   { width: "1px", minHeight: "56px", background: BRAND.gold, flexShrink: 0, marginTop: "4px" },
  secIcon:   { fontSize: "13px", color: BRAND.gold, marginBottom: "6px" },
  secTitle:  { fontFamily: "'Cormorant Garamond',serif", fontSize: "30px", fontWeight: "400", color: BRAND.dark, letterSpacing: ".02em", marginBottom: "6px" },
  secNote:   { fontFamily: "'Jost',sans-serif", fontSize: "11px", fontWeight: "300", color: BRAND.textMuted, fontStyle: "italic" },
  grid:      { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "1px", background: BRAND.border, border: `1px solid ${BRAND.border}` },
  card:      { background: BRAND.cream, padding: "26px 22px", display: "flex", flexDirection: "column", gap: "10px" },
  cardMeta:  { display: "flex", alignItems: "center", gap: "8px" },
  metaTxt:   { fontFamily: "'Jost',sans-serif", fontSize: "9px", letterSpacing: ".18em", color: BRAND.textMuted, textTransform: "uppercase" },
  cardName:  { fontFamily: "'Cormorant Garamond',serif", fontSize: "18px", fontWeight: "400", color: BRAND.dark, lineHeight: "1.4", flex: 1 },
  cardFoot:  { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", paddingTop: "16px", borderTop: `1px solid ${BRAND.border}`, marginTop: "auto" },
  cardPrice: { fontFamily: "'Jost',sans-serif", fontSize: "19px", fontWeight: "500", color: BRAND.dark },
  btnDark:   { background: BRAND.dark, color: BRAND.gold, border: "none", padding: "9px 16px", fontSize: "10px", fontWeight: "500", letterSpacing: ".12em", cursor: "pointer", whiteSpace: "nowrap", textTransform: "uppercase", transition: "background .2s" },
  btnBorder: { background: "transparent", color: BRAND.text, border: `1px solid ${BRAND.border}`, padding: "8px 16px", fontSize: "10px", fontWeight: "500", letterSpacing: ".12em", cursor: "pointer", whiteSpace: "nowrap", textTransform: "uppercase", transition: "background .2s" },
  footer:    { background: BRAND.darkMid, padding: "80px 32px", textAlign: "center" },
  ftTag:     { fontFamily: "'Jost',sans-serif", fontSize: "10px", letterSpacing: ".28em", color: BRAND.gold, marginBottom: "20px", textTransform: "uppercase" },
  ftH2:      { fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(30px,4vw,44px)", fontWeight: "300", color: "#fff", lineHeight: "1.2", marginBottom: "18px" },
  ftSub:     { fontFamily: "'Jost',sans-serif", fontSize: "14px", fontWeight: "300", color: "rgba(255,255,255,.45)", lineHeight: "1.85", marginBottom: "36px" },
  ftBtn:     { display: "inline-block", background: BRAND.gold, color: BRAND.dark, padding: "14px 36px", fontSize: "12px", fontWeight: "500", letterSpacing: ".14em", textDecoration: "none", textTransform: "uppercase" },
  ftRule:    { width: "40px", height: "1px", background: "rgba(191,160,90,.25)", margin: "48px auto 24px" },
  ftCopy:    { fontFamily: "'Jost',sans-serif", fontSize: "10px", letterSpacing: ".12em", color: "rgba(255,255,255,.2)", textTransform: "uppercase" },
};

const m = {
  overlay:  { position: "fixed", inset: 0, background: "rgba(26,24,20,.88)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", backdropFilter: "blur(10px)" },
  modal:    { background: BRAND.cream, width: "100%", maxWidth: "580px", maxHeight: "90vh", overflowY: "auto", border: `1px solid ${BRAND.border}` },
  header:   { padding: "36px 36px 28px", position: "relative" },
  closeBtn: { position: "absolute", top: "20px", right: "20px", background: "none", border: "none", fontSize: "15px", cursor: "pointer", color: BRAND.textMuted },
  label:    { fontFamily: "'Jost',sans-serif", fontSize: "9px", letterSpacing: ".28em", color: BRAND.gold, marginBottom: "14px", textTransform: "uppercase", display: "block" },
  title:    { fontFamily: "'Cormorant Garamond',serif", fontSize: "24px", fontWeight: "400", color: BRAND.dark, lineHeight: "1.3", marginBottom: "12px" },
  price:    { fontFamily: "'Jost',sans-serif", fontSize: "22px", fontWeight: "500", color: BRAND.dark },
  divider:  { height: "1px", background: BRAND.border },
  body:     { padding: "28px 36px" },
  row:      { display: "flex", gap: "14px", marginBottom: "14px", flexWrap: "wrap" },
  group:    { display: "flex", flexDirection: "column", gap: "7px", flex: 1, minWidth: "180px" },
  label2:   { fontFamily: "'Jost',sans-serif", fontSize: "9px", letterSpacing: ".18em", color: BRAND.textMuted, textTransform: "uppercase" },
  input:    { background: "#fff", border: `1px solid ${BRAND.border}`, padding: "11px 14px", fontSize: "14px", fontFamily: "'Jost',sans-serif", fontWeight: "300", color: BRAND.dark, transition: "border-color .2s", width: "100%" },
  footer:   { display: "flex", gap: "10px", justifyContent: "flex-end", padding: "20px 36px 30px" },
  btnGold:  { background: BRAND.dark, color: BRAND.gold, border: "none", padding: "13px 28px", fontSize: "11px", fontWeight: "500", letterSpacing: ".14em", textTransform: "uppercase", transition: "background .2s", cursor: "pointer", fontFamily: "'Jost',sans-serif" },
  btnOutline:{ background: "transparent", color: BRAND.textMuted, border: `1px solid ${BRAND.border}`, padding: "12px 22px", fontSize: "11px", letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Jost',sans-serif" },
  sentBox:  { padding: "60px 36px", textAlign: "center" },
  sentCheck:{ width: "50px", height: "50px", border: `1px solid ${BRAND.gold}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "18px", color: BRAND.gold },
  sentLabel:{ fontFamily: "'Jost',sans-serif", fontSize: "9px", letterSpacing: ".28em", color: BRAND.gold, marginBottom: "14px", textTransform: "uppercase", display: "block" },
  sentTitle:{ fontFamily: "'Cormorant Garamond',serif", fontSize: "28px", fontWeight: "400", color: BRAND.dark, marginBottom: "16px" },
  sentText: { fontFamily: "'Jost',sans-serif", fontSize: "14px", fontWeight: "300", color: BRAND.textMuted, lineHeight: "1.8", marginBottom: "32px" },
};

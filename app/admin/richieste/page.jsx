"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Link Revolut base — al momento della conferma inserisci /importo
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

// ─── MODAL CONFERMA ──────────────────────────────────────────────────────────
function ConfirmModal({ request, onClose, onConfirmed }) {
  const [importo, setImporto] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Costruisce il link automaticamente dall'importo inserito
  const revolutLink = importo ? `${REVOLUT_BASE}/${importo.replace(/[^0-9]/g, "")}` : "";

  const handleConfirm = async () => {
    if (!importo) { setError("Inserisci l'importo da richiedere al cliente"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          email: request.email,
          nome: request.nome,
          serviceName: request.service_name,
          servicePrice: request.service_price,
          dataDesiderata: request.data_desiderata,
          persone: request.persone,
          revolutLink,
          messageExtra: message,
        }),
      });
      if (!res.ok) throw new Error();
      onConfirmed(request.id);
      onClose();
    } catch {
      setError("Errore nell'invio. Riprova.");
    }
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

          {/* IMPORTO */}
          <div style={cm.field}>
            <label style={cm.fieldLabel}>
              Importo da richiedere (€) <span style={{ color: BRAND.gold }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                style={{ ...cm.input, flex: 1 }}
                type="number"
                placeholder="es. 3500"
                value={importo}
                onChange={e => { setImporto(e.target.value); setError(""); }}
              />
              <span style={cm.importoLabel}>€</span>
            </div>
            {importo && (
              <div style={cm.linkPreview}>
                <span style={cm.linkPreviewLabel}>Link generato:</span>
                <a href={revolutLink} target="_blank" rel="noreferrer" style={cm.linkPreviewUrl}>
                  {revolutLink}
                </a>
              </div>
            )}
            {error && <p style={cm.error}>{error}</p>}
          </div>

          {/* MESSAGGIO OPZIONALE */}
          <div style={cm.field}>
            <label style={cm.fieldLabel}>Messaggio al cliente (opzionale)</label>
            <textarea
              style={cm.textarea}
              placeholder="es. Vi aspettiamo sabato alle 19:30 al porto. Per qualsiasi necessità scriveteci su WhatsApp..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* ANTEPRIMA */}
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
            onClick={handleConfirm}
            disabled={loading || !importo}
          >
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
          requestId: request.id,
          email: request.email,
          nome: request.nome,
          serviceName: request.service_name,
          dataDesiderata: request.data_desiderata,
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
            <textarea
              style={cm.textarea}
              placeholder="es. Siamo spiacenti, non siamo disponibili nella data richiesta. Vi invitiamo a contattarci per trovare un'alternativa..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
            />
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

// ─── PANNELLO PRINCIPALE ──────────────────────────────────────────────────────
export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [confirmModal, setConfirmModal] = useState(null);
  const [rejectModal, setRejectModal]   = useState(null);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await getSupabase()
      .from("requests").select("*").order("created_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  const handleConfirmed = (id) => setRequests(p => p.map(r => r.id === id ? { ...r, status: "confirmed" } : r));
  const handleRejected  = (id) => setRequests(p => p.map(r => r.id === id ? { ...r, status: "rejected"  } : r));
  const markPaid = async (id) => {
    await getSupabase().from("requests").update({ status: "paid" }).eq("id", id);
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Jost:wght@300;400;500&display=swap');
        *{box-sizing:border-box}
        input:focus,textarea:focus{outline:none;border-color:${BRAND.gold}!important}
        tbody tr:hover td{background:#FDFCF8}
        td{transition:background .15s}
      `}</style>
      <div style={s.page}>

        <div style={s.header}>
          <div>
            <p style={s.headerTag}>LE SICILIEN · ADMIN</p>
            <h1 style={s.title}>Pannello Richieste</h1>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={fetchRequests} style={s.refreshBtn}>↻ Aggiorna</button>
            <button onClick={async () => { await getSupabase().auth.signOut(); window.location.href = "/admin/login"; }} style={{ ...s.refreshBtn, background: "transparent", color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>Esci</button>
          </div>
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
                            <a href={r.revolut_link} target="_blank" rel="noreferrer" style={s.btnIcon} title="Link Revolut inviato">💳</a>
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
      </div>

      {confirmModal && <ConfirmModal request={confirmModal} onClose={() => setConfirmModal(null)} onConfirmed={handleConfirmed} />}
      {rejectModal  && <RejectModal  request={rejectModal}  onClose={() => setRejectModal(null)}  onRejected={handleRejected}  />}
    </>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = {
  page:        { fontFamily: "'Jost',sans-serif", padding: "40px 32px", background: BRAND.cream, minHeight: "100vh" },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" },
  headerTag:   { fontSize: "10px", letterSpacing: ".25em", color: BRAND.gold, textTransform: "uppercase", marginBottom: "6px" },
  title:       { fontFamily: "'Cormorant Garamond',serif", fontSize: "32px", fontWeight: "400", color: BRAND.dark, margin: 0 },
  refreshBtn:  { background: BRAND.dark, color: BRAND.gold, border: "none", padding: "10px 20px", cursor: "pointer", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "'Jost',sans-serif" },
  stats:       { display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" },
  stat:        { background: "#fff", border: `1px solid ${BRAND.border}`, padding: "18px 28px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", minWidth: "110px", fontFamily: "'Jost',sans-serif", transition: "all .2s" },
  statActive:  { background: BRAND.dark, borderColor: BRAND.dark },
  statNum:     { fontSize: "28px", fontWeight: "500" },
  statLabel:   { fontSize: "10px", color: BRAND.textMuted, textTransform: "uppercase", letterSpacing: ".1em" },
  empty:       { textAlign: "center", padding: "80px", color: BRAND.textMuted, fontFamily: "'Cormorant Garamond',serif", fontSize: "20px" },
  tableWrap:   { background: "#fff", border: `1px solid ${BRAND.border}`, overflow: "auto" },
  table:       { width: "100%", borderCollapse: "collapse", minWidth: "960px" },
  th:          { padding: "14px 16px", textAlign: "left", fontSize: "9px", textTransform: "uppercase", letterSpacing: ".15em", color: BRAND.textMuted, borderBottom: `1px solid ${BRAND.border}`, background: BRAND.cream, fontFamily: "'Jost',sans-serif", fontWeight: "500" },
  td:          { padding: "16px", fontSize: "13px", verticalAlign: "top", borderBottom: `1px solid ${BRAND.border}` },
  clientName:  { fontWeight: "500", marginBottom: "3px", color: BRAND.dark },
  clientEmail: { color: BRAND.gold, fontSize: "12px", textDecoration: "none", display: "block" },
  clientPhone: { color: BRAND.textMuted, fontSize: "12px", marginTop: "2px" },
  serviceName: { fontWeight: "500", marginBottom: "4px", color: BRAND.dark, lineHeight: "1.4" },
  noteText:    { fontSize: "12px", color: BRAND.textMuted, fontStyle: "italic", marginTop: "4px" },
  badge:       { display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: "500" },
  dot:         { width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, display: "inline-block" },
  actions:     { display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" },
  btnConfirm:  { background: "#E8F5E9", color: "#2E7D32", border: "1px solid #A5D6A7", padding: "5px 10px", cursor: "pointer", fontSize: "11px", fontWeight: "600", fontFamily: "'Jost',sans-serif" },
  btnReject:   { background: "#FFEBEE", color: "#C62828", border: "1px solid #EF9A9A", padding: "5px 9px", cursor: "pointer", fontSize: "12px" },
  btnPaid:     { background: "#E3F2FD", color: "#1565C0", border: "1px solid #90CAF9", padding: "5px 10px", cursor: "pointer", fontSize: "11px", fontWeight: "600", fontFamily: "'Jost',sans-serif" },
  btnIcon:     { background: BRAND.cream, border: `1px solid ${BRAND.border}`, padding: "5px 8px", textDecoration: "none", fontSize: "14px", cursor: "pointer" },
};

const cm = {
  overlay:       { position: "fixed", inset: 0, background: "rgba(26,24,20,.85)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", backdropFilter: "blur(8px)" },
  modal:         { background: BRAND.cream, width: "100%", maxWidth: "540px", border: `1px solid ${BRAND.border}`, fontFamily: "'Jost',sans-serif" },
  header:        { padding: "32px 32px 24px" },
  tag:           { fontSize: "9px", letterSpacing: ".28em", color: BRAND.gold, textTransform: "uppercase", marginBottom: "10px" },
  title:         { fontFamily: "'Cormorant Garamond',serif", fontSize: "22px", fontWeight: "400", color: BRAND.dark, marginBottom: "8px" },
  sub:           { fontSize: "13px", fontWeight: "300", color: BRAND.textMuted, lineHeight: "1.6" },
  divider:       { height: "1px", background: BRAND.border },
  body:          { padding: "24px 32px" },
  field:         { marginBottom: "20px" },
  fieldLabel:    { display: "block", fontSize: "9px", letterSpacing: ".18em", color: BRAND.textMuted, textTransform: "uppercase", marginBottom: "8px" },
  input:         { width: "100%", background: "#fff", border: `1px solid ${BRAND.border}`, padding: "11px 14px", fontSize: "16px", fontFamily: "'Jost',sans-serif", fontWeight: "400", color: BRAND.dark, transition: "border-color .2s" },
  importoLabel:  { fontFamily: "'Cormorant Garamond',serif", fontSize: "20px", color: BRAND.textMuted },
  linkPreview:   { marginTop: "10px", padding: "10px 14px", background: "#fff", border: `1px solid ${BRAND.border}` },
  linkPreviewLabel: { fontSize: "9px", letterSpacing: ".15em", color: BRAND.textMuted, textTransform: "uppercase", display: "block", marginBottom: "4px" },
  linkPreviewUrl:{ fontSize: "13px", color: BRAND.gold, textDecoration: "none", wordBreak: "break-all" },
  textarea:      { width: "100%", background: "#fff", border: `1px solid ${BRAND.border}`, padding: "11px 14px", fontSize: "13px", fontFamily: "'Jost',sans-serif", fontWeight: "300", color: BRAND.dark, resize: "vertical", lineHeight: "1.6" },
  error:         { fontSize: "12px", color: "#C62828", marginTop: "6px", fontWeight: "500" },
  preview:       { background: "#fff", border: `1px solid ${BRAND.border}`, padding: "14px 16px", marginTop: "4px" },
  previewTag:    { fontSize: "9px", letterSpacing: ".18em", color: BRAND.gold, textTransform: "uppercase", marginBottom: "8px", display: "block" },
  previewText:   { fontSize: "13px", fontWeight: "300", color: BRAND.textMuted, lineHeight: "1.7" },
  footer:        { display: "flex", gap: "10px", justifyContent: "flex-end", padding: "20px 32px 28px", borderTop: `1px solid ${BRAND.border}` },
  btnCancel:     { background: "transparent", color: BRAND.textMuted, border: `1px solid ${BRAND.border}`, padding: "11px 22px", fontSize: "11px", letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Jost',sans-serif" },
  btnConfirm:    { background: BRAND.dark, color: BRAND.gold, border: "none", padding: "12px 24px", fontSize: "11px", fontWeight: "500", letterSpacing: ".12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Jost',sans-serif", transition: "background .2s" },
};

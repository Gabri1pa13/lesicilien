"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, Badge, BRAND, Field, fmtDate, fmtEUR, Modal, ui } from "../_lib";

const CHANNELS = [
  { value: "diretta", label: "Diretta" }, { value: "airbnb", label: "Airbnb" },
  { value: "booking", label: "Booking.com" }, { value: "vrbo", label: "Vrbo" }, { value: "altro", label: "Altro" },
];
const STATUS = {
  confermata:  { label: "Confermata", color: "#2E7D32", bg: "#E8F5E9" },
  in_attesa:   { label: "In attesa",  color: "#92702A", bg: "#FDF6E3" },
  cancellata:  { label: "Cancellata", color: "#C62828", bg: "#FFEBEE" },
  completata:  { label: "Completata", color: "#1565C0", bg: "#E3F2FD" },
};

function commissionPct(booking) {
  return booking.commission_pct ?? booking.properties?.commission_pct ?? booking.properties?.owners?.commission_pct ?? 20;
}

function BookingModal({ booking, properties, onClose, onSaved }) {
  const isEdit = !!booking;
  const [form, setForm] = useState({
    property_id: booking?.property_id || (properties[0]?.id || ""),
    guest_name: booking?.guest_name || "", guest_email: booking?.guest_email || "", guest_phone: booking?.guest_phone || "",
    channel: booking?.channel || "diretta", check_in: booking?.check_in || "", check_out: booking?.check_out || "",
    guests_count: booking?.guests_count ?? 1, total_amount: booking?.total_amount ?? "",
    commission_pct: booking?.commission_pct ?? "", status: booking?.status || "confermata", notes: booking?.notes || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.property_id) { setError("Seleziona un immobile"); return; }
    if (!form.check_in || !form.check_out) { setError("Inserisci check-in e check-out"); return; }
    if (form.check_out <= form.check_in) { setError("Il check-out deve essere dopo il check-in"); return; }
    setLoading(true); setError("");
    try {
      const payload = {
        ...form,
        guests_count: parseInt(form.guests_count) || 1,
        total_amount: form.total_amount ? parseFloat(form.total_amount) : 0,
        commission_pct: form.commission_pct ? parseFloat(form.commission_pct) : null,
        ...(isEdit ? { id: booking.id } : {}),
      };
      const json = await apiFetch("/api/crm/bookings", { method: isEdit ? "PUT" : "POST", body: payload });
      onSaved(json.data, !isEdit);
      onClose();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <Modal tag={isEdit ? "MODIFICA PRENOTAZIONE" : "NUOVA PRENOTAZIONE"} title={isEdit ? `Prenotazione ${booking.properties?.name || ""}` : "Aggiungi una prenotazione"} onClose={onClose}
      footer={<>
        <button style={ui.ghostBtn} onClick={onClose}>Annulla</button>
        <button style={ui.primaryBtn} onClick={save} disabled={loading}>{loading ? "Salvataggio..." : "✓ Salva"}</button>
      </>}>
      <Field label="Immobile *">
        <select style={{ ...ui.input, cursor: "pointer" }} value={form.property_id} onChange={e => set("property_id", e.target.value)}>
          <option value="">— Seleziona —</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Check-in *"><input style={ui.input} type="date" value={form.check_in} onChange={e => set("check_in", e.target.value)} /></Field>
        <Field label="Check-out *"><input style={ui.input} type="date" value={form.check_out} onChange={e => set("check_out", e.target.value)} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Nome ospite"><input style={ui.input} value={form.guest_name} onChange={e => set("guest_name", e.target.value)} /></Field>
        <Field label="Email ospite"><input style={ui.input} type="email" value={form.guest_email} onChange={e => set("guest_email", e.target.value)} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        <Field label="Telefono"><input style={ui.input} value={form.guest_phone} onChange={e => set("guest_phone", e.target.value)} /></Field>
        <Field label="Canale">
          <select style={{ ...ui.input, cursor: "pointer" }} value={form.channel} onChange={e => set("channel", e.target.value)}>
            {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="N. ospiti"><input style={ui.input} type="number" min="1" value={form.guests_count} onChange={e => set("guests_count", e.target.value)} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        <Field label="Importo totale (€)"><input style={ui.input} type="number" value={form.total_amount} onChange={e => set("total_amount", e.target.value)} /></Field>
        <Field label="Commissione (%)"><input style={ui.input} type="number" step="0.5" value={form.commission_pct} onChange={e => set("commission_pct", e.target.value)} placeholder="da immobile" /></Field>
        <Field label="Stato">
          <select style={{ ...ui.input, cursor: "pointer" }} value={form.status} onChange={e => set("status", e.target.value)}>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Note"><textarea style={{ ...ui.input, resize: "vertical" }} rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} /></Field>
      {error && <p style={ui.error}>{error}</p>}
    </Modal>
  );
}

export default function PrenotazioniPage() {
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editModal, setEditModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const [b, p] = await Promise.all([apiFetch("/api/crm/bookings"), apiFetch("/api/crm/properties")]);
      setBookings(b.data || []);
      setProperties(p.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSaved = (data, isNew) => setBookings(p => isNew ? [data, ...p] : p.map(b => b.id === data.id ? data : b));
  const handleDelete = async () => {
    try { await apiFetch("/api/crm/bookings", { method: "DELETE", body: { id: deleteTarget.id } }); setBookings(p => p.filter(b => b.id !== deleteTarget.id)); }
    catch (e) { console.error(e); }
    setDeleteTarget(null);
  };

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);
  const counts = useMemo(() => ({
    all: bookings.length,
    confermata: bookings.filter(b => b.status === "confermata").length,
    in_attesa: bookings.filter(b => b.status === "in_attesa").length,
    completata: bookings.filter(b => b.status === "completata").length,
  }), [bookings]);

  return (
    <div style={ui.page}>
      <div style={ui.toolbar}>
        <div>
          <p style={ui.headTag}>OPERATIVITÀ</p>
          <h1 style={ui.h1}>Prenotazioni</h1>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={ui.ghostBtn} onClick={load}>↻ Aggiorna</button>
          <button style={ui.primaryBtn} onClick={() => setEditModal("new")} disabled={properties.length === 0}>+ Nuova prenotazione</button>
        </div>
      </div>

      <div style={ui.statGrid}>
        {[["all", "Totali"], ["confermata", "Confermate"], ["in_attesa", "In attesa"], ["completata", "Completate"]].map(([k, label]) => (
          <div key={k} onClick={() => setFilter(k)} style={{ cursor: "pointer" }}>
            <div style={{ ...ui.stat, ...(filter === k ? { background: BRAND.dark, borderColor: BRAND.dark } : {}) }}>
              <span style={{ ...ui.statNum, color: filter === k ? BRAND.gold : BRAND.dark }}>{counts[k]}</span>
              <span style={{ ...ui.statLabel, color: filter === k ? "#D9CDA9" : BRAND.textMuted }}>{label}</span>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={ui.empty}>Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div style={ui.empty}>Nessuna prenotazione trovata.</div>
      ) : (
        <div style={ui.tableWrap}>
          <table style={ui.table}>
            <thead><tr>{["Immobile", "Ospite", "Check-in / out", "Canale", "Importo", "Commissione", "Payout stimato", "Stato", ""].map(h => <th key={h} style={ui.th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(b => {
                const st = STATUS[b.status] || STATUS.confermata;
                const pct = commissionPct(b);
                const commission = (Number(b.total_amount) * pct) / 100;
                const payout = Number(b.total_amount) - commission;
                return (
                  <tr key={b.id}>
                    <td style={ui.td}>{b.properties?.name || "—"}</td>
                    <td style={ui.td}>
                      <div>{b.guest_name || "—"}</div>
                      {b.guest_email && <div style={{ fontSize: "11px", color: BRAND.textMuted }}>{b.guest_email}</div>}
                    </td>
                    <td style={ui.td}>{fmtDate(b.check_in)} → {fmtDate(b.check_out)}</td>
                    <td style={ui.td}>{CHANNELS.find(c => c.value === b.channel)?.label || b.channel}</td>
                    <td style={ui.td}>{fmtEUR(b.total_amount)}</td>
                    <td style={ui.td}>{fmtEUR(commission)} ({pct}%)</td>
                    <td style={ui.td}>{fmtEUR(payout)}</td>
                    <td style={ui.td}><Badge color={st.color} bg={st.bg}>{st.label}</Badge></td>
                    <td style={ui.td}>
                      <div style={ui.actions}>
                        <button style={ui.linkBtn} onClick={() => setEditModal(b)}>Modifica</button>
                        <button style={{ ...ui.linkBtn, color: "#C62828" }} onClick={() => setDeleteTarget(b)}>Elimina</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editModal !== null && (
        <BookingModal booking={editModal === "new" ? null : editModal} properties={properties} onClose={() => setEditModal(null)} onSaved={handleSaved} />
      )}
      {deleteTarget && (
        <Modal tag="ELIMINA PRENOTAZIONE" title={deleteTarget.properties?.name} sub="Questa azione è irreversibile." onClose={() => setDeleteTarget(null)}
          footer={<>
            <button style={ui.ghostBtn} onClick={() => setDeleteTarget(null)}>Annulla</button>
            <button style={{ ...ui.primaryBtn, background: "#C62828" }} onClick={handleDelete}>Elimina</button>
          </>} maxWidth="420px">
          <div />
        </Modal>
      )}
    </div>
  );
}

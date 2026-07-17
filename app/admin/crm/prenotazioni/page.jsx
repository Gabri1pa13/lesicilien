"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, Badge, BRAND, Field, fmtDate, fmtEUR, Modal, ui } from "../_lib";
import { DataTable, useToast } from "../_ui";
import { IconCalendar, IconList, IconSearch } from "../_icons";

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

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

function CalendarView({ bookings, onSelect }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  const monthLabel = cursor.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // lun=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const byDay = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      if (!b.check_in) return;
      const [by, bm, bd] = b.check_in.split("-").map(Number);
      if (by === year && bm === month + 1) {
        map[bd] = map[bd] || [];
        map[bd].push(b);
      }
    });
    return map;
  }, [bookings, year, month]);

  return (
    <div style={{ background: "#fff", border: `1px solid ${BRAND.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${BRAND.border}` }}>
        <button style={ui.ghostBtn} onClick={() => setCursor(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>← Prec</button>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "20px", color: BRAND.dark, textTransform: "capitalize" }}>{monthLabel}</p>
        <button style={ui.ghostBtn} onClick={() => setCursor(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>Succ →</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: `1px solid ${BRAND.border}` }}>
        {WEEKDAYS.map(d => (
          <div key={d} style={{ padding: "8px", textAlign: "center", fontFamily: "'Jost',sans-serif", fontSize: "10px", letterSpacing: ".08em", textTransform: "uppercase", color: BRAND.textMuted }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
        {cells.map((day, i) => {
          const items = day ? byDay[day] || [] : [];
          const isToday = day && new Date().toDateString() === new Date(year, month, day).toDateString();
          return (
            <div key={i} style={{ minHeight: "92px", borderRight: `1px solid ${BRAND.border}`, borderBottom: `1px solid ${BRAND.border}`, padding: "6px", background: day ? "#fff" : BRAND.cream }}>
              {day && (
                <>
                  <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "11px", color: isToday ? BRAND.gold : BRAND.textMuted, fontWeight: isToday ? 600 : 400, marginBottom: "4px" }}>{day}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    {items.slice(0, 3).map(b => {
                      const st = STATUS[b.status] || STATUS.confermata;
                      return (
                        <div key={b.id} onClick={() => onSelect(b)} title={`${b.properties?.name || ""} · ${b.guest_name || ""}`}
                          style={{ background: st.bg, color: st.color, fontSize: "10px", padding: "2px 5px", cursor: "pointer", fontFamily: "'Jost',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {b.properties?.name || "—"}
                        </div>
                      );
                    })}
                    {items.length > 3 && <p style={{ fontSize: "10px", color: BRAND.textMuted }}>+{items.length - 3} altre</p>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PrenotazioniPage() {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list");
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

  const handleSaved = (data, isNew) => {
    setBookings(p => isNew ? [data, ...p] : p.map(b => b.id === data.id ? data : b));
    toast.success(isNew ? "Prenotazione creata" : "Prenotazione aggiornata");
  };
  const handleDelete = async () => {
    try { await apiFetch("/api/crm/bookings", { method: "DELETE", body: { id: deleteTarget.id } }); setBookings(p => p.filter(b => b.id !== deleteTarget.id)); toast.success("Prenotazione eliminata"); }
    catch (e) { toast.error("Errore: " + e.message); }
    setDeleteTarget(null);
  };

  const bulkSetStatus = async (ids, status) => {
    try {
      await Promise.all(ids.map(id => apiFetch("/api/crm/bookings", { method: "PUT", body: { id, status } })));
      setBookings(p => p.map(b => ids.includes(b.id) ? { ...b, status } : b));
      toast.success(`${ids.length} prenotazioni aggiornate`);
    } catch (e) { toast.error("Errore: " + e.message); }
  };
  const bulkDelete = async (ids) => {
    try {
      await Promise.all(ids.map(id => apiFetch("/api/crm/bookings", { method: "DELETE", body: { id } })));
      setBookings(p => p.filter(b => !ids.includes(b.id)));
      toast.success(`${ids.length} prenotazioni eliminate`);
    } catch (e) { toast.error("Errore: " + e.message); }
  };

  const filtered = useMemo(() => {
    let list = filter === "all" ? bookings : bookings.filter(b => b.status === filter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(b => [b.guest_name, b.guest_email, b.properties?.name].filter(Boolean).some(v => v.toLowerCase().includes(q)));
    return list;
  }, [bookings, filter, search]);

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

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#fff", border: `1px solid ${BRAND.border}`, padding: "9px 12px", minWidth: "260px" }}>
          <IconSearch size={15} style={{ color: BRAND.textMuted, flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per ospite o immobile..." style={{ border: "none", outline: "none", fontFamily: "'Jost',sans-serif", fontSize: "13px", width: "100%" }} />
        </div>
        <div style={{ display: "flex", marginLeft: "auto" }}>
          <button onClick={() => setView("list")} style={{ ...ui.ghostBtn, padding: "9px 11px", background: view === "list" ? BRAND.dark : "transparent", color: view === "list" ? BRAND.gold : BRAND.textMuted, borderColor: view === "list" ? BRAND.dark : BRAND.border }}><IconList size={14} /></button>
          <button onClick={() => setView("calendar")} style={{ ...ui.ghostBtn, padding: "9px 11px", borderLeft: "none", background: view === "calendar" ? BRAND.dark : "transparent", color: view === "calendar" ? BRAND.gold : BRAND.textMuted, borderColor: view === "calendar" ? BRAND.dark : BRAND.border }}><IconCalendar size={14} /></button>
        </div>
      </div>

      {loading ? (
        <div style={ui.empty}>Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div style={ui.empty}>Nessuna prenotazione trovata.</div>
      ) : view === "calendar" ? (
        <CalendarView bookings={filtered} onSelect={setEditModal} />
      ) : (
        <DataTable
          getRowId={(b) => b.id}
          data={filtered}
          selectable
          bulkActions={[
            { label: "Segna completate", onClick: (ids) => bulkSetStatus(ids, "completata") },
            { label: "Segna cancellate", onClick: (ids) => bulkSetStatus(ids, "cancellata") },
            { label: "Elimina", danger: true, onClick: (ids) => { if (confirm(`Eliminare ${ids.length} prenotazioni?`)) bulkDelete(ids); } },
          ]}
          columns={[
            { key: "property", label: "Immobile", sortable: true, sortValue: (b) => b.properties?.name || "", render: (b) => b.properties?.name || "—" },
            { key: "guest", label: "Ospite", render: (b) => (<>
              <div>{b.guest_name || "—"}</div>
              {b.guest_email && <div style={{ fontSize: "11px", color: BRAND.textMuted }}>{b.guest_email}</div>}
            </>) },
            { key: "check_in", label: "Check-in / out", sortable: true, render: (b) => `${fmtDate(b.check_in)} → ${fmtDate(b.check_out)}` },
            { key: "channel", label: "Canale", render: (b) => CHANNELS.find(c => c.value === b.channel)?.label || b.channel },
            { key: "total_amount", label: "Importo", sortable: true, sortValue: (b) => Number(b.total_amount || 0), render: (b) => fmtEUR(b.total_amount) },
            { key: "payout", label: "Payout stimato", render: (b) => { const pct = commissionPct(b); return fmtEUR(Number(b.total_amount) - (Number(b.total_amount) * pct) / 100); } },
            { key: "status", label: "Stato", sortable: true, render: (b) => { const st = STATUS[b.status] || STATUS.confermata; return <Badge color={st.color} bg={st.bg}>{st.label}</Badge>; } },
            { key: "actions", label: "", stopRowClick: true, render: (b) => (
              <div style={ui.actions}>
                <button style={ui.linkBtn} onClick={() => setEditModal(b)}>Modifica</button>
                <button style={{ ...ui.linkBtn, color: "#C62828" }} onClick={() => setDeleteTarget(b)}>Elimina</button>
              </div>
            ) },
          ]}
        />
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

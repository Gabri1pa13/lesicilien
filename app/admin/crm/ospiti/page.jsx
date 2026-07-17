"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, Badge, BRAND, Field, fmtDate, fmtEUR, Modal, ui } from "../_lib";
import { DataTable, useToast } from "../_ui";
import { IconSearch } from "../_icons";

function initials(name) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}
function Avatar({ name }) {
  return (
    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(191,160,90,.14)", color: "#92702A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Jost',sans-serif", fontSize: "11px", fontWeight: 500, flexShrink: 0 }}>
      {initials(name)}
    </div>
  );
}

function GuestModal({ guest, onClose, onSaved }) {
  const isEdit = !!guest;
  const [form, setForm] = useState({
    name: guest?.name || "", email: guest?.email || "", phone: guest?.phone || "",
    nationality: guest?.nationality || "", notes: guest?.notes || "",
    marketing_opt_in: guest?.marketing_opt_in || false,
    tags: (guest?.tags || []).join(", "),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) { setError("Il nome è obbligatorio"); return; }
    setLoading(true); setError("");
    try {
      const payload = {
        ...form,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        ...(isEdit ? { id: guest.id } : {}),
      };
      const json = await apiFetch("/api/crm/guests", { method: isEdit ? "PUT" : "POST", body: payload });
      onSaved(json.data, !isEdit);
      onClose();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <Modal tag={isEdit ? "MODIFICA OSPITE" : "NUOVO OSPITE"} title={isEdit ? guest.name : "Aggiungi un ospite"} onClose={onClose}
      footer={<>
        <button style={ui.ghostBtn} onClick={onClose}>Annulla</button>
        <button style={ui.primaryBtn} onClick={save} disabled={loading}>{loading ? "Salvataggio..." : "✓ Salva"}</button>
      </>}>
      <Field label="Nome *"><input style={ui.input} value={form.name} onChange={e => set("name", e.target.value)} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Email"><input style={ui.input} type="email" value={form.email} onChange={e => set("email", e.target.value)} /></Field>
        <Field label="Telefono"><input style={ui.input} value={form.phone} onChange={e => set("phone", e.target.value)} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Nazionalità"><input style={ui.input} value={form.nationality} onChange={e => set("nationality", e.target.value)} /></Field>
        <Field label="Tag (separati da virgola)"><input style={ui.input} value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="VIP, ripetente..." /></Field>
      </div>
      <Field label="Note"><textarea style={{ ...ui.input, resize: "vertical" }} rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} /></Field>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input type="checkbox" id="opt_in" checked={form.marketing_opt_in} onChange={e => set("marketing_opt_in", e.target.checked)} style={{ width: "16px", height: "16px" }} />
        <label htmlFor="opt_in" style={{ ...ui.label, marginBottom: 0 }}>Consenso marketing</label>
      </div>
      {error && <p style={ui.error}>{error}</p>}
    </Modal>
  );
}

function GuestDetail({ guest, onClose, onEdit }) {
  const bookings = guest.bookings || [];
  return (
    <Modal maxWidth="560px" tag="SCHEDA OSPITE" title={guest.name} sub={guest.email} onClose={onClose}
      footer={<>
        <button style={ui.ghostBtn} onClick={() => onEdit(guest)}>✎ Modifica</button>
        <button style={ui.ghostBtn} onClick={onClose}>Chiudi</button>
      </>}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {guest.marketing_opt_in && <Badge color="#2E7D32" bg="#E8F5E9">Consenso marketing</Badge>}
        {(guest.tags || []).map(t => <Badge key={t} color={BRAND.dark} bg="#F1EEE8">{t}</Badge>)}
      </div>
      <div style={{ fontSize: "13px" }}>
        <div><strong>Telefono:</strong> {guest.phone || "—"}</div>
        <div><strong>Nazionalità:</strong> {guest.nationality || "—"}</div>
      </div>
      {guest.notes && <p style={{ fontSize: "13px", color: BRAND.textMuted, whiteSpace: "pre-wrap" }}>{guest.notes}</p>}
      <div style={ui.mDivider} />
      <p style={{ ...ui.label, marginBottom: "6px" }}>Storico prenotazioni ({bookings.length})</p>
      {bookings.length === 0 ? (
        <p style={{ fontSize: "13px", color: BRAND.textMuted }}>Nessuna prenotazione registrata.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {bookings.map(b => (
            <div key={b.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", borderBottom: `1px solid ${BRAND.border}`, paddingBottom: "6px" }}>
              <span>{b.properties?.name || "—"} · {fmtDate(b.check_in)} → {fmtDate(b.check_out)}</span>
              <span>{fmtEUR(b.total_amount)}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default function OspitiPage() {
  const toast = useToast();
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editModal, setEditModal] = useState(null);
  const [detailGuest, setDetailGuest] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try { const json = await apiFetch("/api/crm/guests"); setGuests(json.data || []); }
    catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSaved = (data, isNew) => {
    setGuests(p => isNew ? [data, ...p] : p.map(g => g.id === data.id ? { ...g, ...data } : g));
    toast.success(isNew ? "Ospite aggiunto" : "Ospite aggiornato");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter(g => [g.name, g.email, g.phone].filter(Boolean).some(v => v.toLowerCase().includes(q)));
  }, [guests, search]);

  return (
    <div style={ui.page}>
      <div style={ui.toolbar}>
        <div>
          <p style={ui.headTag}>CRM OSPITI</p>
          <h1 style={ui.h1}>Ospiti</h1>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={ui.ghostBtn} onClick={load}>↻ Aggiorna</button>
          <button style={ui.primaryBtn} onClick={() => setEditModal("new")}>+ Nuovo ospite</button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", maxWidth: "320px", background: "#fff", border: `1px solid ${BRAND.border}`, padding: "9px 12px" }}>
        <IconSearch size={15} style={{ color: BRAND.textMuted, flexShrink: 0 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per nome, email, telefono..."
          style={{ border: "none", outline: "none", fontFamily: "'Jost',sans-serif", fontSize: "13px", width: "100%" }} />
      </div>

      {loading ? (
        <div style={ui.empty}>Caricamento...</div>
      ) : (
        <DataTable
          getRowId={(g) => g.id}
          data={filtered}
          onRowClick={setDetailGuest}
          emptyMessage="Nessun ospite trovato. Gli ospiti vengono creati automaticamente anche dalle prenotazioni."
          columns={[
            { key: "name", label: "Nome", sortable: true, render: (g) => (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Avatar name={g.name} /><span style={{ fontWeight: 500 }}>{g.name}</span>
              </div>
            ) },
            { key: "contact", label: "Contatti", render: (g) => (<>
              <div>{g.email || "—"}</div>
              {g.phone && <div style={{ fontSize: "11px", color: BRAND.textMuted }}>{g.phone}</div>}
            </>) },
            { key: "bookings", label: "Prenotazioni", sortable: true, sortValue: (g) => (g.bookings || []).length, render: (g) => (g.bookings || []).length },
            { key: "tags", label: "Tag", render: (g) => (g.tags || []).join(", ") || "—" },
            { key: "actions", label: "", stopRowClick: true, render: (g) => <button style={ui.linkBtn} onClick={() => setEditModal(g)}>Modifica</button> },
          ]}
        />
      )}

      {editModal !== null && (
        <GuestModal guest={editModal === "new" ? null : editModal} onClose={() => setEditModal(null)} onSaved={handleSaved} />
      )}
      {detailGuest && (
        <GuestDetail guest={detailGuest} onClose={() => setDetailGuest(null)} onEdit={(g) => { setDetailGuest(null); setEditModal(g); }} />
      )}
    </div>
  );
}

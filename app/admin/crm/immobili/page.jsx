"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch, Badge, BRAND, Field, fmtEUR, fmtDate, Modal, ui, useCrm } from "../_lib";

const TYPES = [
  { value: "villa", label: "Villa" }, { value: "appartamento", label: "Appartamento" },
  { value: "casa", label: "Casa" }, { value: "yacht", label: "Yacht" }, { value: "altro", label: "Altro" },
];
const STATUS = {
  onboarding: { label: "Onboarding", color: "#92702A", bg: "#FDF6E3" },
  active:     { label: "Attivo",     color: "#2E7D32", bg: "#E8F5E9" },
  inactive:   { label: "Inattivo",   color: "#8A8278", bg: "#F1EEE8" },
};
const EXPENSE_CATEGORIES = ["manutenzione", "pulizie", "utenze", "commissioni", "tasse", "altro"];

function PropertyModal({ property, owners, defaultOwnerId, onClose, onSaved }) {
  const isEdit = !!property;
  const [form, setForm] = useState({
    owner_id: property?.owner_id || defaultOwnerId || "",
    name: property?.name || "", address: property?.address || "", city: property?.city || "Palermo",
    type: property?.type || "villa", bedrooms: property?.bedrooms ?? "", bathrooms: property?.bathrooms ?? "",
    max_guests: property?.max_guests ?? "", base_price: property?.base_price ?? "", cleaning_fee: property?.cleaning_fee ?? "",
    commission_pct: property?.commission_pct ?? "", status: property?.status || "onboarding", notes: property?.notes || "",
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
        owner_id: form.owner_id || null,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        max_guests: form.max_guests ? parseInt(form.max_guests) : null,
        base_price: form.base_price ? parseFloat(form.base_price) : null,
        cleaning_fee: form.cleaning_fee ? parseFloat(form.cleaning_fee) : null,
        commission_pct: form.commission_pct ? parseFloat(form.commission_pct) : null,
        ...(isEdit ? { id: property.id } : {}),
      };
      const json = await apiFetch("/api/crm/properties", { method: isEdit ? "PUT" : "POST", body: payload });
      onSaved(json.data, !isEdit);
      onClose();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <Modal tag={isEdit ? "MODIFICA IMMOBILE" : "NUOVO IMMOBILE"} title={isEdit ? property.name : "Aggiungi un immobile"} onClose={onClose}
      footer={<>
        <button style={ui.ghostBtn} onClick={onClose}>Annulla</button>
        <button style={ui.primaryBtn} onClick={save} disabled={loading}>{loading ? "Salvataggio..." : "✓ Salva"}</button>
      </>}>
      <Field label="Nome immobile *"><input style={ui.input} value={form.name} onChange={e => set("name", e.target.value)} placeholder="es. Villa Harmony" /></Field>
      <Field label="Proprietario">
        <select style={{ ...ui.input, cursor: "pointer" }} value={form.owner_id} onChange={e => set("owner_id", e.target.value)}>
          <option value="">— Nessuno —</option>
          {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
        <Field label="Indirizzo"><input style={ui.input} value={form.address} onChange={e => set("address", e.target.value)} /></Field>
        <Field label="Città"><input style={ui.input} value={form.city} onChange={e => set("city", e.target.value)} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Tipo">
          <select style={{ ...ui.input, cursor: "pointer" }} value={form.type} onChange={e => set("type", e.target.value)}>
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Stato">
          <select style={{ ...ui.input, cursor: "pointer" }} value={form.status} onChange={e => set("status", e.target.value)}>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        <Field label="Camere"><input style={ui.input} type="number" value={form.bedrooms} onChange={e => set("bedrooms", e.target.value)} /></Field>
        <Field label="Bagni"><input style={ui.input} type="number" value={form.bathrooms} onChange={e => set("bathrooms", e.target.value)} /></Field>
        <Field label="Ospiti max"><input style={ui.input} type="number" value={form.max_guests} onChange={e => set("max_guests", e.target.value)} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        <Field label="Prezzo base (€/notte)"><input style={ui.input} type="number" value={form.base_price} onChange={e => set("base_price", e.target.value)} /></Field>
        <Field label="Costo pulizie (€)"><input style={ui.input} type="number" value={form.cleaning_fee} onChange={e => set("cleaning_fee", e.target.value)} /></Field>
        <Field label="Commissione (%)"><input style={ui.input} type="number" step="0.5" value={form.commission_pct} onChange={e => set("commission_pct", e.target.value)} placeholder="da proprietario" /></Field>
      </div>
      <Field label="Note"><textarea style={{ ...ui.input, resize: "vertical" }} rows={3} value={form.notes} onChange={e => set("notes", e.target.value)} /></Field>
      {error && <p style={ui.error}>{error}</p>}
    </Modal>
  );
}

function ExpensesPanel({ property }) {
  const { allowed } = useCrm();
  const canManage = allowed.includes("expenses");
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: "manutenzione", amount: "", description: "", expense_date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [property.id]);
  const load = async () => {
    setLoading(true);
    try { const json = await apiFetch(`/api/crm/properties/expenses?property_id=${property.id}`); setExpenses(json.data || []); }
    catch (e) { console.error(e); }
    setLoading(false);
  };

  const addExpense = async () => {
    if (!form.amount) return;
    setSaving(true);
    try {
      const json = await apiFetch("/api/crm/properties/expenses", { method: "POST", body: { property_id: property.id, ...form, amount: parseFloat(form.amount) } });
      setExpenses(p => [json.data, ...p]);
      setForm(p => ({ ...p, amount: "", description: "" }));
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const removeExpense = async (id) => {
    try { await apiFetch("/api/crm/properties/expenses", { method: "DELETE", body: { id } }); setExpenses(p => p.filter(e => e.id !== id)); }
    catch (e) { console.error(e); }
  };

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  if (!canManage) return null;

  return (
    <>
      <div style={ui.mDivider} />
      <p style={{ ...ui.label, marginBottom: "10px" }}>Spese ({fmtEUR(total)} totali)</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px auto", gap: "8px" }}>
        <select style={ui.input} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
          {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input style={ui.input} placeholder="Descrizione" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        <input style={ui.input} type="number" placeholder="€" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
        <button style={ui.primaryBtn} onClick={addExpense} disabled={saving || !form.amount}>+</button>
      </div>
      <div style={{ maxHeight: "180px", overflow: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
        {loading ? <p style={{ fontSize: "12px", color: BRAND.textMuted }}>Caricamento...</p> :
          expenses.length === 0 ? <p style={{ fontSize: "12px", color: BRAND.textMuted }}>Nessuna spesa registrata.</p> :
          expenses.map(e => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "6px 0", borderBottom: `1px solid ${BRAND.border}` }}>
              <span>{fmtDate(e.expense_date)} · {e.category} {e.description ? `— ${e.description}` : ""}</span>
              <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {fmtEUR(e.amount)} <button onClick={() => removeExpense(e.id)} style={{ background: "none", border: "none", color: "#C62828", cursor: "pointer" }}>✕</button>
              </span>
            </div>
          ))}
      </div>
    </>
  );
}

function PropertyDetail({ property, onClose, onEdit }) {
  const st = STATUS[property.status];
  return (
    <Modal maxWidth="620px" tag="SCHEDA IMMOBILE" title={property.name} sub={[property.address, property.city].filter(Boolean).join(", ")} onClose={onClose}
      footer={<>
        <button style={ui.ghostBtn} onClick={() => onEdit(property)}>✎ Modifica</button>
        <button style={ui.ghostBtn} onClick={onClose}>Chiudi</button>
      </>}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <Badge color={st.color} bg={st.bg}>{st.label}</Badge>
        {property.owners?.name && <Badge color={BRAND.dark} bg="#F1EEE8">Proprietario: {property.owners.name}</Badge>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", fontSize: "13px" }}>
        <div><strong>Camere:</strong> {property.bedrooms ?? "—"}</div>
        <div><strong>Bagni:</strong> {property.bathrooms ?? "—"}</div>
        <div><strong>Ospiti max:</strong> {property.max_guests ?? "—"}</div>
        <div><strong>Prezzo base:</strong> {fmtEUR(property.base_price)}</div>
        <div><strong>Pulizie:</strong> {fmtEUR(property.cleaning_fee)}</div>
        <div><strong>Commissione:</strong> {property.commission_pct != null ? `${property.commission_pct}%` : `${property.owners?.commission_pct ?? "—"}% (da proprietario)`}</div>
      </div>
      {property.notes && <p style={{ fontSize: "13px", color: BRAND.textMuted, whiteSpace: "pre-wrap" }}>{property.notes}</p>}
      <ExpensesPanel property={property} />
    </Modal>
  );
}

export default function ImmobiliPage() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editModal, setEditModal] = useState(null);
  const [detailProperty, setDetailProperty] = useState(null);

  useEffect(() => {
    load();
    if (searchParams.get("owner_id")) setEditModal("new");
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [p, o] = await Promise.all([apiFetch("/api/crm/properties"), apiFetch("/api/crm/owners/lite")]);
      setProperties(p.data || []);
      setOwners(o.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSaved = (data, isNew) => setProperties(p => isNew ? [data, ...p] : p.map(x => x.id === data.id ? data : x));

  const filtered = filter === "all" ? properties : properties.filter(p => p.status === filter);
  const counts = {
    all: properties.length,
    onboarding: properties.filter(p => p.status === "onboarding").length,
    active: properties.filter(p => p.status === "active").length,
    inactive: properties.filter(p => p.status === "inactive").length,
  };

  return (
    <div style={ui.page}>
      <div style={ui.toolbar}>
        <div>
          <p style={ui.headTag}>PORTFOLIO</p>
          <h1 style={ui.h1}>Immobili</h1>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={ui.ghostBtn} onClick={load}>↻ Aggiorna</button>
          <button style={ui.primaryBtn} onClick={() => setEditModal("new")}>+ Nuovo immobile</button>
        </div>
      </div>

      <div style={ui.statGrid}>
        {[["all", "Totali"], ["onboarding", "Onboarding"], ["active", "Attivi"], ["inactive", "Inattivi"]].map(([k, label]) => (
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
        <div style={ui.empty}>Nessun immobile. Aggiungine uno per iniziare a costruire il portfolio verso quota 100.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "14px" }}>
          {filtered.map(p => {
            const st = STATUS[p.status];
            return (
              <div key={p.id} onClick={() => setDetailProperty(p)} style={{ background: "#fff", border: `1px solid ${BRAND.border}`, padding: "16px", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                  <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "18px", color: BRAND.dark }}>{p.name}</p>
                  <Badge color={st.color} bg={st.bg}>{st.label}</Badge>
                </div>
                <p style={{ fontSize: "12px", color: BRAND.textMuted, marginBottom: "8px" }}>{[p.address, p.city].filter(Boolean).join(", ") || "—"}</p>
                <p style={{ fontSize: "12px", color: BRAND.textMuted }}>{p.bedrooms ?? "—"} camere · {p.max_guests ?? "—"} ospiti · {fmtEUR(p.base_price)}/notte</p>
                {p.owners?.name && <p style={{ fontSize: "11px", color: BRAND.gold, marginTop: "8px" }}>{p.owners.name}</p>}
              </div>
            );
          })}
        </div>
      )}

      {editModal !== null && (
        <PropertyModal
          property={editModal === "new" ? null : editModal}
          owners={owners}
          defaultOwnerId={editModal === "new" ? searchParams.get("owner_id") : null}
          onClose={() => setEditModal(null)}
          onSaved={handleSaved}
        />
      )}
      {detailProperty && (
        <PropertyDetail property={detailProperty} onClose={() => setDetailProperty(null)} onEdit={(p) => { setDetailProperty(null); setEditModal(p); }} />
      )}
    </div>
  );
}

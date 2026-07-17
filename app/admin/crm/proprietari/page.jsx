"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, BRAND, Field, fmtDate, Modal, ui, useCrm } from "../_lib";
import { useToast } from "../_ui";
import { IconDrag, IconSearch } from "../_icons";

const STAGES = [
  { key: "lead",               label: "Lead",              color: "#8A8278" },
  { key: "contattato",         label: "Contattato",        color: "#0891b2" },
  { key: "in_trattativa",      label: "In trattativa",     color: "#E6A817" },
  { key: "contratto_inviato",  label: "Contratto inviato", color: "#F57C00" },
  { key: "attivo",             label: "Attivo",            color: "#2E7D32" },
  { key: "in_pausa",           label: "In pausa",          color: "#795548" },
  { key: "perso",              label: "Perso",             color: "#C62828" },
];
const stageInfo = (k) => STAGES.find(s => s.key === k) || STAGES[0];

const ACTIVITY_TYPES = [
  { value: "note",   label: "Nota" },
  { value: "call",   label: "Chiamata" },
  { value: "email",  label: "Email" },
  { value: "meeting",label: "Incontro" },
];

function OwnerModal({ owner, onClose, onSaved }) {
  const isEdit = !!owner;
  const [form, setForm] = useState({
    name: owner?.name || "", company: owner?.company || "", email: owner?.email || "",
    phone: owner?.phone || "", source: owner?.source || "", stage: owner?.stage || "lead",
    commission_pct: owner?.commission_pct != null ? String(owner.commission_pct) : "20",
    notes: owner?.notes || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) { setError("Il nome è obbligatorio"); return; }
    setLoading(true); setError("");
    try {
      const payload = { ...form, commission_pct: parseFloat(form.commission_pct) || 0, ...(isEdit ? { id: owner.id } : {}) };
      const json = await apiFetch("/api/crm/owners", { method: isEdit ? "PUT" : "POST", body: payload });
      onSaved(json.data, !isEdit);
      onClose();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <Modal tag={isEdit ? "MODIFICA PROPRIETARIO" : "NUOVO LEAD"} title={isEdit ? owner.name : "Aggiungi un proprietario"} onClose={onClose}
      footer={<>
        <button style={ui.ghostBtn} onClick={onClose}>Annulla</button>
        <button style={ui.primaryBtn} onClick={save} disabled={loading}>{loading ? "Salvataggio..." : "✓ Salva"}</button>
      </>}>
      <Field label="Nome *"><input style={ui.input} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Nome e cognome" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Azienda"><input style={ui.input} value={form.company} onChange={e => set("company", e.target.value)} /></Field>
        <Field label="Provenienza (fonte)"><input style={ui.input} value={form.source} onChange={e => set("source", e.target.value)} placeholder="es. referral, sito, evento" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Email"><input style={ui.input} type="email" value={form.email} onChange={e => set("email", e.target.value)} /></Field>
        <Field label="Telefono"><input style={ui.input} value={form.phone} onChange={e => set("phone", e.target.value)} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Fase pipeline">
          <select style={{ ...ui.input, cursor: "pointer" }} value={form.stage} onChange={e => set("stage", e.target.value)}>
            {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Commissione (%)"><input style={ui.input} type="number" step="0.5" value={form.commission_pct} onChange={e => set("commission_pct", e.target.value)} /></Field>
      </div>
      <Field label="Note"><textarea style={{ ...ui.input, resize: "vertical" }} rows={3} value={form.notes} onChange={e => set("notes", e.target.value)} /></Field>
      {error && <p style={ui.error}>{error}</p>}
    </Modal>
  );
}

function OwnerDetail({ owner, onClose, onUpdated, onDeleted, onEdit }) {
  const { profile } = useCrm();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("note");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { load(); }, [owner.id]);
  const load = async () => {
    setLoading(true);
    try {
      const json = await apiFetch(`/api/crm/owners/activities?owner_id=${owner.id}`);
      setActivities(json.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const addActivity = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      const json = await apiFetch("/api/crm/owners/activities", { method: "POST", body: { owner_id: owner.id, type, content } });
      setActivities(p => [json.data, ...p]);
      setContent("");
    } catch (e) { console.error(e); }
    setPosting(false);
  };

  const changeStage = async (stage) => {
    try {
      const json = await apiFetch("/api/crm/owners", { method: "PUT", body: { id: owner.id, stage } });
      onUpdated(json.data);
      load();
    } catch (e) { console.error(e); }
  };

  const del = async () => {
    try {
      await apiFetch("/api/crm/owners", { method: "DELETE", body: { id: owner.id } });
      onDeleted(owner.id);
      onClose();
    } catch (e) { console.error(e); }
  };

  const st = stageInfo(owner.stage);
  const canDelete = profile?.role !== "sales";

  return (
    <Modal maxWidth="620px" tag="SCHEDA PROPRIETARIO" title={owner.name} sub={owner.company} onClose={onClose}
      footer={<>
        {canDelete && (confirmDelete
          ? <button style={{ ...ui.primaryBtn, background: "#C62828" }} onClick={del}>Confermi eliminazione?</button>
          : <button style={{ ...ui.ghostBtn, color: "#C62828", borderColor: "#EF9A9A" }} onClick={() => setConfirmDelete(true)}>Elimina</button>
        )}
        <button style={ui.ghostBtn} onClick={() => onEdit(owner)}>✎ Modifica</button>
        <button style={ui.ghostBtn} onClick={onClose}>Chiudi</button>
        {owner.stage === "attivo" && (
          <a href={`/admin/crm/immobili?owner_id=${owner.id}`} style={{ ...ui.primaryBtn, textDecoration: "none", display: "inline-block" }}>+ Aggiungi immobile</a>
        )}
      </>}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {STAGES.map(s => (
          <button key={s.key} onClick={() => changeStage(s.key)}
            style={{
              padding: "5px 12px", fontSize: "11px", fontFamily: "'Jost',sans-serif", cursor: "pointer",
              border: `1px solid ${s.key === owner.stage ? s.color : BRAND.border}`,
              background: s.key === owner.stage ? s.color : "#fff",
              color: s.key === owner.stage ? "#fff" : BRAND.textMuted,
            }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
        <div><strong>Email:</strong> {owner.email || "—"}</div>
        <div><strong>Telefono:</strong> {owner.phone || "—"}</div>
        <div><strong>Fonte:</strong> {owner.source || "—"}</div>
        <div><strong>Commissione:</strong> {owner.commission_pct}%</div>
      </div>
      {owner.notes && <p style={{ fontSize: "13px", color: BRAND.textMuted, whiteSpace: "pre-wrap" }}>{owner.notes}</p>}

      <div style={ui.mDivider} />

      <p style={{ ...ui.label, marginBottom: "10px" }}>Timeline</p>
      <div style={{ display: "flex", gap: "8px" }}>
        <select style={{ ...ui.input, width: "auto" }} value={type} onChange={e => setType(e.target.value)}>
          {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input style={ui.input} placeholder="Aggiungi una nota..." value={content} onChange={e => setContent(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addActivity()} />
        <button style={ui.primaryBtn} onClick={addActivity} disabled={posting || !content.trim()}>+</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "260px", overflow: "auto" }}>
        {loading ? <p style={{ fontSize: "13px", color: BRAND.textMuted }}>Caricamento...</p> :
          activities.length === 0 ? <p style={{ fontSize: "13px", color: BRAND.textMuted }}>Nessuna attività registrata.</p> :
          activities.map(a => (
            <div key={a.id} style={{ borderLeft: `2px solid ${BRAND.gold}`, paddingLeft: "12px" }}>
              <p style={{ fontSize: "13px", color: BRAND.dark }}>{a.content}</p>
              <p style={{ fontSize: "11px", color: BRAND.textMuted }}>
                {ACTIVITY_TYPES.find(t => t.value === a.type)?.label || a.type} · {fmtDate(a.created_at)} · {a.profiles?.full_name || ""}
              </p>
            </div>
          ))}
      </div>
    </Modal>
  );
}

export default function ProprietariPage() {
  const toast = useToast();
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [detailOwner, setDetailOwner] = useState(null);
  const [search, setSearch] = useState("");
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try { const json = await apiFetch("/api/crm/owners"); setOwners(json.data || []); }
    catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSaved = (data, isNew) => {
    setOwners(p => isNew ? [data, ...p] : p.map(o => o.id === data.id ? data : o));
    toast.success(isNew ? "Lead aggiunto alla pipeline" : "Proprietario aggiornato");
  };
  const handleUpdated = (data) => setOwners(p => p.map(o => o.id === data.id ? data : o));
  const handleDeleted = (id) => { setOwners(p => p.filter(o => o.id !== id)); toast.success("Proprietario eliminato"); };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return owners;
    return owners.filter(o => [o.name, o.company, o.email].filter(Boolean).some(v => v.toLowerCase().includes(q)));
  }, [owners, search]);

  const dropOnStage = async (stageKey) => {
    const id = dragId;
    setDragId(null); setOverStage(null);
    if (!id) return;
    const owner = owners.find(o => o.id === id);
    if (!owner || owner.stage === stageKey) return;
    const prevStage = owner.stage;
    setOwners(p => p.map(o => o.id === id ? { ...o, stage: stageKey } : o));
    try {
      const json = await apiFetch("/api/crm/owners", { method: "PUT", body: { id, stage: stageKey } });
      handleUpdated(json.data);
      toast.success(`${owner.name} spostato in "${stageInfo(stageKey).label}"`);
    } catch (e) {
      setOwners(p => p.map(o => o.id === id ? { ...o, stage: prevStage } : o));
      toast.error("Impossibile aggiornare la fase: " + e.message);
    }
  };

  return (
    <div style={ui.page}>
      <div style={ui.toolbar}>
        <div>
          <p style={ui.headTag}>PIPELINE ACQUISIZIONE</p>
          <h1 style={ui.h1}>Proprietari</h1>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={ui.ghostBtn} onClick={load}>↻ Aggiorna</button>
          <button style={ui.primaryBtn} onClick={() => setEditModal("new")}>+ Nuovo lead</button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", maxWidth: "320px", background: "#fff", border: `1px solid ${BRAND.border}`, padding: "9px 12px" }}>
        <IconSearch size={15} style={{ color: BRAND.textMuted, flexShrink: 0 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per nome, azienda, email..."
          style={{ border: "none", outline: "none", fontFamily: "'Jost',sans-serif", fontSize: "13px", width: "100%" }} />
      </div>

      {loading ? (
        <div style={ui.empty}>Caricamento...</div>
      ) : (
        <div style={{ display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "12px" }}>
          {STAGES.map(stage => {
            const items = filtered.filter(o => o.stage === stage.key);
            const isOver = overStage === stage.key;
            return (
              <div key={stage.key}
                onDragOver={(e) => { e.preventDefault(); setOverStage(stage.key); }}
                onDragLeave={() => setOverStage(p => p === stage.key ? null : p)}
                onDrop={(e) => { e.preventDefault(); dropOnStage(stage.key); }}
                style={{ minWidth: "260px", flex: "0 0 260px", background: isOver ? "rgba(191,160,90,.08)" : "transparent", transition: "background .12s", padding: "4px", border: isOver ? `1px dashed ${BRAND.gold}` : "1px dashed transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", padding: "0 4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: stage.color, display: "inline-block" }} />
                  <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "12px", letterSpacing: ".05em", color: BRAND.dark, fontWeight: "500" }}>{stage.label}</p>
                  <span style={{ fontSize: "11px", color: BRAND.textMuted }}>{items.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {items.map(o => (
                    <div key={o.id}
                      draggable
                      onDragStart={(e) => { setDragId(o.id); e.dataTransfer.effectAllowed = "move"; }}
                      onDragEnd={() => { setDragId(null); setOverStage(null); }}
                      onClick={() => setDetailOwner(o)}
                      style={{
                        background: "#fff", border: `1px solid ${BRAND.border}`, padding: "12px 14px", cursor: "grab",
                        opacity: dragId === o.id ? 0.4 : 1, display: "flex", gap: "8px", alignItems: "flex-start",
                        boxShadow: "0 1px 2px rgba(26,24,20,.04)", transition: "box-shadow .15s, opacity .15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 14px rgba(26,24,20,.1)"}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 2px rgba(26,24,20,.04)"}
                    >
                      <IconDrag size={13} style={{ color: BRAND.border, marginTop: "2px", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "13px", fontWeight: "500", color: BRAND.dark }}>{o.name}</p>
                        {o.company && <p style={{ fontSize: "11px", color: BRAND.textMuted, marginTop: "2px" }}>{o.company}</p>}
                        <p style={{ fontSize: "11px", color: BRAND.textMuted, marginTop: "6px" }}>{o.commission_pct}% commissione</p>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <div style={{ fontSize: "11px", color: BRAND.textMuted, fontStyle: "italic", padding: "8px 4px" }}>Vuoto</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editModal !== null && (
        <OwnerModal owner={editModal === "new" ? null : editModal} onClose={() => setEditModal(null)} onSaved={handleSaved} />
      )}
      {detailOwner && (
        <OwnerDetail
          owner={detailOwner}
          onClose={() => setDetailOwner(null)}
          onUpdated={(d) => { handleUpdated(d); setDetailOwner(d); }}
          onDeleted={handleDeleted}
          onEdit={(o) => { setDetailOwner(null); setEditModal(o); }}
        />
      )}
    </div>
  );
}

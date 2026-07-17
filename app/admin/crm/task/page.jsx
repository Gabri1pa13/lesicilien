"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { apiFetch, BRAND, Field, fmtDate, Modal, ui, useCrm } from "../_lib";
import { useToast } from "../_ui";
import { IconDrag, IconPlus } from "../_icons";

const isOverdue = (t) => t.due_date && t.status !== "fatto" && t.due_date < new Date().toISOString().slice(0, 10);

const STATUSES = [
  { key: "da_fare",  label: "Da fare",   color: "#8A8278" },
  { key: "in_corso", label: "In corso",  color: "#E6A817" },
  { key: "fatto",    label: "Fatto",     color: "#2E7D32" },
];
const TYPES = [
  { value: "pulizia",      label: "Pulizia" }, { value: "manutenzione", label: "Manutenzione" },
  { value: "check_in",     label: "Check-in" }, { value: "check_out",    label: "Check-out" }, { value: "altro", label: "Altro" },
];

function TaskModal({ task, properties, team, onClose, onSaved }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    property_id: task?.property_id || "", type: task?.type || "pulizia", title: task?.title || "",
    description: task?.description || "", due_date: task?.due_date || "", assigned_to: task?.assigned_to || "",
    status: task?.status || "da_fare",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) { setError("Il titolo è obbligatorio"); return; }
    setLoading(true); setError("");
    try {
      const payload = { ...form, property_id: form.property_id || null, assigned_to: form.assigned_to || null, ...(isEdit ? { id: task.id } : {}) };
      const json = await apiFetch("/api/crm/tasks", { method: isEdit ? "PUT" : "POST", body: payload });
      onSaved(json.data, !isEdit);
      onClose();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <Modal tag={isEdit ? "MODIFICA TASK" : "NUOVO TASK"} title={isEdit ? task.title : "Aggiungi un task"} onClose={onClose}
      footer={<>
        <button style={ui.ghostBtn} onClick={onClose}>Annulla</button>
        <button style={ui.primaryBtn} onClick={save} disabled={loading}>{loading ? "Salvataggio..." : "✓ Salva"}</button>
      </>}>
      <Field label="Titolo *"><input style={ui.input} value={form.title} onChange={e => set("title", e.target.value)} placeholder="es. Pulizia post check-out" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Immobile">
          <select style={{ ...ui.input, cursor: "pointer" }} value={form.property_id} onChange={e => set("property_id", e.target.value)}>
            <option value="">— Nessuno —</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Tipo">
          <select style={{ ...ui.input, cursor: "pointer" }} value={form.type} onChange={e => set("type", e.target.value)}>
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Scadenza"><input style={ui.input} type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} /></Field>
        <Field label="Assegnato a">
          <select style={{ ...ui.input, cursor: "pointer" }} value={form.assigned_to} onChange={e => set("assigned_to", e.target.value)}>
            <option value="">— Nessuno —</option>
            {team.map(t => <option key={t.id} value={t.id}>{t.full_name || t.id}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Descrizione"><textarea style={{ ...ui.input, resize: "vertical" }} rows={2} value={form.description} onChange={e => set("description", e.target.value)} /></Field>
      {error && <p style={ui.error}>{error}</p>}
    </Modal>
  );
}

export default function TaskPage() {
  const { profile } = useCrm();
  const toast = useToast();
  const canManage = profile?.role !== "cleaning";
  const [tasks, setTasks] = useState([]);
  const [properties, setProperties] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [quickAdd, setQuickAdd] = useState("");
  const [dragId, setDragId] = useState(null);
  const [overStatus, setOverStatus] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const calls = [apiFetch("/api/crm/tasks")];
      if (canManage) { calls.push(apiFetch("/api/crm/properties"), apiFetch("/api/crm/team/lite")); }
      const results = await Promise.all(calls);
      setTasks(results[0].data || []);
      if (canManage) { setProperties(results[1].data || []); setTeam(results[2].data || []); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSaved = (data, isNew) => setTasks(p => isNew ? [data, ...p] : p.map(t => t.id === data.id ? data : t));

  const changeStatus = async (task, status) => {
    setTasks(p => p.map(t => t.id === task.id ? { ...t, status } : t));
    try { const json = await apiFetch("/api/crm/tasks", { method: "PUT", body: { id: task.id, status } }); handleSaved(json.data, false); }
    catch (e) { setTasks(p => p.map(t => t.id === task.id ? { ...t, status: task.status } : t)); toast.error("Errore: " + e.message); }
  };

  const remove = async (task) => {
    try { await apiFetch("/api/crm/tasks", { method: "DELETE", body: { id: task.id } }); setTasks(p => p.filter(t => t.id !== task.id)); toast.success("Task eliminato"); }
    catch (e) { toast.error("Errore: " + e.message); }
  };

  const quickAddTask = async () => {
    if (!quickAdd.trim()) return;
    try {
      const json = await apiFetch("/api/crm/tasks", { method: "POST", body: { title: quickAdd.trim() } });
      handleSaved(json.data, true);
      setQuickAdd("");
      toast.success("Task aggiunto");
    } catch (e) { toast.error("Errore: " + e.message); }
  };

  const dropOnStatus = (status) => {
    const task = tasks.find(t => t.id === dragId);
    setDragId(null); setOverStatus(null);
    if (!task || task.status === status) return;
    changeStatus(task, status);
  };

  return (
    <div style={ui.page}>
      <div style={ui.toolbar}>
        <div>
          <p style={ui.headTag}>OPERATIVITÀ</p>
          <h1 style={ui.h1}>Task</h1>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={ui.ghostBtn} onClick={load}>↻ Aggiorna</button>
          {canManage && <button style={ui.primaryBtn} onClick={() => setEditModal("new")}>+ Nuovo task</button>}
        </div>
      </div>

      {loading ? (
        <div style={ui.empty}>Caricamento...</div>
      ) : (
        <div style={{ display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "12px" }}>
          {STATUSES.map(st => {
            const items = tasks.filter(t => t.status === st.key);
            const isOver = overStatus === st.key;
            return (
              <div key={st.key}
                onDragOver={(e) => { e.preventDefault(); setOverStatus(st.key); }}
                onDragLeave={() => setOverStatus(p => p === st.key ? null : p)}
                onDrop={(e) => { e.preventDefault(); dropOnStatus(st.key); }}
                style={{ minWidth: "280px", flex: "0 0 280px", background: isOver ? "rgba(191,160,90,.08)" : "transparent", padding: "4px", border: isOver ? `1px dashed ${BRAND.gold}` : "1px dashed transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", padding: "0 4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: st.color, display: "inline-block" }} />
                  <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "12px", letterSpacing: ".05em", color: BRAND.dark, fontWeight: "500" }}>{st.label}</p>
                  <span style={{ fontSize: "11px", color: BRAND.textMuted }}>{items.length}</span>
                </div>

                {st.key === "da_fare" && canManage && (
                  <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                    <input value={quickAdd} onChange={e => setQuickAdd(e.target.value)} onKeyDown={e => e.key === "Enter" && quickAddTask()}
                      placeholder="Aggiungi rapido..." style={{ ...ui.input, fontSize: "12px", padding: "8px 10px" }} />
                    <button onClick={quickAddTask} style={{ ...ui.primaryBtn, padding: "0 10px" }}><IconPlus size={13} /></button>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {items.map(t => {
                    const overdue = isOverdue(t);
                    return (
                      <div key={t.id}
                        draggable
                        onDragStart={(e) => { setDragId(t.id); e.dataTransfer.effectAllowed = "move"; }}
                        onDragEnd={() => { setDragId(null); setOverStatus(null); }}
                        style={{
                          background: "#fff", border: `1px solid ${overdue ? "#EF9A9A" : BRAND.border}`, borderLeft: overdue ? "3px solid #C62828" : `1px solid ${BRAND.border}`,
                          padding: "12px 14px", cursor: "grab", opacity: dragId === t.id ? 0.4 : 1,
                          display: "flex", gap: "8px", boxShadow: "0 1px 2px rgba(26,24,20,.04)",
                        }}>
                        <IconDrag size={13} style={{ color: BRAND.border, marginTop: "2px", flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "13px", fontWeight: "500", color: BRAND.dark }}>{t.title}</p>
                          <p style={{ fontSize: "11px", color: BRAND.textMuted, marginTop: "4px" }}>
                            {TYPES.find(x => x.value === t.type)?.label} {t.properties?.name ? `· ${t.properties.name}` : ""}
                          </p>
                          {t.due_date && <p style={{ fontSize: "11px", color: overdue ? "#C62828" : BRAND.textMuted, fontWeight: overdue ? 500 : 400 }}>{overdue ? "In ritardo dal" : "Scadenza"}: {fmtDate(t.due_date)}</p>}
                          {t.assignee?.full_name && <p style={{ fontSize: "11px", color: BRAND.gold, marginTop: "2px" }}>{t.assignee.full_name}</p>}
                          <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                            {STATUSES.filter(s => s.key !== t.status).map(s => (
                              <button key={s.key} onClick={() => changeStatus(t, s.key)} style={{ ...ui.ghostBtn, padding: "4px 8px", fontSize: "10px" }}>
                                → {s.label}
                              </button>
                            ))}
                            {canManage && (
                              <>
                                <button onClick={() => setEditModal(t)} style={{ ...ui.linkBtn, fontSize: "10px" }}>Modifica</button>
                                <button onClick={() => remove(t)} style={{ ...ui.linkBtn, fontSize: "10px", color: "#C62828" }}>Elimina</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {items.length === 0 && <div style={{ fontSize: "11px", color: BRAND.textMuted, fontStyle: "italic", padding: "8px 4px" }}>Vuoto</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editModal !== null && (
        <TaskModal task={editModal === "new" ? null : editModal} properties={properties} team={team} onClose={() => setEditModal(null)} onSaved={handleSaved} />
      )}
    </div>
  );
}

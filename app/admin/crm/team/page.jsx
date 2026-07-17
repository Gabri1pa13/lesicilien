"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { apiFetch, Badge, BRAND, Field, Modal, roleLabel, ui } from "../_lib";

const ROLES = ["admin", "manager", "sales", "accountant", "cleaning"];

function InviteModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ full_name: "", email: "", role: "sales" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const invite = async () => {
    if (!form.full_name.trim() || !form.email.trim()) { setError("Nome ed email sono obbligatori"); return; }
    setLoading(true); setError("");
    try {
      const json = await apiFetch("/api/crm/team", { method: "POST", body: form });
      setCreated(json.data);
      onCreated(json.data);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  if (created) {
    return (
      <Modal tag="MEMBRO CREATO" title={created.full_name} onClose={onClose} footer={<button style={ui.primaryBtn} onClick={onClose}>Chiudi</button>}>
        <p style={{ fontSize: "13px", color: BRAND.dark }}>Account creato con successo. Comunica queste credenziali al collaboratore (verranno mostrate una sola volta):</p>
        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, padding: "14px 16px", fontFamily: "monospace", fontSize: "13px" }}>
          <div>Email: {created.email}</div>
          <div>Password provvisoria: {created.temp_password}</div>
        </div>
        <p style={{ fontSize: "12px", color: BRAND.textMuted }}>L'accesso avviene su /admin/login. Consiglia al collaboratore di cambiare la password al primo accesso.</p>
      </Modal>
    );
  }

  return (
    <Modal tag="NUOVO MEMBRO TEAM" title="Invita un collaboratore" onClose={onClose}
      footer={<>
        <button style={ui.ghostBtn} onClick={onClose}>Annulla</button>
        <button style={ui.primaryBtn} onClick={invite} disabled={loading}>{loading ? "Creazione..." : "✓ Crea account"}</button>
      </>}>
      <Field label="Nome e cognome *"><input style={ui.input} value={form.full_name} onChange={e => set("full_name", e.target.value)} /></Field>
      <Field label="Email *"><input style={ui.input} type="email" value={form.email} onChange={e => set("email", e.target.value)} /></Field>
      <Field label="Ruolo *">
        <select style={{ ...ui.input, cursor: "pointer" }} value={form.role} onChange={e => set("role", e.target.value)}>
          {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
        </select>
      </Field>
      {error && <p style={ui.error}>{error}</p>}
    </Modal>
  );
}

export default function TeamPage() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try { const json = await apiFetch("/api/crm/team"); setTeam(json.data || []); }
    catch (e) { console.error(e); }
    setLoading(false);
  };

  const updateRole = async (member, role) => {
    try { const json = await apiFetch("/api/crm/team", { method: "PUT", body: { id: member.id, role } }); setTeam(p => p.map(m => m.id === json.data.id ? json.data : m)); }
    catch (e) { console.error(e); }
  };
  const toggleActive = async (member) => {
    try { const json = await apiFetch("/api/crm/team", { method: "PUT", body: { id: member.id, active: !member.active } }); setTeam(p => p.map(m => m.id === json.data.id ? json.data : m)); }
    catch (e) { console.error(e); }
  };

  return (
    <div style={ui.page}>
      <div style={ui.toolbar}>
        <div>
          <p style={ui.headTag}>SQUADRA</p>
          <h1 style={ui.h1}>Team</h1>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={ui.ghostBtn} onClick={load}>↻ Aggiorna</button>
          <button style={ui.primaryBtn} onClick={() => setInviteModal(true)}>+ Nuovo membro</button>
        </div>
      </div>

      {loading ? (
        <div style={ui.empty}>Caricamento...</div>
      ) : (
        <div style={ui.tableWrap}>
          <table style={ui.table}>
            <thead><tr>{["Nome", "Email", "Ruolo", "Stato", ""].map(h => <th key={h} style={ui.th}>{h}</th>)}</tr></thead>
            <tbody>
              {team.map(m => (
                <tr key={m.id}>
                  <td style={ui.td}>{m.full_name}</td>
                  <td style={ui.td}>{m.email}</td>
                  <td style={ui.td}>
                    <select style={{ ...ui.input, width: "auto", padding: "5px 8px", fontSize: "12px" }} value={m.role} onChange={e => updateRole(m, e.target.value)}>
                      {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                    </select>
                  </td>
                  <td style={ui.td}>
                    <Badge color={m.active ? "#2E7D32" : "#8A8278"} bg={m.active ? "#E8F5E9" : "#F1EEE8"}>{m.active ? "Attivo" : "Disattivato"}</Badge>
                  </td>
                  <td style={ui.td}>
                    <button style={ui.linkBtn} onClick={() => toggleActive(m)}>{m.active ? "Disattiva" : "Riattiva"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inviteModal && <InviteModal onClose={() => setInviteModal(false)} onCreated={(d) => setTeam(p => [...p, d])} />}
    </div>
  );
}

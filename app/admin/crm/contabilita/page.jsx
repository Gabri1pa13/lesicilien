"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { apiFetch, Badge, BRAND, Field, fmtDate, fmtEUR, Modal, ui } from "../_lib";

const STATUS = {
  bozza:   { label: "Bozza",   color: "#8A8278", bg: "#F1EEE8" },
  inviato: { label: "Inviato", color: "#92702A", bg: "#FDF6E3" },
  pagato:  { label: "Pagato",  color: "#2E7D32", bg: "#E8F5E9" },
};
const NEXT_STATUS = { bozza: "inviato", inviato: "pagato" };

function GeneratePayoutModal({ owners, onClose, onGenerated }) {
  const [form, setForm] = useState({ owner_id: owners[0]?.id || "", period_start: "", period_end: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const generate = async () => {
    if (!form.owner_id || !form.period_start || !form.period_end) { setError("Compila tutti i campi"); return; }
    setLoading(true); setError("");
    try {
      const json = await apiFetch("/api/crm/payouts", { method: "POST", body: form });
      onGenerated(json.data);
      onClose();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <Modal tag="NUOVO RENDICONTO" title="Genera rendiconto proprietario" sub="Calcola automaticamente ricavi, commissioni e spese del periodo dalle prenotazioni registrate." onClose={onClose}
      footer={<>
        <button style={ui.ghostBtn} onClick={onClose}>Annulla</button>
        <button style={ui.primaryBtn} onClick={generate} disabled={loading}>{loading ? "Calcolo..." : "✓ Genera"}</button>
      </>}>
      <Field label="Proprietario *">
        <select style={{ ...ui.input, cursor: "pointer" }} value={form.owner_id} onChange={e => set("owner_id", e.target.value)}>
          {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Dal *"><input style={ui.input} type="date" value={form.period_start} onChange={e => set("period_start", e.target.value)} /></Field>
        <Field label="Al *"><input style={ui.input} type="date" value={form.period_end} onChange={e => set("period_end", e.target.value)} /></Field>
      </div>
      {error && <p style={ui.error}>{error}</p>}
    </Modal>
  );
}

export default function ContabilitaPage() {
  const [payouts, setPayouts] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genModal, setGenModal] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const [p, o] = await Promise.all([apiFetch("/api/crm/payouts"), apiFetch("/api/crm/owners/lite")]);
      setPayouts(p.data || []);
      setOwners(o.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const advance = async (payout) => {
    const next = NEXT_STATUS[payout.status];
    if (!next) return;
    try {
      const json = await apiFetch("/api/crm/payouts", { method: "PUT", body: { id: payout.id, status: next } });
      setPayouts(p => p.map(x => x.id === json.data.id ? json.data : x));
    } catch (e) { console.error(e); }
  };

  const remove = async (payout) => {
    try { await apiFetch("/api/crm/payouts", { method: "DELETE", body: { id: payout.id } }); setPayouts(p => p.filter(x => x.id !== payout.id)); }
    catch (e) { console.error(e); }
  };

  const totals = payouts.reduce((acc, p) => ({
    gross: acc.gross + Number(p.gross_revenue), net: acc.net + Number(p.net_payout),
    pending: acc.pending + (p.status !== "pagato" ? Number(p.net_payout) : 0),
  }), { gross: 0, net: 0, pending: 0 });

  return (
    <div style={ui.page}>
      <div style={ui.toolbar}>
        <div>
          <p style={ui.headTag}>CONTABILITÀ</p>
          <h1 style={ui.h1}>Rendiconti proprietari</h1>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={ui.ghostBtn} onClick={load}>↻ Aggiorna</button>
          <button style={ui.primaryBtn} onClick={() => setGenModal(true)} disabled={owners.length === 0}>+ Genera rendiconto</button>
        </div>
      </div>

      <div style={ui.statGrid}>
        <div style={ui.stat}><span style={ui.statNum}>{fmtEUR(totals.gross)}</span><span style={ui.statLabel}>Ricavi lordi</span></div>
        <div style={ui.stat}><span style={ui.statNum}>{fmtEUR(totals.net)}</span><span style={ui.statLabel}>Payout netto totale</span></div>
        <div style={ui.stat}><span style={ui.statNum}>{fmtEUR(totals.pending)}</span><span style={ui.statLabel}>Da pagare</span></div>
      </div>

      {loading ? (
        <div style={ui.empty}>Caricamento...</div>
      ) : payouts.length === 0 ? (
        <div style={ui.empty}>Nessun rendiconto generato.</div>
      ) : (
        <div style={ui.tableWrap}>
          <table style={ui.table}>
            <thead><tr>{["Proprietario", "Periodo", "Ricavi lordi", "Commissione", "Spese", "Payout netto", "Stato", ""].map(h => <th key={h} style={ui.th}>{h}</th>)}</tr></thead>
            <tbody>
              {payouts.map(p => {
                const st = STATUS[p.status];
                return (
                  <tr key={p.id}>
                    <td style={ui.td}>{p.owners?.name || "—"}</td>
                    <td style={ui.td}>{fmtDate(p.period_start)} → {fmtDate(p.period_end)}</td>
                    <td style={ui.td}>{fmtEUR(p.gross_revenue)}</td>
                    <td style={ui.td}>{fmtEUR(p.commission_amount)}</td>
                    <td style={ui.td}>{fmtEUR(p.expenses_amount)}</td>
                    <td style={{ ...ui.td, fontWeight: "500" }}>{fmtEUR(p.net_payout)}</td>
                    <td style={ui.td}><Badge color={st.color} bg={st.bg}>{st.label}</Badge></td>
                    <td style={ui.td}>
                      <div style={ui.actions}>
                        {NEXT_STATUS[p.status] && (
                          <button style={ui.linkBtn} onClick={() => advance(p)}>→ {STATUS[NEXT_STATUS[p.status]].label}</button>
                        )}
                        {p.status === "bozza" && <button style={{ ...ui.linkBtn, color: "#C62828" }} onClick={() => remove(p)}>Elimina</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {genModal && (
        <GeneratePayoutModal owners={owners} onClose={() => setGenModal(false)} onGenerated={(d) => setPayouts(p => [d, ...p])} />
      )}
    </div>
  );
}

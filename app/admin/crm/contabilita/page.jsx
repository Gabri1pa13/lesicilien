"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { apiFetch, Badge, BRAND, Field, fmtDate, fmtEUR, Modal, ui } from "../_lib";
import { DataTable, useToast } from "../_ui";
import { ChartCard, CHART } from "../_charts";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
  const toast = useToast();
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
      toast.success(`Rendiconto segnato come "${STATUS[next].label}"`);
    } catch (e) { toast.error("Errore: " + e.message); }
  };

  const remove = async (payout) => {
    try { await apiFetch("/api/crm/payouts", { method: "DELETE", body: { id: payout.id } }); setPayouts(p => p.filter(x => x.id !== payout.id)); toast.success("Rendiconto eliminato"); }
    catch (e) { toast.error("Errore: " + e.message); }
  };

  const totals = payouts.reduce((acc, p) => ({
    gross: acc.gross + Number(p.gross_revenue), net: acc.net + Number(p.net_payout),
    commission: acc.commission + Number(p.commission_amount || 0), expenses: acc.expenses + Number(p.expenses_amount || 0),
    pending: acc.pending + (p.status !== "pagato" ? Number(p.net_payout) : 0),
  }), { gross: 0, net: 0, commission: 0, expenses: 0, pending: 0 });

  const breakdown = [
    { key: "gross", label: "Ricavi lordi", value: totals.gross, color: CHART.blue },
    { key: "commission", label: "Commissioni", value: totals.commission, color: CHART.orange },
    { key: "expenses", label: "Spese", value: totals.expenses, color: CHART.red },
    { key: "net", label: "Payout netto", value: totals.net, color: CHART.green },
  ];

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

      {payouts.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <ChartCard title="Riepilogo economico" subtitle="Somma di tutti i rendiconti generati">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={breakdown} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 11, fill: CHART.ink, fontFamily: "Jost,sans-serif" }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, padding: "8px 12px", fontFamily: "'Jost',sans-serif", fontSize: "12px" }}>{payload[0].payload.label}: <strong>{fmtEUR(payload[0].value)}</strong></div>;
                }} cursor={{ fill: BRAND.cream }} />
                <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={18} label={{ position: "right", fontSize: 11, fill: CHART.ink, fontFamily: "Jost,sans-serif", formatter: (v) => fmtEUR(v) }}>
                  {breakdown.map(d => <Cell key={d.key} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {loading ? (
        <div style={ui.empty}>Caricamento...</div>
      ) : (
        <DataTable
          getRowId={(p) => p.id}
          data={payouts}
          emptyMessage="Nessun rendiconto generato."
          columns={[
            { key: "owner", label: "Proprietario", sortable: true, sortValue: (p) => p.owners?.name || "", render: (p) => p.owners?.name || "—" },
            { key: "period", label: "Periodo", sortable: true, sortValue: (p) => p.period_start, render: (p) => `${fmtDate(p.period_start)} → ${fmtDate(p.period_end)}` },
            { key: "gross_revenue", label: "Ricavi lordi", sortable: true, sortValue: (p) => Number(p.gross_revenue || 0), render: (p) => fmtEUR(p.gross_revenue) },
            { key: "commission_amount", label: "Commissione", render: (p) => fmtEUR(p.commission_amount) },
            { key: "expenses_amount", label: "Spese", render: (p) => fmtEUR(p.expenses_amount) },
            { key: "net_payout", label: "Payout netto", sortable: true, sortValue: (p) => Number(p.net_payout || 0), render: (p) => <strong>{fmtEUR(p.net_payout)}</strong> },
            { key: "status", label: "Stato", sortable: true, render: (p) => { const st = STATUS[p.status]; return <Badge color={st.color} bg={st.bg}>{st.label}</Badge>; } },
            { key: "actions", label: "", stopRowClick: true, render: (p) => (
              <div style={ui.actions}>
                {NEXT_STATUS[p.status] && <button style={ui.linkBtn} onClick={() => advance(p)}>→ {STATUS[NEXT_STATUS[p.status]].label}</button>}
                {p.status === "bozza" && <button style={{ ...ui.linkBtn, color: "#C62828" }} onClick={() => remove(p)}>Elimina</button>}
              </div>
            ) },
          ]}
        />
      )}

      {genModal && (
        <GeneratePayoutModal owners={owners} onClose={() => setGenModal(false)} onGenerated={(d) => setPayouts(p => [d, ...p])} />
      )}
    </div>
  );
}

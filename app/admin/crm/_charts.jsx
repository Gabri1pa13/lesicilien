"use client";

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { BRAND, fmtEUR } from "./_lib";

// Palette validata (dataviz skill) — vedi references/palette.md
export const CHART = {
  blue: "#2a78d6", green: "#008300", magenta: "#e87ba4", yellow: "#eda100",
  aqua: "#1baf7a", orange: "#eb6834", violet: "#4a3aa7", red: "#e34948",
  grid: BRAND.border, axis: BRAND.textMuted, ink: BRAND.dark,
};

const STAGE_RAMP = {
  lead: "#86b6ef", contattato: "#5598e7", in_trattativa: "#2a78d6",
  contratto_inviato: "#1c5cab", attivo: "#104281",
  in_pausa: "#C9C2B4", perso: "#8A8278",
};
const STAGE_LABEL = {
  lead: "Lead", contattato: "Contattato", in_trattativa: "In trattativa",
  contratto_inviato: "Contratto inviato", attivo: "Attivo", in_pausa: "In pausa", perso: "Perso",
};
const CHANNEL_COLOR = { diretta: CHART.blue, airbnb: CHART.orange, booking: CHART.green, vrbo: CHART.violet, altro: CHART.red };
const CHANNEL_LABEL = { diretta: "Diretta", airbnb: "Airbnb", booking: "Booking.com", vrbo: "Vrbo", altro: "Altro" };

const tooltipBox = { background: "#fff", border: `1px solid ${BRAND.border}`, padding: "8px 12px", fontFamily: "'Jost',sans-serif", fontSize: "12px", color: BRAND.dark, boxShadow: "0 6px 20px rgba(26,24,20,.12)" };

function EuroTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipBox}>
      <p style={{ color: BRAND.textMuted, marginBottom: "3px" }}>{label}</p>
      <p style={{ fontWeight: 500 }}>{fmtEUR(payload[0].value)}</p>
    </div>
  );
}

export function ChartCard({ title, subtitle, children, empty }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, padding: "20px 22px", flex: "1 1 380px", minWidth: "320px" }}>
      <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "12px", letterSpacing: ".06em", color: BRAND.dark, fontWeight: 500, marginBottom: subtitle ? "2px" : "14px" }}>{title}</p>
      {subtitle && <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "11px", color: BRAND.textMuted, marginBottom: "14px" }}>{subtitle}</p>}
      {empty ? (
        <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center", color: BRAND.textMuted, fontFamily: "'Jost',sans-serif", fontSize: "12px" }}>
          Non ci sono ancora dati sufficienti.
        </div>
      ) : children}
    </div>
  );
}

export function RevenueTrendChart({ data }) {
  const hasData = data?.some(d => d.revenue > 0);
  return (
    <ChartCard title="Andamento ricavi" subtitle="Ultimi 6 mesi, per data di check-in" empty={!hasData}>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="crmRevFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.blue} stopOpacity={0.18} />
              <stop offset="100%" stopColor={CHART.blue} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: CHART.axis, fontFamily: "Jost,sans-serif" }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: CHART.axis, fontFamily: "Jost,sans-serif" }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
          <Tooltip content={<EuroTooltip />} cursor={{ stroke: CHART.grid }} />
          <Area type="monotone" dataKey="revenue" stroke={CHART.blue} strokeWidth={2} fill="url(#crmRevFill)" dot={{ r: 3, fill: CHART.blue, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PipelineFunnelChart({ data }) {
  const hasData = data?.some(d => d.count > 0);
  const chartData = (data || []).map(d => ({ ...d, label: STAGE_LABEL[d.stage] || d.stage }));
  return (
    <ChartCard title="Pipeline proprietari" subtitle="Numero di contatti per fase" empty={!hasData}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke={CHART.grid} />
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11, fill: CHART.ink, fontFamily: "Jost,sans-serif" }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: BRAND.cream }} content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return <div style={tooltipBox}>{payload[0].payload.label}: <strong>{payload[0].value}</strong></div>;
          }} />
          <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={16} label={{ position: "right", fontSize: 11, fill: CHART.ink, fontFamily: "Jost,sans-serif" }}>
            {chartData.map(d => <Cell key={d.stage} fill={STAGE_RAMP[d.stage] || CHART.axis} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ChannelMixChart({ data }) {
  const hasData = data && data.length > 0;
  const total = (data || []).reduce((s, d) => s + d.count, 0);
  return (
    <ChartCard title="Prenotazioni per canale" subtitle="Ultimi 6 mesi" empty={!hasData}>
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="channel" innerRadius={48} outerRadius={78} paddingAngle={2} stroke={"#fff"} strokeWidth={2}>
              {(data || []).map(d => <Cell key={d.channel} fill={CHANNEL_COLOR[d.channel] || CHART.axis} />)}
            </Pie>
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return <div style={tooltipBox}>{CHANNEL_LABEL[d.channel] || d.channel}: <strong>{d.count}</strong> ({Math.round((d.count / total) * 100)}%)</div>;
            }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px", marginTop: "6px" }}>
        {(data || []).map(d => (
          <div key={d.channel} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: CHANNEL_COLOR[d.channel] || CHART.axis, display: "inline-block" }} />
            <span style={{ fontFamily: "'Jost',sans-serif", fontSize: "11.5px", color: BRAND.textMuted }}>{CHANNEL_LABEL[d.channel] || d.channel} · {d.count}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

export function SourcePerformanceChart({ data }) {
  const hasData = data && data.length > 0 && data.some(d => d.total > 0);
  return (
    <ChartCard title="Conversione per fonte" subtitle="% di lead diventati proprietari attivi, per provenienza" empty={!hasData}>
      <ResponsiveContainer width="100%" height={Math.max(120, (data?.length || 0) * 38)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 50, left: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke={CHART.grid} />
          <XAxis type="number" hide domain={[0, 100]} />
          <YAxis type="category" dataKey="source" width={110} tick={{ fontSize: 11, fill: CHART.ink, fontFamily: "Jost,sans-serif" }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: BRAND.cream }} content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload;
            return <div style={tooltipBox}>{d.source}: <strong>{d.rate}%</strong> ({d.active}/{d.total})</div>;
          }} />
          <Bar dataKey="rate" fill={CHART.blue} radius={[0, 3, 3, 0]} barSize={14} label={{ position: "right", fontSize: 11, fill: CHART.ink, fontFamily: "Jost,sans-serif", formatter: (v) => `${v}%` }} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TopPropertiesChart({ data }) {
  const hasData = data && data.length > 0;
  return (
    <ChartCard title="Top immobili per ricavi" subtitle="Ultimi 6 mesi" empty={!hasData}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 44, left: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke={CHART.grid} />
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: CHART.ink, fontFamily: "Jost,sans-serif" }} axisLine={false} tickLine={false} />
          <Tooltip content={<EuroTooltip />} cursor={{ fill: BRAND.cream }} />
          <Bar dataKey="revenue" fill={CHART.blue} radius={[0, 3, 3, 0]} barSize={16} label={{ position: "right", fontSize: 11, fill: CHART.ink, fontFamily: "Jost,sans-serif", formatter: (v) => fmtEUR(v) }} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

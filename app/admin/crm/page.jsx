"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { apiFetch, BRAND, fmtDate, fmtEUR, ui, useCrm } from "./_lib";
import { ChannelMixChart, PipelineFunnelChart, RevenueTrendChart, SourcePerformanceChart, TopPropertiesChart } from "./_charts";
import { IconAccounting, IconArrowRight, IconBookings, IconOwners, IconProperties, IconTasks } from "./_icons";
import { DataTable } from "./_ui";

function StatTile({ icon: Icon, value, label, accent }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px", flex: "1 1 200px" }}>
      <div style={{ width: "42px", height: "42px", background: accent ? "rgba(191,160,90,.12)" : BRAND.cream, color: BRAND.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={19} />
      </div>
      <div>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "26px", color: BRAND.dark, lineHeight: 1 }}>{value}</p>
        <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "11px", color: BRAND.textMuted, textTransform: "uppercase", letterSpacing: ".07em", marginTop: "4px" }}>{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { profile, allowed } = useCrm();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!allowed.includes("dashboard")) {
      window.location.href = allowed.includes("tasks") ? "/admin/crm/task" : "/admin/login";
      return;
    }
    (async () => {
      try { const json = await apiFetch("/api/crm/dashboard"); setData(json.data); }
      catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  if (!allowed.includes("dashboard")) return null;

  const target = 100;
  const propTotal = data?.properties?.total ?? 0;
  const pct = Math.min(100, Math.round((propTotal / target) * 100));

  return (
    <div style={ui.page}>
      <div style={ui.toolbar}>
        <div>
          <p style={ui.headTag}>PANORAMICA</p>
          <h1 style={ui.h1}>Ciao, {profile?.full_name?.split(" ")[0] || "team"}</h1>
        </div>
      </div>

      {loading || !data ? (
        <div style={ui.empty}>Caricamento...</div>
      ) : (
        <>
          {data.properties && (
            <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, padding: "20px 24px", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
                <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "12px", color: BRAND.textMuted, letterSpacing: ".04em" }}>Obiettivo: 100 immobili in portfolio</p>
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "20px", color: BRAND.dark }}>{propTotal} <span style={{ fontSize: "13px", color: BRAND.textMuted, fontFamily: "'Jost',sans-serif" }}>/ {target}</span></p>
              </div>
              <div style={{ height: "8px", background: BRAND.cream, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: `linear-gradient(90deg, ${BRAND.gold}, #D9BE7A)`, transition: "width .6s ease" }} />
              </div>
            </div>
          )}

          <div style={{ ...ui.statGrid, display: "flex", flexWrap: "wrap" }}>
            {data.properties && <StatTile icon={IconProperties} value={data.properties.active} label="Immobili attivi" accent />}
            {data.owners && <StatTile icon={IconOwners} value={data.owners.inPipeline} label="Lead in pipeline" />}
            {data.owners && <StatTile icon={IconOwners} value={fmtEUR(data.owners.pipelineValue)} label="Valore stimato pipeline" accent />}
            {data.owners && data.owners.conversionRate != null && <StatTile icon={IconOwners} value={`${data.owners.conversionRate}%`} label="Tasso di conversione" />}
            {data.owners && data.owners.avgDaysToClose != null && <StatTile icon={IconOwners} value={`${data.owners.avgDaysToClose}g`} label="Giorni medi alla chiusura" />}
            {data.bookings && <StatTile icon={IconBookings} value={fmtEUR(data.bookings.revenueThisMonth)} label="Ricavi questo mese" accent />}
            {data.tasks && <StatTile icon={IconTasks} value={data.tasks.open} label="Task aperti" />}
            {data.payouts && <StatTile icon={IconAccounting} value={fmtEUR(data.payouts.pendingAmount)} label="Payout da versare" />}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", margin: "24px 0" }}>
            {data.bookings && <RevenueTrendChart data={data.bookings.revenueTrend} />}
            {data.owners && <PipelineFunnelChart data={data.owners.byStage} />}
            {data.owners && <SourcePerformanceChart data={data.owners.bySource} />}
            {data.bookings && <ChannelMixChart data={data.bookings.channelMix} />}
            {data.bookings && <TopPropertiesChart data={data.bookings.topProperties} />}
          </div>

          {data.bookings?.upcomingCheckins?.length > 0 && (
            <div>
              <p style={{ ...ui.label, marginBottom: "10px" }}>Check-in nei prossimi 7 giorni</p>
              <DataTable
                getRowId={(b) => b.id}
                data={data.bookings.upcomingCheckins}
                emptyMessage="Nessun check-in imminente."
                columns={[
                  { key: "check_in", label: "Data", render: (b) => fmtDate(b.check_in) },
                  { key: "property", label: "Immobile", render: (b) => b.properties?.name || "—" },
                  { key: "guest", label: "Ospite", render: (b) => b.guest_name || "—" },
                  { key: "go", label: "", render: () => <IconArrowRight size={14} style={{ color: BRAND.textMuted }} /> },
                ]}
                onRowClick={() => { window.location.href = "/admin/crm/prenotazioni"; }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

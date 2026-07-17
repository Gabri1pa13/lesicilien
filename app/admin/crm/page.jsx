"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { apiFetch, BRAND, fmtDate, fmtEUR, ui, useCrm } from "./_lib";

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
          <div style={ui.statGrid}>
            {data.properties && (<>
              <div style={ui.stat}><span style={ui.statNum}>{data.properties.total}</span><span style={ui.statLabel}>Immobili totali</span></div>
              <div style={ui.stat}><span style={ui.statNum}>{data.properties.active}</span><span style={ui.statLabel}>Immobili attivi</span></div>
              <div style={ui.stat}><span style={ui.statNum}>{data.properties.onboarding}</span><span style={ui.statLabel}>In onboarding</span></div>
            </>)}
            {data.owners && (<>
              <div style={ui.stat}><span style={ui.statNum}>{data.owners.inPipeline}</span><span style={ui.statLabel}>Lead in pipeline</span></div>
            </>)}
            {data.bookings && (<>
              <div style={ui.stat}><span style={ui.statNum}>{data.bookings.countThisMonth}</span><span style={ui.statLabel}>Prenotazioni · mese</span></div>
              <div style={ui.stat}><span style={ui.statNum}>{fmtEUR(data.bookings.revenueThisMonth)}</span><span style={ui.statLabel}>Ricavi · mese</span></div>
            </>)}
            {data.tasks && (
              <div style={ui.stat}><span style={ui.statNum}>{data.tasks.open}</span><span style={ui.statLabel}>Task aperti</span></div>
            )}
            {data.payouts && (
              <div style={ui.stat}><span style={ui.statNum}>{fmtEUR(data.payouts.pendingAmount)}</span><span style={ui.statLabel}>Payout da versare</span></div>
            )}
          </div>

          {data.properties && data.properties.total < 100 && (
            <p style={{ fontSize: "13px", fontFamily: "'Jost',sans-serif", color: BRAND.textMuted, fontWeight: 300, marginBottom: "24px" }}>
              {data.properties.total} / 100 immobili nel portfolio — mancano {100 - data.properties.total} per l'obiettivo.
            </p>
          )}

          {data.bookings?.upcomingCheckins?.length > 0 && (
            <div>
              <p style={{ ...ui.label, marginBottom: "10px" }}>Check-in nei prossimi 7 giorni</p>
              <div style={ui.tableWrap}>
                <table style={ui.table}>
                  <thead><tr>{["Data", "Immobile", "Ospite"].map(h => <th key={h} style={ui.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {data.bookings.upcomingCheckins.map(b => (
                      <tr key={b.id}>
                        <td style={ui.td}>{fmtDate(b.check_in)}</td>
                        <td style={ui.td}>{b.properties?.name || "—"}</td>
                        <td style={ui.td}>{b.guest_name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

"use client";

export const dynamic = "force-dynamic";

import { usePathname } from "next/navigation";
import { BRAND, CrmAuthGuard, getSupabase, roleLabel, useCrm } from "./_lib";

const NAV = [
  { resource: "dashboard", href: "/admin/crm",             label: "Dashboard" },
  { resource: "owners",    href: "/admin/crm/proprietari",  label: "Proprietari" },
  { resource: "properties",href: "/admin/crm/immobili",     label: "Immobili" },
  { resource: "bookings",  href: "/admin/crm/prenotazioni", label: "Prenotazioni" },
  { resource: "guests",    href: "/admin/crm/ospiti",       label: "Ospiti" },
  { resource: "tasks",     href: "/admin/crm/task",         label: "Task" },
  { resource: "payouts",   href: "/admin/crm/contabilita",  label: "Contabilità" },
  { resource: "team",      href: "/admin/crm/team",         label: "Team" },
];

function Shell({ children }) {
  const { profile, allowed } = useCrm();
  const pathname = usePathname();
  const items = NAV.filter(n => allowed.includes(n.resource));

  const logout = async () => {
    await getSupabase().auth.signOut();
    window.location.href = "/admin/login";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Jost:wght@300;400;500&display=swap');
        *{box-sizing:border-box}
        body{margin:0}
        input:focus,textarea:focus,select:focus{outline:none;border-color:${BRAND.gold}!important}
        tbody tr:hover td{background:#FDFCF8} td{transition:background .15s}
        .crm-nav a{text-decoration:none}
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: BRAND.cream }}>
        <aside style={{ width: "220px", flexShrink: 0, background: BRAND.dark, padding: "28px 0", position: "sticky", top: 0, height: "100vh", overflow: "auto" }}>
          <div style={{ padding: "0 24px 24px", borderBottom: "1px solid #2E2A22" }}>
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "9px", letterSpacing: ".28em", color: BRAND.gold, textTransform: "uppercase", marginBottom: "6px" }}>LE SICILIEN</p>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "20px", color: "#fff", margin: 0 }}>CRM</p>
          </div>
          <nav className="crm-nav" style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: "2px" }}>
            {items.map(item => {
              const active = pathname === item.href;
              return (
                <a key={item.href} href={item.href} style={{
                  display: "block", padding: "10px 12px", fontFamily: "'Jost',sans-serif",
                  fontSize: "13px", letterSpacing: ".03em",
                  color: active ? BRAND.gold : "#C9C2B4",
                  background: active ? "rgba(191,160,90,.12)" : "transparent",
                  borderLeft: active ? `2px solid ${BRAND.gold}` : "2px solid transparent",
                }}>
                  {item.label}
                </a>
              );
            })}
          </nav>
          <div style={{ marginTop: "auto", padding: "16px 24px", borderTop: "1px solid #2E2A22", position: "absolute", bottom: 0, width: "100%" }}>
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "12px", color: "#fff", marginBottom: "2px" }}>{profile?.full_name || profile?.email}</p>
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "10px", color: BRAND.gold, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "12px" }}>{roleLabel(profile?.role)}</p>
            <button onClick={logout} style={{ background: "transparent", color: "#C9C2B4", border: "1px solid #3A362C", padding: "7px 14px", fontSize: "10px", letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Jost',sans-serif", width: "100%" }}>
              Esci
            </button>
          </div>
        </aside>
        <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
      </div>
    </>
  );
}

export default function CrmLayout({ children }) {
  return (
    <CrmAuthGuard>
      <Shell>{children}</Shell>
    </CrmAuthGuard>
  );
}

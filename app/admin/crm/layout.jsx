"use client";

export const dynamic = "force-dynamic";

import { usePathname } from "next/navigation";
import { BRAND, CrmAuthGuard, getSupabase, roleLabel, useCrm } from "./_lib";
import { CommandPalette, NotificationBell, SearchTrigger, ToastProvider } from "./_ui";
import {
  IconAccounting, IconBookings, IconDashboard, IconGuests, IconLogout,
  IconOwners, IconProperties, IconTasks, IconTeam,
} from "./_icons";

const NAV = [
  { resource: "dashboard", href: "/admin/crm",             label: "Dashboard",   icon: IconDashboard },
  { resource: "owners",    href: "/admin/crm/proprietari",  label: "Proprietari", icon: IconOwners },
  { resource: "properties",href: "/admin/crm/immobili",     label: "Immobili",    icon: IconProperties },
  { resource: "bookings",  href: "/admin/crm/prenotazioni", label: "Prenotazioni",icon: IconBookings },
  { resource: "guests",    href: "/admin/crm/ospiti",       label: "Ospiti",      icon: IconGuests },
  { resource: "tasks",     href: "/admin/crm/task",         label: "Task",        icon: IconTasks },
  { resource: "payouts",   href: "/admin/crm/contabilita",  label: "Contabilità", icon: IconAccounting },
  { resource: "team",      href: "/admin/crm/team",         label: "Team",        icon: IconTeam },
];

function initials(name) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

function Shell({ children }) {
  const { profile, allowed } = useCrm();
  const pathname = usePathname();
  const items = NAV.filter(n => allowed.includes(n.resource));
  const current = NAV.find(n => n.href === pathname);

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
        .crm-navlink{transition:background .15s, color .15s}
        ::-webkit-scrollbar{width:10px;height:10px}
        ::-webkit-scrollbar-thumb{background:#D9CDA9;border:2px solid ${BRAND.cream}}
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: BRAND.cream }}>
        <aside style={{ width: "230px", flexShrink: 0, background: BRAND.dark, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", boxShadow: "2px 0 12px rgba(0,0,0,.15)" }}>
          <div style={{ padding: "26px 24px 22px", borderBottom: "1px solid #2E2A22" }}>
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "9px", letterSpacing: ".28em", color: BRAND.gold, textTransform: "uppercase", marginBottom: "6px" }}>LE SICILIEN</p>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "22px", color: "#fff", margin: 0 }}>CRM</p>
          </div>
          <nav className="crm-nav" style={{ padding: "14px 12px", display: "flex", flexDirection: "column", gap: "2px", flex: 1, overflow: "auto" }}>
            {items.map(item => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <a key={item.href} href={item.href} className="crm-navlink" style={{
                  display: "flex", alignItems: "center", gap: "11px", padding: "10px 12px", fontFamily: "'Jost',sans-serif",
                  fontSize: "13px", letterSpacing: ".02em",
                  color: active ? BRAND.gold : "#C9C2B4",
                  background: active ? "rgba(191,160,90,.14)" : "transparent",
                  borderLeft: active ? `2px solid ${BRAND.gold}` : "2px solid transparent",
                }}>
                  <Icon size={16} />
                  {item.label}
                </a>
              );
            })}
          </nav>
          <div style={{ padding: "16px 20px", borderTop: "1px solid #2E2A22", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(191,160,90,.18)", color: BRAND.gold, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Jost',sans-serif", fontSize: "12px", fontWeight: 500, flexShrink: 0 }}>
              {initials(profile?.full_name || profile?.email)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "12px", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.full_name || profile?.email}</p>
              <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "10px", color: BRAND.gold, textTransform: "uppercase", letterSpacing: ".08em" }}>{roleLabel(profile?.role)}</p>
            </div>
            <button onClick={logout} title="Esci" style={{ background: "transparent", color: "#C9C2B4", border: "1px solid #3A362C", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <IconLogout size={14} />
            </button>
          </div>
        </aside>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 32px", borderBottom: `1px solid ${BRAND.border}`, background: "#fff", position: "sticky", top: 0, zIndex: 100 }}>
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "13px", color: BRAND.textMuted }}>{current?.label || ""}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <SearchTrigger />
              <NotificationBell />
            </div>
          </header>
          <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
        </div>
      </div>
      <CommandPalette />
    </>
  );
}

export default function CrmLayout({ children }) {
  return (
    <CrmAuthGuard>
      <ToastProvider>
        <Shell>{children}</Shell>
      </ToastProvider>
    </CrmAuthGuard>
  );
}

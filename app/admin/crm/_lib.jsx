"use client";

import { createClient } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";

export const BRAND = {
  gold: "#BFA05A", cream: "#FAF8F3",
  dark: "#1A1814", border: "#E0D9CC", textMuted: "#8A8278",
};

let _sb;
export function getSupabase() {
  if (!_sb) {
    _sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );
  }
  return _sb;
}

// Fetch autenticato verso le API del CRM: allega il token della sessione corrente.
export async function apiFetch(path, options = {}) {
  const { data: { session } } = await getSupabase().auth.getSession();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  const res = await fetch(path, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ok === false) throw new Error(json.error || `Errore ${res.status}`);
  return json;
}

const CrmContext = createContext(null);
export function useCrm() {
  return useContext(CrmContext);
}

const ROLE_LABELS = {
  admin: "Admin", manager: "Manager", sales: "Vendite",
  accountant: "Contabilità", cleaning: "Pulizie",
};
export function roleLabel(role) { return ROLE_LABELS[role] || role; }

export function CrmAuthGuard({ children }) {
  const [state, setState] = useState({ loading: true, profile: null, allowed: [] });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await getSupabase().auth.getSession();
      if (!session) { window.location.href = "/admin/login"; return; }
      try {
        const json = await apiFetch("/api/crm/me");
        if (!mounted) return;
        setState({ loading: false, profile: json.profile, allowed: json.allowed || [] });
      } catch (e) {
        window.location.href = "/admin/login";
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (state.loading) {
    return (
      <div style={{ minHeight: "100vh", background: BRAND.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Jost',sans-serif", color: BRAND.textMuted }}>
        Caricamento...
      </div>
    );
  }

  return <CrmContext.Provider value={state}>{children}</CrmContext.Provider>;
}

// ─── Stili condivisi tra le pagine del CRM ───────────────────────────────────
export const ui = {
  page:       { fontFamily: "'Jost',sans-serif", padding: "32px", background: BRAND.cream, minHeight: "100vh" },
  headTag:    { fontSize: "10px", letterSpacing: ".25em", color: BRAND.gold, textTransform: "uppercase", marginBottom: "6px" },
  h1:         { fontFamily: "'Cormorant Garamond',serif", fontSize: "30px", fontWeight: "400", color: BRAND.dark, margin: 0 },
  toolbar:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
  primaryBtn: { background: BRAND.dark, color: BRAND.gold, border: "none", padding: "10px 20px", cursor: "pointer", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "'Jost',sans-serif" },
  ghostBtn:   { background: "transparent", color: BRAND.textMuted, border: `1px solid ${BRAND.border}`, padding: "9px 18px", cursor: "pointer", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "'Jost',sans-serif" },
  input:      { width: "100%", background: "#fff", border: `1px solid ${BRAND.border}`, padding: "10px 13px", fontSize: "14px", fontFamily: "'Jost',sans-serif", color: BRAND.dark },
  label:      { display: "block", fontSize: "9px", letterSpacing: ".18em", color: BRAND.textMuted, textTransform: "uppercase", marginBottom: "7px" },
  empty:      { textAlign: "center", padding: "70px", color: BRAND.textMuted, fontFamily: "'Cormorant Garamond',serif", fontSize: "20px" },
  tableWrap:  { background: "#fff", border: `1px solid ${BRAND.border}`, overflow: "auto" },
  table:      { width: "100%", borderCollapse: "collapse", minWidth: "760px" },
  th:         { padding: "13px 15px", textAlign: "left", fontSize: "9px", textTransform: "uppercase", letterSpacing: ".15em", color: BRAND.textMuted, borderBottom: `1px solid ${BRAND.border}`, background: BRAND.cream, fontFamily: "'Jost',sans-serif", fontWeight: "500" },
  td:         { padding: "14px 15px", fontSize: "13px", verticalAlign: "top", borderBottom: `1px solid ${BRAND.border}` },
  badge:      { display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: "500", whiteSpace: "nowrap" },
  dot:        { width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, display: "inline-block" },
  statGrid:   { display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" },
  stat:       { background: "#fff", border: `1px solid ${BRAND.border}`, padding: "16px 24px", display: "flex", flexDirection: "column", gap: "4px", minWidth: "130px", flex: "1 1 130px" },
  statNum:    { fontFamily: "'Cormorant Garamond',serif", fontSize: "26px", fontWeight: "500", color: BRAND.dark },
  statLabel:  { fontSize: "10px", color: BRAND.textMuted, textTransform: "uppercase", letterSpacing: ".1em" },
  actions:    { display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" },
  linkBtn:    { background: "transparent", border: "none", color: BRAND.gold, cursor: "pointer", fontSize: "12px", fontFamily: "'Jost',sans-serif", padding: 0, textDecoration: "underline" },

  overlay:  { position: "fixed", inset: 0, background: "rgba(26,24,20,.85)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", backdropFilter: "blur(8px)" },
  modal:    { background: BRAND.cream, width: "100%", maxWidth: "560px", maxHeight: "88vh", overflow: "auto", border: `1px solid ${BRAND.border}`, fontFamily: "'Jost',sans-serif" },
  mHeader:  { padding: "28px 32px 20px" },
  mTag:     { fontSize: "9px", letterSpacing: ".28em", color: BRAND.gold, textTransform: "uppercase", marginBottom: "10px" },
  mTitle:   { fontFamily: "'Cormorant Garamond',serif", fontSize: "22px", fontWeight: "400", color: BRAND.dark },
  mDivider: { height: "1px", background: BRAND.border },
  mBody:    { padding: "22px 32px", display: "grid", gap: "16px" },
  mFooter:  { display: "flex", gap: "10px", justifyContent: "flex-end", padding: "18px 32px 26px", borderTop: `1px solid ${BRAND.border}` },
  error:    { fontSize: "12px", color: "#C62828", fontWeight: "500" },
};

export function Modal({ tag, title, sub, onClose, footer, children, maxWidth }) {
  return (
    <div style={ui.overlay} onClick={onClose}>
      <div style={{ ...ui.modal, ...(maxWidth ? { maxWidth } : {}) }} onClick={e => e.stopPropagation()}>
        <div style={ui.mHeader}>
          {tag && <p style={ui.mTag}>{tag}</p>}
          {title && <h3 style={ui.mTitle}>{title}</h3>}
          {sub && <p style={{ fontSize: "13px", fontWeight: "300", color: BRAND.textMuted, marginTop: "8px", lineHeight: "1.6" }}>{sub}</p>}
        </div>
        <div style={ui.mDivider} />
        <div style={ui.mBody}>{children}</div>
        {footer && <div style={ui.mFooter}>{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div>
      <label style={ui.label}>{label}</label>
      {children}
    </div>
  );
}

export function Badge({ color, bg, dot, children }) {
  return (
    <span style={{ ...ui.badge, color, background: bg }}>
      <span style={{ ...ui.dot, background: dot || color }} />{children}
    </span>
  );
}

export function StatCard({ value, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ ...ui.stat, cursor: onClick ? "pointer" : "default", ...(active ? { background: BRAND.dark, borderColor: BRAND.dark } : {}) }}
    >
      <span style={{ ...ui.statNum, color: active ? BRAND.gold : BRAND.dark }}>{value}</span>
      <span style={{ ...ui.statLabel, color: active ? "#D9CDA9" : BRAND.textMuted }}>{label}</span>
    </div>
  );
}

export function fmtEUR(n) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

export function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("it-IT");
}

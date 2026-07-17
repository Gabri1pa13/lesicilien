"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, BRAND, fmtDate } from "./_lib";
import {
  IconArrowRight, IconBell, IconCheck, IconChevronDown, IconClock, IconSearch, IconX,
} from "./_icons";

// ─── TOAST ────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);
export function useToast() {
  return useContext(ToastContext);
}

const TOAST_STYLES = {
  success: { border: "#4CAF50", icon: "#2E7D32" },
  error:   { border: "#EF5350", icon: "#C62828" },
  info:    { border: BRAND.gold, icon: BRAND.gold },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const push = (type, message) => {
    const id = ++idRef.current;
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  const api = useMemo(() => ({
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  }), []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 500, display: "flex", flexDirection: "column", gap: "10px", maxWidth: "340px" }}>
        {toasts.map(t => {
          const st = TOAST_STYLES[t.type] || TOAST_STYLES.info;
          return (
            <div key={t.id} style={{
              background: "#fff", borderLeft: `3px solid ${st.border}`, boxShadow: "0 8px 24px rgba(26,24,20,.16)",
              padding: "13px 16px", fontFamily: "'Jost',sans-serif", fontSize: "13px", color: BRAND.dark,
              display: "flex", alignItems: "center", gap: "10px", animation: "crmToastIn .18s ease-out",
            }}>
              {t.type === "success" && <IconCheck size={16} style={{ color: st.icon }} />}
              <span style={{ lineHeight: 1.4 }}>{t.message}</span>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes crmToastIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </ToastContext.Provider>
  );
}

// ─── DATA TABLE (sort + selezione multipla + azioni bulk) ─────────────────
export function DataTable({ columns, data, getRowId, onRowClick, selectable, bulkActions, emptyMessage, defaultSort }) {
  const [sort, setSort] = useState(defaultSort || null); // { key, dir }
  const [selected, setSelected] = useState(() => new Set());

  useEffect(() => { setSelected(new Set()); }, [data]);

  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns.find(c => c.key === sort.key);
    const getVal = col?.sortValue || ((row) => row[sort.key]);
    return [...data].sort((a, b) => {
      const va = getVal(a), vb = getVal(b);
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return sort.dir === "asc" ? va - vb : vb - va;
      return sort.dir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }, [data, sort, columns]);

  const toggleSort = (key) => {
    setSort(p => p?.key === key ? (p.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" });
  };

  const allSelected = selectable && data.length > 0 && selected.size === data.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(data.map(getRowId)));
  const toggleOne = (id) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const th = { padding: "13px 15px", textAlign: "left", fontSize: "9px", textTransform: "uppercase", letterSpacing: ".15em", color: BRAND.textMuted, borderBottom: `1px solid ${BRAND.border}`, background: BRAND.cream, fontFamily: "'Jost',sans-serif", fontWeight: "500", whiteSpace: "nowrap" };
  const td = { padding: "14px 15px", fontSize: "13px", verticalAlign: "top", borderBottom: `1px solid ${BRAND.border}` };

  if (data.length === 0) {
    return <div style={{ textAlign: "center", padding: "70px", color: BRAND.textMuted, fontFamily: "'Cormorant Garamond',serif", fontSize: "20px" }}>{emptyMessage || "Nessun elemento."}</div>;
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
          <thead>
            <tr>
              {selectable && (
                <th style={{ ...th, width: "36px" }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ cursor: "pointer" }} />
                </th>
              )}
              {columns.map(col => (
                <th key={col.key} style={{ ...th, cursor: col.sortable ? "pointer" : "default", userSelect: "none" }} onClick={() => col.sortable && toggleSort(col.key)}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    {col.label}
                    {col.sortable && sort?.key === col.key && (
                      <IconChevronDown size={11} style={{ transform: sort.dir === "asc" ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => {
              const id = getRowId(row);
              const isSel = selected.has(id);
              return (
                <tr key={id} onClick={() => onRowClick?.(row)} style={{ cursor: onRowClick ? "pointer" : "default", background: isSel ? "#FDF6E3" : undefined }}>
                  {selectable && (
                    <td style={td} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={isSel} onChange={() => toggleOne(id)} style={{ cursor: "pointer" }} />
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={col.key} style={td} onClick={e => col.stopRowClick && e.stopPropagation()}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectable && bulkActions && selected.size > 0 && (
        <div style={{
          position: "sticky", bottom: "16px", marginTop: "12px", background: BRAND.dark, color: "#fff",
          padding: "12px 18px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 10px 30px rgba(26,24,20,.25)",
        }}>
          <span style={{ fontFamily: "'Jost',sans-serif", fontSize: "13px" }}>{selected.size} selezionati</span>
          <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
            {bulkActions.map(a => (
              <button key={a.label} onClick={() => a.onClick([...selected])}
                style={{
                  background: a.danger ? "#C62828" : BRAND.gold, color: a.danger ? "#fff" : BRAND.dark, border: "none",
                  padding: "8px 16px", fontSize: "11px", letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Jost',sans-serif",
                }}>
                {a.label}
              </button>
            ))}
            <button onClick={() => setSelected(new Set())} style={{ background: "transparent", color: "#C9C2B4", border: "1px solid #3A362C", padding: "8px 12px", fontSize: "11px", cursor: "pointer", fontFamily: "'Jost',sans-serif" }}>
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COMMAND PALETTE (Cmd/Ctrl+K) ──────────────────────────────────────────
const TYPE_LABEL = { owner: "Proprietario", property: "Immobile", guest: "Ospite", booking: "Prenotazione" };

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(p => !p);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else { setQ(""); setResults([]); }
  }, [open]);

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const json = await apiFetch(`/api/crm/search?q=${encodeURIComponent(q.trim())}`);
        setResults(json.data || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,24,20,.7)", zIndex: 400, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "12vh" }} onClick={() => setOpen(false)}>
      <div style={{ background: "#fff", width: "100%", maxWidth: "560px", boxShadow: "0 24px 60px rgba(0,0,0,.4)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 18px", borderBottom: `1px solid ${BRAND.border}` }}>
          <IconSearch size={16} style={{ color: BRAND.textMuted }} />
          <input
            ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
            placeholder="Cerca proprietari, immobili, ospiti, prenotazioni..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: "15px", fontFamily: "'Jost',sans-serif", color: BRAND.dark }}
          />
          <kbd style={{ fontSize: "10px", color: BRAND.textMuted, border: `1px solid ${BRAND.border}`, padding: "2px 6px", fontFamily: "monospace" }}>ESC</kbd>
        </div>
        <div style={{ maxHeight: "360px", overflow: "auto" }}>
          {loading && <div style={{ padding: "24px", textAlign: "center", color: BRAND.textMuted, fontFamily: "'Jost',sans-serif", fontSize: "13px" }}>Ricerca...</div>}
          {!loading && q.trim().length >= 2 && results.length === 0 && (
            <div style={{ padding: "24px", textAlign: "center", color: BRAND.textMuted, fontFamily: "'Jost',sans-serif", fontSize: "13px" }}>Nessun risultato.</div>
          )}
          {results.map(r => (
            <a key={`${r.type}-${r.id}`} href={r.href} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 18px", textDecoration: "none", borderBottom: `1px solid ${BRAND.border}` }}
              onMouseEnter={e => e.currentTarget.style.background = BRAND.cream} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "13px", color: BRAND.dark, fontWeight: 500 }}>{r.label}</p>
                <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "11px", color: BRAND.textMuted }}>{TYPE_LABEL[r.type]} · {r.sublabel}</p>
              </div>
              <IconArrowRight size={14} style={{ color: BRAND.textMuted }} />
            </a>
          ))}
        </div>
        {q.trim().length < 2 && (
          <div style={{ padding: "14px 18px", fontSize: "11px", color: BRAND.textMuted, fontFamily: "'Jost',sans-serif" }}>
            Digita almeno 2 caratteri per cercare in tutto il CRM.
          </div>
        )}
      </div>
    </div>
  );
}

export function SearchTrigger() {
  const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);
  return (
    <button
      onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: isMac, ctrlKey: !isMac }))}
      style={{
        display: "flex", alignItems: "center", gap: "10px", background: "#fff", border: `1px solid ${BRAND.border}`,
        padding: "9px 14px", cursor: "pointer", color: BRAND.textMuted, fontFamily: "'Jost',sans-serif", fontSize: "13px", minWidth: "240px",
      }}>
      <IconSearch size={15} />
      <span style={{ flex: 1, textAlign: "left" }}>Cerca ovunque...</span>
      <kbd style={{ fontSize: "10px", border: `1px solid ${BRAND.border}`, padding: "1px 5px", fontFamily: "monospace" }}>{isMac ? "⌘K" : "Ctrl K"}</kbd>
    </button>
  );
}

// ─── NOTIFICATION BELL ──────────────────────────────────────────────────
const URGENCY_COLOR = { critical: "#C62828", warning: "#92702A", info: BRAND.gold };

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    apiFetch("/api/crm/notifications").then(json => { setItems(json.data || []); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(p => !p)} style={{ position: "relative", background: "#fff", border: `1px solid ${BRAND.border}`, width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: BRAND.dark }}>
        <IconBell size={17} />
        {items.length > 0 && (
          <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "#C62828", color: "#fff", fontSize: "10px", minWidth: "16px", height: "16px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Jost',sans-serif", padding: "0 4px" }}>
            {items.length}
          </span>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "44px", width: "340px", background: "#fff", border: `1px solid ${BRAND.border}`, boxShadow: "0 16px 40px rgba(26,24,20,.2)", zIndex: 200 }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${BRAND.border}` }}>
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "12px", letterSpacing: ".08em", textTransform: "uppercase", color: BRAND.textMuted }}>Notifiche</p>
          </div>
          <div style={{ maxHeight: "360px", overflow: "auto" }}>
            {!loaded ? (
              <div style={{ padding: "20px", textAlign: "center", fontSize: "12px", color: BRAND.textMuted, fontFamily: "'Jost',sans-serif" }}>Caricamento...</div>
            ) : items.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", fontSize: "12px", color: BRAND.textMuted, fontFamily: "'Jost',sans-serif" }}>Nessuna notifica al momento.</div>
            ) : items.map(it => (
              <a key={it.id} href={it.href} style={{ display: "flex", gap: "10px", padding: "12px 18px", textDecoration: "none", borderBottom: `1px solid ${BRAND.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = BRAND.cream} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: URGENCY_COLOR[it.urgency] || BRAND.gold, marginTop: "6px", flexShrink: 0 }} />
                <div>
                  <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "12.5px", color: BRAND.dark, lineHeight: 1.4 }}>{it.title}</p>
                  <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "11px", color: BRAND.textMuted, marginTop: "2px" }}>{it.subtitle}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function TimeAgo({ date }) {
  return <span title={fmtDate(date)}>{fmtDate(date)}</span>;
}

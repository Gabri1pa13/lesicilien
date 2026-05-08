"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const BRAND = { gold: "#BFA05A", dark: "#1A1814", cream: "#FAF8F3", border: "#E0D9CC", textMuted: "#8A8278" };

export default function AdminLogin() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email o password errati.");
      setLoading(false);
    } else {
      window.location.href = "/admin/richieste";
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Jost:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input:focus{outline:none;border-color:${BRAND.gold}!important}
      `}</style>
      <div style={{ minHeight: "100vh", background: BRAND.dark, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ background: BRAND.cream, width: "100%", maxWidth: "380px", border: `1px solid ${BRAND.border}` }}>
          <div style={{ padding: "40px 36px 32px", textAlign: "center", borderBottom: `1px solid ${BRAND.border}` }}>
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "9px", letterSpacing: ".28em", color: BRAND.gold, textTransform: "uppercase", marginBottom: "10px" }}>LE SICILIEN · ADMIN</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "24px", fontWeight: "400", color: BRAND.dark }}>Accesso</h1>
          </div>
          <form onSubmit={handleLogin} style={{ padding: "32px 36px 36px" }}>
            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontFamily: "'Jost',sans-serif", fontSize: "9px", letterSpacing: ".18em", color: BRAND.textMuted, textTransform: "uppercase", marginBottom: "8px" }}>Email</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: "100%", background: "#fff", border: `1px solid ${BRAND.border}`, padding: "11px 14px", fontSize: "14px", fontFamily: "'Jost',sans-serif", color: BRAND.dark, transition: "border-color .2s" }}
              />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontFamily: "'Jost',sans-serif", fontSize: "9px", letterSpacing: ".18em", color: BRAND.textMuted, textTransform: "uppercase", marginBottom: "8px" }}>Password</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: "100%", background: "#fff", border: `1px solid ${BRAND.border}`, padding: "11px 14px", fontSize: "14px", fontFamily: "'Jost',sans-serif", color: BRAND.dark, transition: "border-color .2s" }}
              />
            </div>
            {error && <p style={{ fontFamily: "'Jost',sans-serif", fontSize: "12px", color: "#C62828", marginBottom: "16px", fontWeight: "500" }}>{error}</p>}
            <button
              type="submit" disabled={loading}
              style={{ width: "100%", background: BRAND.dark, color: BRAND.gold, border: "none", padding: "13px", fontSize: "11px", fontWeight: "500", letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Jost',sans-serif" }}
            >
              {loading ? "Accesso..." : "Accedi"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

"use client";
import { useState } from "react";

async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "birilm_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

const SUPABASE_URL = "https://oynqygopnfowjylshuji.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bnF5Z29wbmZvd2p5bHNodWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODA5NjMsImV4cCI6MjA4MDE1Njk2M30.ipNJx3jh_h8I_rqWy_sgddEsyvf8KkuOZ3th0GPVV5U";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");

  async function handleLogin() {
    if (!username || !password) { setMsg("❌ Barcha maydonlarni to'ldiring!"); return; }
    setLoading(true);
    setMsg("");
    try {
      const hashedPassword = await hashPassword(password);
      let res = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username)}&password=eq.${encodeURIComponent(hashedPassword)}&select=id,username,email,role`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
      });
      let users = await res.json();

      if (!users || users.length === 0) {
        res = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(username)}&password=eq.${encodeURIComponent(hashedPassword)}&select=id,username,email,role`, {
          headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
        });
        users = await res.json();
      }

      if (!users || users.length === 0) {
        setMsg("❌ Noto'g'ri foydalanuvchi nomi yoki parol!");
        setLoading(false);
        return;
      }

      const user = users[0];
      const token = btoa(JSON.stringify({ userId: user.id, role: user.role, exp: Date.now() + 86400000 }));
      localStorage.setItem("birilm_token", token);
      localStorage.setItem("birilm_user", JSON.stringify(user));

      setMsg("✅ Muvaffaqiyatli kirdingiz!");
      
      // Role ga qarab yo'naltirish
      setTimeout(() => {
        if (user.role === "admin" || user.role === "super_admin") {
          window.location.href = "/";
        } else {
          window.location.href = "/";
        }
      }, 800);
    } catch {
      setMsg("❌ Xatolik yuz berdi!");
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!username || !password || !email) { setMsg("❌ Barcha maydonlarni to'ldiring!"); return; }
    if (password.length < 6) { setMsg("❌ Parol kamida 6 belgi bo'lishi kerak!"); return; }
    setLoading(true);
    setMsg("");
    try {
      // Email mavjudligini tekshirish
      const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/users?or=(username.eq.${encodeURIComponent(username)},email.eq.${encodeURIComponent(email)})`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
      });
      const existing = await checkRes.json();
      if (existing && existing.length > 0) {
        setMsg("❌ Bu foydalanuvchi nomi yoki email allaqachon mavjud!");
        setLoading(false);
        return;
      }

      const hashedPassword = await hashPassword(password);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({ username, email, password: hashedPassword, role: "user" })
      });
      const newUser = await res.json();
      if (newUser && newUser.length > 0) {
        const user = newUser[0];
        const token = btoa(JSON.stringify({ userId: user.id, role: user.role, exp: Date.now() + 86400000 }));
        localStorage.setItem("birilm_token", token);
        localStorage.setItem("birilm_user", JSON.stringify(user));
        setMsg("✅ Muvaffaqiyatli ro'yxatdan o'tdingiz!");
        setTimeout(() => { window.location.href = "/"; }, 800);
      }
    } catch {
      setMsg("❌ Xatolik yuz berdi!");
      setLoading(false);
    }
  }

  const iStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    backgroundColor: "#0f172a",
    color: "#f1f5f9",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: 16 }}>
      <div style={{ backgroundColor: "#1e293b", borderRadius: 24, padding: "40px 28px", width: "100%", maxWidth: 400, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
        
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg, #0f766e, #0e7490)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 24, color: "#fff", margin: "0 auto 16px" }}>BI</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#f1f5f9", margin: "0 0 6px" }}>BIR ILM</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Bilimlar Markazi</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", backgroundColor: "#0f172a", borderRadius: 12, padding: 4, marginBottom: 24 }}>
          <button onClick={() => { setIsRegister(false); setMsg(""); }} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, backgroundColor: !isRegister ? "#0f766e" : "transparent", color: !isRegister ? "#fff" : "#64748b" }}>
            Kirish
          </button>
          <button onClick={() => { setIsRegister(true); setMsg(""); }} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, backgroundColor: isRegister ? "#0f766e" : "transparent", color: isRegister ? "#fff" : "#64748b" }}>
            Ro'yxatdan o'tish
          </button>
        </div>

        {/* Alert */}
        {msg && (
          <div style={{ padding: "12px 14px", borderRadius: 10, marginBottom: 16, fontSize: 14, fontWeight: 600, backgroundColor: msg.includes("✅") ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)", color: msg.includes("✅") ? "#4ade80" : "#f87171" }}>
            {msg}
          </div>
        )}

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === "Enter" && !isRegister && handleLogin()} type="text" placeholder="Foydalanuvchi nomi" style={iStyle} />
          {isRegister && (
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" style={iStyle} />
          )}
          <input value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && !isRegister && handleLogin()} type="password" placeholder="Parol (kamida 6 belgi)" style={iStyle} />
          
          <button onClick={isRegister ? handleRegister : handleLogin} disabled={loading} style={{ backgroundColor: loading ? "#475569" : "#0f766e", color: "#fff", border: "none", borderRadius: 12, padding: "15px", fontWeight: 800, fontSize: 16, cursor: loading ? "default" : "pointer", marginTop: 4 }}>
            {loading ? "⏳ Kutilmoqda..." : isRegister ? "✅ Ro'yxatdan O'tish" : "Kirish →"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <a href="/" style={{ color: "#0f766e", fontSize: 13, textDecoration: "none" }}>← Bosh sahifaga qaytish</a>
        </div>
      </div>
    </div>
  );
}

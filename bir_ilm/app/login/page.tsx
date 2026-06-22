"use client";
import { useEffect } from "react";

export default function LoginPage() {
  useEffect(() => {
    // Load api.js script
    const script = document.createElement("script");
    script.src = "/js/api.js";
    script.onload = () => {
      // Redirect to login page after script loads
    };
    document.head.appendChild(script);
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ backgroundColor: "#1e293b", borderRadius: 20, padding: "40px 32px", width: "100%", maxWidth: 400, border: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: "linear-gradient(135deg, #0f766e, #0e7490)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 22, color: "#fff", margin: "0 auto 12px" }}>BI</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#f1f5f9", margin: "0 0 4px" }}>BIR ILM</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Tizimga kirish</p>
        </div>

        {/* Alert */}
        <div id="alert" style={{ display: "none", padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontSize: 14, fontWeight: 600 }}></div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input id="username" type="text" placeholder="Foydalanuvchi nomi" style={{ padding: "13px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#0f172a", color: "#f1f5f9", fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box" as const }} />
          <input id="password" type="password" placeholder="Parol" style={{ padding: "13px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#0f172a", color: "#f1f5f9", fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box" as const }} />
          <button id="login-btn" onClick={handleLogin} style={{ backgroundColor: "#0f766e", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontWeight: 800, fontSize: 15, cursor: "pointer", marginTop: 4 }}>
            Kirish →
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <a href="/" style={{ color: "#0f766e", fontSize: 13, textDecoration: "none" }}>← Bosh sahifaga qaytish</a>
        </div>
      </div>
    </div>
  );
}

async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "birilm_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function handleLogin() {
  const username = (document.getElementById("username") as HTMLInputElement).value.trim();
  const password = (document.getElementById("password") as HTMLInputElement).value;
  const alert = document.getElementById("alert")!;
  const btn = document.getElementById("login-btn") as HTMLButtonElement;

  if (!username || !password) {
    showAlert("Barcha maydonlarni to'ldiring!", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Kutilmoqda...";

  try {
    const SUPABASE_URL = "https://oynqygopnfowjylshuji.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bnF5Z29wbmZvd2p5bHNodWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODA5NjMsImV4cCI6MjA4MDE1Njk2M30.ipNJx3jh_h8I_rqWy_sgddEsyvf8KkuOZ3th0GPVV5U";

    const hashedPassword = await hashPassword(password);

    let res = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username)}&password=eq.${encodeURIComponent(hashedPassword)}`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
    });
    let users = await res.json();

    if (!users || users.length === 0) {
      res = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(username)}&password=eq.${encodeURIComponent(hashedPassword)}`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
      });
      users = await res.json();
    }

    if (!users || users.length === 0) {
      showAlert("Noto'g'ri foydalanuvchi nomi yoki parol!", "error");
      btn.disabled = false;
      btn.textContent = "Kirish →";
      return;
    }

    const user = users[0];
    const token = btoa(JSON.stringify({ userId: user.id, role: user.role, exp: Date.now() + 86400000 }));
    localStorage.setItem("birilm_token", token);
    localStorage.setItem("birilm_user", JSON.stringify({ id: user.id, username: user.username, email: user.email, role: user.role }));

    showAlert("Muvaffaqiyatli kirdingiz! ✅", "success");
    setTimeout(() => { window.location.href = "/"; }, 1000);
  } catch {
    showAlert("Xatolik yuz berdi!", "error");
    btn.disabled = false;
    btn.textContent = "Kirish →";
  }
}

function showAlert(msg: string, type: "error" | "success") {
  const alert = document.getElementById("alert")!;
  alert.style.display = "block";
  alert.style.backgroundColor = type === "error" ? "rgba(239,68,68,0.15)" : "rgba(74,222,128,0.15)";
  alert.style.color = type === "error" ? "#f87171" : "#4ade80";
  alert.textContent = msg;
}

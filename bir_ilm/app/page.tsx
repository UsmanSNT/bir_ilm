"use client";

import { useEffect, useState, type ReactNode } from "react";

// ─── Supabase ────────────────────────────────────────────────────────────────

const SUPABASE_URL = "https://oynqygopnfowjylshuji.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bnF5Z29wbmZvd2p5bHNodWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODA5NjMsImV4cCI6MjA4MDE1Njk2M30.ipNJx3jh_h8I_rqWy_sgddEsyvf8KkuOZ3th0GPVV5U";

async function supabase(table: string, options: { method?: string; query?: string; body?: object; headers?: object } = {}) {
  const { method = "GET", query = "", body, headers = {} } = options;
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": method === "POST" ? "return=representation" : "return=minimal",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!text) return { success: true };
  try { return JSON.parse(text); } catch { return { success: true }; }
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Section = "Home" | "Quiz" | "Natijalar";

type Quiz = {
  id: number;
  title: string;
  description: string;
  type: string;
  is_active: boolean;
  created_at: string;
};

type Question = {
  id: number;
  quiz_id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
};

type Result = {
  id: number;
  quiz_id: number;
  username: string;
  score: number;
  total: number;
  created_at: string;
};

// ─── Telegram ────────────────────────────────────────────────────────────────

function getTelegramUser() {
  if (typeof window === "undefined") return null;
  return (window as any).Telegram?.WebApp?.initDataUnsafe?.user ?? null;
}

function bootTelegram() {
  if (typeof window === "undefined") return false;
  const app = (window as any).Telegram?.WebApp;
  if (!app) return false;
  app.ready();
  app.expand();
  return true;
}

// ─── Stored user ─────────────────────────────────────────────────────────────

function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const u = localStorage.getItem("birilm_user");
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [section, setSection] = useState<Section>("Home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [storedUser, setStoredUser] = useState<any>(null);

  useEffect(() => {
    bootTelegram();
    setTelegramUser(getTelegramUser());
    setStoredUser(getStoredUser());
  }, []);

  const displayName = telegramUser?.first_name || storedUser?.username || "Mehmon";
  const isAdmin = storedUser?.role === "admin" || storedUser?.role === "super_admin";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", color: "#0f172a", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, borderBottom: "1px solid #e2e8f0", backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
          <button onClick={() => setSection("Home")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
            <span style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: "#0f766e", color: "#fff", fontWeight: 900, fontSize: 15, display: "grid", placeItems: "center" }}>BI</span>
            <span style={{ fontWeight: 900, fontSize: 16, color: "#14213d" }}>BIR ILM</span>
          </button>
          <nav style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {(["Home", "Quiz", "Natijalar"] as Section[]).map(s => (
              <button key={s} onClick={() => setSection(s)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, backgroundColor: section === s ? "#f0fdfa" : "transparent", color: section === s ? "#0f766e" : "#475569" }}>
                {s === "Home" ? "🏠 Bosh" : s === "Quiz" ? "🎯 Quiz" : "🏆 Natijalar"}
              </button>
            ))}
            {isAdmin && (
              <button onClick={() => setSection("Quiz")} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, backgroundColor: "#fef3c7", color: "#92400e" }}>
                ⚙️ Admin
              </button>
            )}
          </nav>
          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>👤 {displayName}</span>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {section === "Home" && <HomePage setSection={setSection} isAdmin={isAdmin} />}
        {section === "Quiz" && <QuizPage isAdmin={isAdmin} storedUser={storedUser} telegramUser={telegramUser} />}
        {section === "Natijalar" && <NatijalarPage />}
      </main>

      <footer style={{ borderTop: "1px solid #e2e8f0", padding: "20px 16px", textAlign: "center", marginTop: 40 }}>
        <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>© 2025 Bir Ilm · <a href="https://t.me/birilm1" style={{ color: "#0f766e" }}>Telegram</a></p>
      </footer>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────

function HomePage({ setSection, isAdmin }: { setSection: (s: Section) => void; isAdmin: boolean }) {
  return (
    <div>
      <div style={{ textAlign: "center", padding: "40px 0 32px" }}>
        <h1 style={{ fontSize: "clamp(32px,6vw,56px)", fontWeight: 900, color: "#14213d", margin: "0 0 12px" }}>BIR ILM</h1>
        <p style={{ fontSize: 17, color: "#475569", maxWidth: 500, margin: "0 auto 32px", lineHeight: 1.6 }}>
          O'qish, quiz va birgalikda o'sish uchun bilimlar platformasi
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => setSection("Quiz")} style={{ backgroundColor: "#0f766e", color: "#fff", border: "none", borderRadius: 10, padding: "13px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            🎯 Quizlarga kirish
          </button>
          <button onClick={() => setSection("Natijalar")} style={{ backgroundColor: "#fff", color: "#14213d", border: "2px solid #e2e8f0", borderRadius: 10, padding: "13px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            🏆 Natijalar
          </button>
          <a href="/pages/user.html" style={{ backgroundColor: "#fff", color: "#0f766e", border: "2px solid #0f766e", borderRadius: 10, padding: "13px 28px", fontWeight: 700, fontSize: 15, textDecoration: "none", display: "inline-block" }}>
            📚 Kitob Taqrizlari
          </a>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginTop: 16 }}>
        <StatCard icon="🎯" label="Quizlar" desc="Bilimingizni sinab ko'ring" />
        <StatCard icon="🏆" label="Reyting" desc="Eng yaxshi natijalar" />
        <StatCard icon="📚" label="Kitoblar" desc="Taqrizlar va tavsiyalar" />
        {isAdmin && <StatCard icon="⚙️" label="Admin" desc="Quiz yarating va boshqaring" />}
      </div>
    </div>
  );
}

function StatCard({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <p style={{ fontWeight: 800, fontSize: 16, color: "#14213d", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{desc}</p>
    </div>
  );
}

// ─── Quiz Page ────────────────────────────────────────────────────────────────

function QuizPage({ isAdmin, storedUser, telegramUser }: { isAdmin: boolean; storedUser: any; telegramUser: any }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { loadQuizzes(); }, []);

  async function loadQuizzes() {
    setLoading(true);
    const data = await supabase("quizzes", { query: "?order=created_at.desc" });
    setQuizzes(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  if (activeQuiz) {
    return <QuizPlay quiz={activeQuiz} onBack={() => { setActiveQuiz(null); loadQuizzes(); }} storedUser={storedUser} telegramUser={telegramUser} />;
  }

  if (showCreate && isAdmin) {
    return <QuizCreate onBack={() => { setShowCreate(false); loadQuizzes(); }} storedUser={storedUser} />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "#14213d", margin: "0 0 4px" }}>🎯 Quizlar</h2>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>Bilimingizni sinab ko'ring</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} style={{ backgroundColor: "#0f766e", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            ➕ Yangi Quiz
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#64748b", padding: 40 }}>Yuklanmoqda...</p>
      ) : quizzes.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 40, margin: "0 0 12px" }}>🎯</p>
          <p style={{ fontSize: 17, fontWeight: 700, color: "#14213d", margin: "0 0 8px" }}>Hali quiz yo'q</p>
          {isAdmin && <p style={{ fontSize: 14, color: "#64748b" }}>Yangi quiz yarating!</p>}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {quizzes.map(q => (
            <div key={q.id} style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <span style={{ backgroundColor: "#f0fdfa", color: "#0f766e", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{q.type}</span>
                <span style={{ fontSize: 11, color: q.is_active ? "#166534" : "#64748b", backgroundColor: q.is_active ? "#dcfce7" : "#f1f5f9", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>
                  {q.is_active ? "Faol" : "Nofaol"}
                </span>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#14213d", margin: "0 0 8px" }}>{q.title}</h3>
              <p style={{ fontSize: 13, color: "#475569", margin: "0 0 16px", lineHeight: 1.5 }}>{q.description}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setActiveQuiz(q)} style={{ flex: 1, backgroundColor: "#0f766e", color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Boshlash →
                </button>
                {isAdmin && (
                  <button onClick={async () => { await supabase("quizzes", { method: "DELETE", query: `?id=eq.${q.id}` }); loadQuizzes(); }} style={{ backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, padding: "9px 14px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Quiz Create ──────────────────────────────────────────────────────────────

function QuizCreate({ onBack, storedUser }: { onBack: () => void; storedUser: any }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Umumiy");
  const [questions, setQuestions] = useState([{ question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "a" }]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function addQuestion() {
    setQuestions([...questions, { question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "a" }]);
  }

  function removeQuestion(i: number) {
    setQuestions(questions.filter((_, idx) => idx !== i));
  }

  function updateQ(i: number, field: string, value: string) {
    const updated = [...questions];
    (updated[i] as any)[field] = value;
    setQuestions(updated);
  }

  async function save() {
    if (!title.trim()) { setMsg("Sarlavha kiriting!"); return; }
    if (questions.some(q => !q.question.trim() || !q.option_a.trim() || !q.option_b.trim())) {
      setMsg("Barcha savollar va kamida 2 ta variant to'ldiring!"); return;
    }
    setSaving(true);
    const quiz = await supabase("quizzes", {
      method: "POST",
      body: { title, description, type, admin_id: storedUser?.id, is_active: true },
      headers: { "Prefer": "return=representation" },
    });
    const quizId = Array.isArray(quiz) ? quiz[0]?.id : quiz?.id;
    if (!quizId) { setMsg("Xatolik yuz berdi!"); setSaving(false); return; }
    for (const q of questions) {
      await supabase("quiz_questions", { method: "POST", body: { ...q, quiz_id: quizId } });
    }
    setMsg("Quiz muvaffaqiyatli yaratildi! ✅");
    setTimeout(onBack, 1500);
  }

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#0f766e", fontWeight: 700, fontSize: 14, marginBottom: 20 }}>← Orqaga</button>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: "#14213d", margin: "0 0 24px" }}>➕ Yangi Quiz Yaratish</h2>

      {msg && <div style={{ padding: 12, borderRadius: 8, backgroundColor: msg.includes("✅") ? "#dcfce7" : "#fee2e2", color: msg.includes("✅") ? "#166534" : "#dc2626", marginBottom: 16, fontWeight: 600 }}>{msg}</div>}

      <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Quiz ma'lumotlari</h3>
        <div style={{ display: "grid", gap: 12 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Quiz nomi *" style={inputStyle} />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tavsif (ixtiyoriy)" rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          <select value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
            {["Umumiy", "Kitob", "TOPIK", "IT", "Kiberkimxavfsizlik", "Ingliz tili"].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {questions.map((q, i) => (
        <div key={i} style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f766e" }}>{i + 1}-savol</h3>
            {questions.length > 1 && (
              <button onClick={() => removeQuestion(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontWeight: 700 }}>✕ O'chirish</button>
            )}
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <input value={q.question} onChange={e => updateQ(i, "question", e.target.value)} placeholder="Savol matni *" style={inputStyle} />
            {["a", "b", "c", "d"].map(opt => (
              <input key={opt} value={(q as any)[`option_${opt}`]} onChange={e => updateQ(i, `option_${opt}`, e.target.value)} placeholder={`${opt.toUpperCase()} variant${opt <= "b" ? " *" : " (ixtiyoriy)"}`} style={inputStyle} />
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>To'g'ri javob:</label>
              <select value={q.correct_answer} onChange={e => updateQ(i, "correct_answer", e.target.value)} style={{ ...inputStyle, flex: "none", width: "auto" }}>
                <option value="a">A</option>
                <option value="b">B</option>
                <option value="c">C</option>
                <option value="d">D</option>
              </select>
            </div>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button onClick={addQuestion} style={{ flex: 1, backgroundColor: "#f0fdfa", color: "#0f766e", border: "2px solid #0f766e", borderRadius: 10, padding: 12, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          ➕ Savol qo'shish
        </button>
        <button onClick={save} disabled={saving} style={{ flex: 1, backgroundColor: "#0f766e", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          {saving ? "Saqlanmoqda..." : "✅ Saqlash"}
        </button>
      </div>
    </div>
  );
}

// ─── Quiz Play ────────────────────────────────────────────────────────────────

function QuizPlay({ quiz, onBack, storedUser, telegramUser }: { quiz: Quiz; onBack: () => void; storedUser: any; telegramUser: any }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  const username = telegramUser?.first_name || storedUser?.username || "Mehmon";

  useEffect(() => {
    supabase("quiz_questions", { query: `?quiz_id=eq.${quiz.id}&order=id.asc` }).then(data => {
      setQuestions(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, [quiz.id]);

  function selectAnswer(ans: string) {
    setAnswers(prev => ({ ...prev, [current]: ans }));
  }

  async function finish() {
    let s = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correct_answer) s++; });
    setScore(s);
    setFinished(true);
    await supabase("quiz_results", { method: "POST", body: { quiz_id: quiz.id, user_id: storedUser?.id || null, username, score: s, total: questions.length } });
  }

  if (loading) return <div style={{ textAlign: "center", padding: 60 }}>Yuklanmoqda...</div>;

  if (questions.length === 0) return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <p style={{ fontSize: 40 }}>📭</p>
      <p style={{ fontWeight: 700 }}>Bu quizda hali savollar yo'q</p>
      <button onClick={onBack} style={{ ...btnStyle, marginTop: 16 }}>← Orqaga</button>
    </div>
  );

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "📖"}</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: "#14213d", margin: "0 0 8px" }}>Quiz tugadi!</h2>
        <p style={{ fontSize: 18, color: "#475569", margin: "0 0 24px" }}>{username}, sizning natijangiz:</p>
        <div style={{ display: "inline-block", backgroundColor: "#f0fdfa", borderRadius: 16, padding: "24px 40px", border: "2px solid #0f766e", marginBottom: 24 }}>
          <p style={{ fontSize: 48, fontWeight: 900, color: "#0f766e", margin: "0 0 4px" }}>{score}/{questions.length}</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#14213d", margin: 0 }}>{pct}%</p>
        </div>
        <p style={{ fontSize: 16, color: "#475569", margin: "0 0 24px" }}>
          {pct >= 80 ? "Ajoyib natija! 🌟" : pct >= 50 ? "Yaxshi harakat! Davom eting 💪" : "Ko'proq o'qing va qayta urinib ko'ring 📚"}
        </p>
        <button onClick={onBack} style={btnStyle}>← Quizlarga qaytish</button>
      </div>
    );
  }

  const q = questions[current];
  const opts = [
    { key: "a", text: q.option_a },
    { key: "b", text: q.option_b },
    ...(q.option_c ? [{ key: "c", text: q.option_c }] : []),
    ...(q.option_d ? [{ key: "d", text: q.option_d }] : []),
  ];

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#0f766e", fontWeight: 700, fontSize: 14, marginBottom: 16 }}>← Orqaga</button>
      <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
        {/* Progress */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0f766e" }}>{quiz.title}</span>
            <span style={{ fontSize: 13, color: "#64748b" }}>{current + 1}/{questions.length}</span>
          </div>
          <div style={{ height: 6, backgroundColor: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", backgroundColor: "#0f766e", borderRadius: 3, width: `${((current + 1) / questions.length) * 100}%`, transition: "width 0.3s" }} />
          </div>
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#14213d", margin: "0 0 20px", lineHeight: 1.5 }}>{current + 1}. {q.question}</h3>

        <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
          {opts.map(opt => (
            <button key={opt.key} onClick={() => selectAnswer(opt.key)} style={{ padding: "13px 16px", borderRadius: 10, border: `2px solid ${answers[current] === opt.key ? "#0f766e" : "#e2e8f0"}`, backgroundColor: answers[current] === opt.key ? "#f0fdfa" : "#fff", color: "#14213d", fontWeight: answers[current] === opt.key ? 700 : 500, fontSize: 15, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
              <span style={{ fontWeight: 700, color: "#0f766e", marginRight: 8 }}>{opt.key.toUpperCase()}.</span> {opt.text}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {current > 0 && (
            <button onClick={() => setCurrent(c => c - 1)} style={{ flex: 1, backgroundColor: "#f8fafc", color: "#14213d", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              ← Oldingi
            </button>
          )}
          {current < questions.length - 1 ? (
            <button onClick={() => setCurrent(c => c + 1)} disabled={!answers[current]} style={{ flex: 2, backgroundColor: answers[current] ? "#0f766e" : "#e2e8f0", color: answers[current] ? "#fff" : "#94a3b8", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, fontSize: 14, cursor: answers[current] ? "pointer" : "default" }}>
              Keyingi →
            </button>
          ) : (
            <button onClick={finish} disabled={!answers[current]} style={{ flex: 2, backgroundColor: answers[current] ? "#0f766e" : "#e2e8f0", color: answers[current] ? "#fff" : "#94a3b8", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, fontSize: 14, cursor: answers[current] ? "pointer" : "default" }}>
              ✅ Yakunlash
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Natijalar Page ───────────────────────────────────────────────────────────

function NatijalarPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<number | "all">("all");

  useEffect(() => {
    Promise.all([
      supabase("quiz_results", { query: "?order=score.desc&limit=50" }),
      supabase("quizzes", { query: "?order=created_at.desc" }),
    ]).then(([r, q]) => {
      setResults(Array.isArray(r) ? r : []);
      setQuizzes(Array.isArray(q) ? q : []);
      setLoading(false);
    });
  }, []);

  const filtered = selectedQuiz === "all" ? results : results.filter(r => r.quiz_id === selectedQuiz);

  return (
    <div>
      <h2 style={{ fontSize: 26, fontWeight: 900, color: "#14213d", margin: "0 0 20px" }}>🏆 Natijalar va Reyting</h2>
      <select value={selectedQuiz} onChange={e => setSelectedQuiz(e.target.value === "all" ? "all" : Number(e.target.value))} style={{ ...inputStyle, marginBottom: 20, maxWidth: 320 }}>
        <option value="all">Barcha quizlar</option>
        {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
      </select>

      {loading ? (
        <p style={{ textAlign: "center", color: "#64748b", padding: 40 }}>Yuklanmoqda...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 40, margin: "0 0 12px" }}>📊</p>
          <p style={{ fontWeight: 700, color: "#14213d" }}>Hali natijalar yo'q</p>
        </div>
      ) : (
        <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          {filtered.map((r, i) => {
            const pct = Math.round((r.score / r.total) * 100);
            const quiz = quizzes.find(q => q.id === r.quiz_id);
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7c32" : "#64748b", minWidth: 28 }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, color: "#14213d", margin: "0 0 2px", fontSize: 15 }}>{r.username}</p>
                  <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{quiz?.title || "Quiz"}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 800, color: "#0f766e", margin: "0 0 2px", fontSize: 16 }}>{r.score}/{r.total}</p>
                  <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{pct}%</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  fontSize: 14,
  outline: "none",
  backgroundColor: "#f8fafc",
  boxSizing: "border-box",
};

const btnStyle: React.CSSProperties = {
  backgroundColor: "#0f766e",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "12px 28px",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
};

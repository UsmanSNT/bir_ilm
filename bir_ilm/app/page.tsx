"use client";

import { useEffect, useState, useRef } from "react";

const SUPABASE_URL = "https://oynqygopnfowjylshuji.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bnF5Z29wbmZvd2p5bHNodWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODA5NjMsImV4cCI6MjA4MDE1Njk2M30.ipNJx3jh_h8I_rqWy_sgddEsyvf8KkuOZ3th0GPVV5U";

async function db(table: string, options: { method?: string; query?: string; body?: object; headers?: object } = {}) {
  const { method = "GET", query = "", body, headers = {} } = options;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
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

type Tab = "home" | "quiz" | "leaderboard";
type Quiz = { id: number; title: string; description: string; type: string; is_active: boolean; created_at: string; time_per_question: number; max_questions: number };
type Question = { id: number; quiz_id: number; question: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_answer: string };
type Result = { id: number; quiz_id: number; username: string; score: number; total: number; created_at: string };

function getTgUser() {
  if (typeof window === "undefined") return null;
  return (window as any).Telegram?.WebApp?.initDataUnsafe?.user ?? null;
}
function getLocalUser() {
  if (typeof window === "undefined") return null;
  try { const u = localStorage.getItem("birilm_user"); return u ? JSON.parse(u) : null; } catch { return null; }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [tgUser, setTgUser] = useState<any>(null);
  const [localUser, setLocalUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const app = (window as any).Telegram?.WebApp;
      if (app) { app.ready(); app.expand(); }
      setTgUser(getTgUser());
      setLocalUser(getLocalUser());
    }
  }, []);

  const name = tgUser?.first_name || localUser?.username || "Mehmon";
  const isAdmin = localUser?.role === "admin" || localUser?.role === "super_admin";

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#0f172a", color: "#f1f5f9", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 20px 12px", background: "linear-gradient(135deg, #0f766e 0%, #0e7490 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#fff" }}>BI</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#fff", lineHeight: 1 }}>BIR ILM</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>Bilimlar Markazi</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isAdmin && <span style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>ADMIN</span>}
            {localUser ? (
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "5px 12px", fontSize: 13, color: "#fff", fontWeight: 600 }}>👤 {name}</div>
            ) : (
              <a href="/login" style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "5px 12px", fontSize: 13, color: "#fff", fontWeight: 600, textDecoration: "none" }}>Kirish →</a>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {tab === "home" && <HomeTab setTab={setTab} isAdmin={isAdmin} />}
        {tab === "quiz" && <QuizTab isAdmin={isAdmin} localUser={localUser} tgUser={tgUser} />}
        {tab === "leaderboard" && <LeaderboardTab />}
      </div>

      <div style={{ position: "sticky", bottom: 0, backgroundColor: "#1e293b", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", padding: "8px 0 max(8px, env(safe-area-inset-bottom))" }}>
        {([
          { id: "home", icon: "🏠", label: "Bosh" },
          { id: "quiz", icon: "🎯", label: "Quiz" },
          { id: "leaderboard", icon: "🏆", label: "Reyting" },
        ] as { id: Tab; icon: string; label: string }[]).map(item => (
          <button key={item.id} onClick={() => setTab(item.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "6px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: tab === item.id ? "#14b8a6" : "#64748b" }}>{item.label}</span>
            {tab === item.id && <div style={{ width: 20, height: 3, backgroundColor: "#14b8a6", borderRadius: 2 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

function HomeTab({ setTab, isAdmin }: { setTab: (t: Tab) => void; isAdmin: boolean }) {
  return (
    <div style={{ padding: "20px 16px" }}>
      <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: 20, padding: "28px 24px", marginBottom: 20, border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🧠</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 8px", color: "#f1f5f9" }}>BIR ILM QUIZ</h1>
        <p style={{ fontSize: 15, color: "#94a3b8", margin: "0 0 24px", lineHeight: 1.6 }}>Bilimingizni sinab ko'ring va reytingda ko'taring</p>
        <button onClick={() => setTab("quiz")} style={{ backgroundColor: "#0f766e", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontWeight: 800, fontSize: 16, cursor: "pointer", width: "100%" }}>
          🎯 Quizni Boshlash
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { icon: "🎯", label: "Quizlar", action: () => setTab("quiz") },
          { icon: "🏆", label: "Reyting", action: () => setTab("leaderboard") },
          { icon: "📚", label: "Kitoblar", action: () => window.location.href = "/index.html" },
          { icon: "💬", label: "Telegram", action: () => window.open("https://t.me/birilm1") },
        ].map(s => (
          <div key={s.label} onClick={s.action} style={{ backgroundColor: "#1e293b", borderRadius: 14, padding: "18px 16px", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizTab({ isAdmin, localUser, tgUser }: { isAdmin: boolean; localUser: any; tgUser: any }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Quiz | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await db("quizzes", { query: "?order=created_at.desc" });
    setQuizzes(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  if (active) return <PlayQuiz quiz={active} onBack={() => { setActive(null); load(); }} localUser={localUser} tgUser={tgUser} />;
  if (creating && isAdmin) return <CreateQuiz onBack={() => { setCreating(false); load(); }} localUser={localUser} />;

  return (
    <div style={{ padding: "20px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 2px", color: "#f1f5f9" }}>🎯 Quizlar</h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{quizzes.length} ta quiz mavjud</p>
        </div>
        {isAdmin && (
          <button onClick={() => setCreating(true)} style={{ backgroundColor: "#0f766e", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            ➕ Yangi
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>⏳ Yuklanmoqda...</div>
      ) : quizzes.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, backgroundColor: "#1e293b", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
          <p style={{ fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px" }}>Hali quiz yo'q</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {quizzes.map(q => (
            <div key={q.id} style={{ backgroundColor: "#1e293b", borderRadius: 16, padding: "18px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <span style={{ backgroundColor: "rgba(15,118,110,0.2)", color: "#14b8a6", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{q.type}</span>
                <span style={{ fontSize: 11, color: q.is_active ? "#4ade80" : "#64748b", fontWeight: 600 }}>{q.is_active ? "● Faol" : "○ Nofaol"}</span>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#f1f5f9", margin: "0 0 6px" }}>{q.title}</h3>
              {q.description && <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 10px", lineHeight: 1.5 }}>{q.description}</p>}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: "#64748b", backgroundColor: "#0f172a", padding: "4px 10px", borderRadius: 6 }}>
                  ⏱ {q.time_per_question || 30}s / savol
                </span>
                <span style={{ fontSize: 12, color: "#64748b", backgroundColor: "#0f172a", padding: "4px 10px", borderRadius: 6 }}>
                  📝 Max {q.max_questions || 10} ta savol
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setActive(q)} style={{ flex: 1, backgroundColor: "#0f766e", color: "#fff", border: "none", borderRadius: 10, padding: "11px 0", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Boshlash →
                </button>
                {isAdmin && (
                  <button onClick={async () => { await db("quizzes", { method: "DELETE", query: `?id=eq.${q.id}` }); load(); }} style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "11px 14px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
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

function CreateQuiz({ onBack, localUser }: { onBack: () => void; localUser: any }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Umumiy");
  const [timePerQ, setTimePerQ] = useState(30);
  const [maxQ, setMaxQ] = useState(10);
  const [questions, setQuestions] = useState([emptyQ()]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function emptyQ() { return { question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "a" }; }

  function updateQ(i: number, field: string, value: string) {
    const updated = [...questions];
    (updated[i] as any)[field] = value;
    setQuestions(updated);
  }

  async function save() {
    if (!title.trim()) { setMsg("❌ Sarlavha kiriting!"); return; }
    if (questions.some(q => !q.question.trim() || !q.option_a.trim() || !q.option_b.trim())) {
      setMsg("❌ Barcha savollar va kamida 2 variant to'ldiring!"); return;
    }
    setSaving(true);
    const quiz = await db("quizzes", {
      method: "POST",
      body: { title, description, type, admin_id: localUser?.id, is_active: true, time_per_question: timePerQ, max_questions: maxQ },
      headers: { "Prefer": "return=representation" }
    });
    const quizId = Array.isArray(quiz) ? quiz[0]?.id : quiz?.id;
    if (!quizId) { setMsg("❌ Xatolik!"); setSaving(false); return; }
    for (const q of questions) await db("quiz_questions", { method: "POST", body: { ...q, quiz_id: quizId } });
    setMsg("✅ Quiz yaratildi!");
    setTimeout(onBack, 1200);
  }

  return (
    <div style={{ padding: "20px 16px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#14b8a6", fontWeight: 700, fontSize: 14, marginBottom: 16, padding: 0 }}>← Orqaga</button>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: "#f1f5f9", margin: "0 0 20px" }}>➕ Yangi Quiz</h2>

      {msg && <div style={{ padding: 12, borderRadius: 10, backgroundColor: msg.includes("✅") ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)", color: msg.includes("✅") ? "#4ade80" : "#f87171", marginBottom: 16, fontWeight: 600, fontSize: 14 }}>{msg}</div>}

      <div style={{ backgroundColor: "#1e293b", borderRadius: 16, padding: 18, marginBottom: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ fontWeight: 700, color: "#94a3b8", fontSize: 12, margin: "0 0 12px", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Quiz ma'lumotlari</p>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Quiz nomi *" style={iStyle} />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tavsif (ixtiyoriy)" rows={2} style={{ ...iStyle, resize: "vertical" as const }} />
          <select value={type} onChange={e => setType(e.target.value)} style={iStyle}>
            {["Umumiy", "Kitob", "TOPIK", "IT", "Kiberkimxavfsizlik", "Ingliz tili", "Matematika"].map(t => <option key={t}>{t}</option>)}
          </select>

          {/* Vaqt va max savollar */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6, fontWeight: 600 }}>⏱ Har savol uchun vaqt (soniya)</label>
              <select value={timePerQ} onChange={e => setTimePerQ(Number(e.target.value))} style={iStyle}>
                {[10, 15, 20, 30, 45, 60, 90, 120].map(t => <option key={t} value={t}>{t} soniya</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6, fontWeight: 600 }}>📝 Max savollar soni</label>
              <select value={maxQ} onChange={e => setMaxQ(Number(e.target.value))} style={iStyle}>
                {[5, 8, 10, 12, 15, 20, 25, 30].map(n => <option key={n} value={n}>{n} ta</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {questions.map((q, i) => (
        <div key={i} style={{ backgroundColor: "#1e293b", borderRadius: 16, padding: 18, marginBottom: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontWeight: 700, color: "#14b8a6", fontSize: 13 }}>{i + 1}-savol</span>
            {questions.length > 1 && (
              <button onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 13, fontWeight: 700 }}>✕</button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            <input value={q.question} onChange={e => updateQ(i, "question", e.target.value)} placeholder="Savol matni *" style={iStyle} />
            {["a", "b", "c", "d"].map(opt => (
              <input key={opt} value={(q as any)[`option_${opt}`]} onChange={e => updateQ(i, `option_${opt}`, e.target.value)} placeholder={`${opt.toUpperCase()} variant${["a","b"].includes(opt) ? " *" : ""}`} style={iStyle} />
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
              <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>To'g'ri:</span>
              {["a","b","c","d"].map(opt => (
                <button key={opt} onClick={() => updateQ(i, "correct_answer", opt)} style={{ width: 36, height: 36, borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 14, backgroundColor: q.correct_answer === opt ? "#0f766e" : "#0f172a", color: q.correct_answer === opt ? "#fff" : "#64748b" }}>
                  {opt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, marginTop: 4 }}>
        <button onClick={() => setQuestions([...questions, emptyQ()])} style={{ backgroundColor: "transparent", color: "#14b8a6", border: "2px solid #0f766e", borderRadius: 12, padding: 13, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          ➕ Savol qo'shish
        </button>
        <button onClick={save} disabled={saving} style={{ backgroundColor: saving ? "#475569" : "#0f766e", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontWeight: 800, fontSize: 15, cursor: saving ? "default" : "pointer" }}>
          {saving ? "Saqlanmoqda..." : "✅ Quizni Saqlash"}
        </button>
      </div>
    </div>
  );
}

function PlayQuiz({ quiz, onBack, localUser, tgUser }: { quiz: Quiz; onBack: () => void; localUser: any; tgUser: any }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const username = tgUser?.first_name || localUser?.username || "Mehmon";
  const timePerQ = quiz.time_per_question || 30;

  useEffect(() => {
    db("quiz_questions", { query: `?quiz_id=eq.${quiz.id}&order=id.asc` }).then(data => {
      const allQ = Array.isArray(data) ? data : [];
      const maxQ = quiz.max_questions || 10;
      // Random shuffle va max_questions ta tanlash
      const selected = shuffle(allQ).slice(0, maxQ);
      setQuestions(selected);
      setLoading(false);
      setTimeLeft(timePerQ);
    });
  }, [quiz.id]);

  // Timer
  useEffect(() => {
    if (loading || finished || questions.length === 0) return;
    setTimeLeft(timePerQ);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Vaqt tugadi - keyingi savolga o'tish
          clearInterval(timerRef.current!);
          if (current < questions.length - 1) {
            setCurrent(c => c + 1);
          } else {
            finishQuiz();
          }
          return timePerQ;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [current, loading, finished, questions.length]);

  async function finishQuiz() {
    clearInterval(timerRef.current!);
    let s = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correct_answer) s++; });
    setScore(s);
    setFinished(true);
    await db("quiz_results", { method: "POST", body: { quiz_id: quiz.id, user_id: localUser?.id || null, username, score: s, total: questions.length } });
  }

  function selectAnswer(ans: string) {
    setAnswers(prev => ({ ...prev, [current]: ans }));
  }

  function nextQuestion() {
    clearInterval(timerRef.current!);
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
    } else {
      finishQuiz();
    }
  }

  if (loading) return <div style={{ textAlign: "center", padding: 80, color: "#64748b" }}>⏳ Yuklanmoqda...</div>;

  if (questions.length === 0) return (
    <div style={{ padding: "20px 16px", textAlign: "center" }}>
      <p style={{ fontSize: 40 }}>📭</p>
      <p style={{ fontWeight: 700, color: "#f1f5f9" }}>Savollar yo'q</p>
      <button onClick={onBack} style={bStyle}>← Orqaga</button>
    </div>
  );

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const emoji = pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "📖";
    const msg = pct >= 80 ? "Ajoyib natija! 🌟" : pct >= 50 ? "Yaxshi harakat! 💪" : "Ko'proq o'qing! 📚";
    return (
      <div style={{ padding: "20px 16px", textAlign: "center" }}>
        <div style={{ backgroundColor: "#1e293b", borderRadius: 20, padding: "40px 24px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 16 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>{emoji}</div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#f1f5f9", margin: "0 0 6px" }}>Quiz Tugadi!</h2>
          <p style={{ color: "#94a3b8", margin: "0 0 28px", fontSize: 15 }}>{username}</p>
          <div style={{ background: "linear-gradient(135deg, #0f766e, #0e7490)", borderRadius: 16, padding: "24px", marginBottom: 20 }}>
            <div style={{ fontSize: 52, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{score}/{questions.length}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>{pct}%</div>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 16, margin: 0 }}>{msg}</p>
        </div>
        <button onClick={onBack} style={bStyle}>← Quizlarga qaytish</button>
      </div>
    );
  }

  const q = questions[current];
  const opts = [
    { k: "a", t: q.option_a },
    { k: "b", t: q.option_b },
    ...(q.option_c ? [{ k: "c", t: q.option_c }] : []),
    ...(q.option_d ? [{ k: "d", t: q.option_d }] : []),
  ];
  const progress = ((current + 1) / questions.length) * 100;
  const timerPct = (timeLeft / timePerQ) * 100;
  const timerColor = timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#f59e0b" : "#0f766e";

  return (
    <div style={{ padding: "20px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#14b8a6", fontWeight: 700, fontSize: 14, padding: 0 }}>← Chiqish</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>{current + 1} / {questions.length}</span>
        {/* Timer doira */}
        <div style={{ position: "relative", width: 44, height: 44 }}>
          <svg viewBox="0 0 44 44" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
            <circle cx="22" cy="22" r="18" fill="none" stroke="#1e293b" strokeWidth="4" />
            <circle cx="22" cy="22" r="18" fill="none" stroke={timerColor} strokeWidth="4" strokeDasharray={`${2 * Math.PI * 18}`} strokeDashoffset={`${2 * Math.PI * 18 * (1 - timerPct / 100)}`} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }} />
          </svg>
          <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 13, fontWeight: 800, color: timerColor }}>{timeLeft}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, backgroundColor: "#1e293b", borderRadius: 3, marginBottom: 16, overflow: "hidden" }}>
        <div style={{ height: "100%", backgroundColor: "#0f766e", borderRadius: 3, width: `${progress}%`, transition: "width 0.4s ease" }} />
      </div>

      <div style={{ backgroundColor: "#1e293b", borderRadius: 16, padding: "20px 18px", marginBottom: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#14b8a6", margin: "0 0 10px", textTransform: "uppercase" as const }}>{quiz.title}</p>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", margin: 0, lineHeight: 1.6 }}>{q.question}</h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, marginBottom: 20 }}>
        {opts.map(opt => {
          const selected = answers[current] === opt.k;
          return (
            <button key={opt.k} onClick={() => selectAnswer(opt.k)} style={{ padding: "15px 16px", borderRadius: 14, border: `2px solid ${selected ? "#0f766e" : "rgba(255,255,255,0.07)"}`, backgroundColor: selected ? "rgba(15,118,110,0.2)" : "#1e293b", color: "#f1f5f9", fontWeight: selected ? 700 : 500, fontSize: 15, cursor: "pointer", textAlign: "left" as const, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: selected ? "#0f766e" : "#0f172a", color: selected ? "#fff" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{opt.k.toUpperCase()}</span>
              {opt.t}
            </button>
          );
        })}
      </div>

      <button onClick={nextQuestion} disabled={!answers[current]} style={{ width: "100%", backgroundColor: answers[current] ? "#0f766e" : "#1e293b", color: answers[current] ? "#fff" : "#475569", border: "none", borderRadius: 12, padding: 14, fontWeight: 800, fontSize: 15, cursor: answers[current] ? "pointer" : "default" }}>
        {current < questions.length - 1 ? "Keyingi →" : "✅ Yakunlash"}
      </button>
    </div>
  );
}

function LeaderboardTab() {
  const [results, setResults] = useState<Result[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filter, setFilter] = useState<number | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      db("quiz_results", { query: "?order=score.desc&limit=50" }),
      db("quizzes", { query: "?order=created_at.desc" }),
    ]).then(([r, q]) => {
      setResults(Array.isArray(r) ? r : []);
      setQuizzes(Array.isArray(q) ? q : []);
      setLoading(false);
    });
  }, []);

  const filtered = filter === "all" ? results : results.filter(r => r.quiz_id === filter);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{ padding: "20px 16px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: "#f1f5f9", margin: "0 0 16px" }}>🏆 Reyting</h2>
      <select value={filter === "all" ? "all" : filter} onChange={e => setFilter(e.target.value === "all" ? "all" : Number(e.target.value))} style={{ ...iStyle, marginBottom: 20 }}>
        <option value="all">Barcha quizlar</option>
        {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
      </select>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>⏳</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, backgroundColor: "#1e293b", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: 40 }}>📊</p>
          <p style={{ fontWeight: 700, color: "#f1f5f9" }}>Hali natijalar yo'q</p>
        </div>
      ) : (
        <div style={{ backgroundColor: "#1e293b", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
          {filtered.map((r, i) => {
            const pct = Math.round((r.score / r.total) * 100);
            const quiz = quizzes.find(q => q.id === r.quiz_id);
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 18px", borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", backgroundColor: i === 0 ? "rgba(245,158,11,0.08)" : "transparent" }}>
                <span style={{ fontSize: i < 3 ? 24 : 16, fontWeight: 700, color: "#64748b", minWidth: 32, textAlign: "center" as const }}>
                  {i < 3 ? medals[i] : `${i + 1}.`}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, color: "#f1f5f9", margin: "0 0 2px", fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.username}</p>
                  <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{quiz?.title || "Quiz"}</p>
                </div>
                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                  <p style={{ fontWeight: 800, color: "#14b8a6", margin: "0 0 1px", fontSize: 16 }}>{r.score}/{r.total}</p>
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

const iStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.08)",
  fontSize: 15,
  outline: "none",
  backgroundColor: "#0f172a",
  color: "#f1f5f9",
  boxSizing: "border-box",
};

const bStyle: React.CSSProperties = {
  backgroundColor: "#0f766e",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "14px 28px",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
  width: "100%",
};

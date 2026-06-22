"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Section = "Home" | "Kitoblar" | "Taqrizlar" | "Quiz" | "Tadbirlar";

type Leader = {
  id: string;
  fullName: string;
  position: string;
  biography: string;
  photoUrl: string;
  socials: Array<{ label: string; url: string }>;
};

type ReviewSummary = {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  rating: number;
  category: string;
  tags: string[];
  excerpt: string;
};

type QuizSummary = {
  id: string;
  title: string;
  type: string;
  questions: number;
  durationMinutes: number;
  points: number;
  status: "draft" | "scheduled" | "live" | "published" | "archived";
};

type EventSummary = {
  id: string;
  title: string;
  date: string;
  location: string;
  kind: string;
};

// ─── Static Data ─────────────────────────────────────────────────────────────

const leaders: Leader[] = [
  {
    id: "founder",
    fullName: "BIR ILM Asoschisi",
    position: "Asoschi",
    biography: "Jamoa ko'rgazmasini, hamkorliklarni va uzoq muddatli o'qish madaniyatini qurishni amalga oshiradi.",
    photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80",
    socials: [{ label: "Telegram", url: "https://t.me/birilm1" }],
  },
  {
    id: "president",
    fullName: "Jamoa Prezidenti",
    position: "Prezident",
    biography: "Haftalik muhokamalar, a'zolarni qabul qilish va jamoat dasturlarini muvofiqlashtiradi.",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
    socials: [{ label: "Instagram", url: "https://instagram.com/birilm_" }],
  },
  {
    id: "quiz-lead",
    fullName: "Quiz Koordinatori",
    position: "Kitob Klubi Koordinatori",
    biography: "Kitob, til, TOPIK, IT va kiberkimxavfsizlik bo'yicha quiz tajribalarini loyihalaydi.",
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80",
    socials: [{ label: "Telegram", url: "https://t.me/birilm1" }],
  },
];

const reviews: ReviewSummary[] = [
  {
    id: "atomic-habits",
    title: "Atomic Habits",
    author: "James Clear",
    coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=500&q=80",
    rating: 4.8,
    category: "O'z-o'zini rivojlantirish",
    tags: ["odatlar", "intizom", "o'sish"],
    excerpt: "Kichik yaxshilanishlarni ko'rinadigan natijaga aylantirish uchun amaliy xarita.",
  },
  {
    id: "deep-work",
    title: "Deep Work",
    author: "Cal Newport",
    coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=500&q=80",
    rating: 4.6,
    category: "Biznes",
    tags: ["diqqat", "o'qish", "martaba"],
    excerpt: "Darslar, ish va jamoa rahbarligini muvozanatlash uchun kuchli tanlov.",
  },
  {
    id: "psychology-money",
    title: "The Psychology of Money",
    author: "Morgan Housel",
    coverUrl: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=500&q=80",
    rating: 4.7,
    category: "Psixologiya",
    tags: ["pul", "xulq", "tanlovlar"],
    excerpt: "Uzoq muddatli fikrlash va moliyaviy qaror qabul qilishga qulay kirish.",
  },
];

const quizzes: QuizSummary[] = [
  { id: "book-sprint", title: "Kitob Sprint Quiz", type: "Kitob", questions: 20, durationMinutes: 15, points: 250, status: "live" },
  { id: "topik-builder", title: "TOPIK Builder", type: "TOPIK", questions: 30, durationMinutes: 25, points: 400, status: "scheduled" },
  { id: "cyber-basics", title: "Kiberkimxavfsizlik Asoslari", type: "Kiberkimxavfsizlik", questions: 18, durationMinutes: 12, points: 220, status: "draft" },
];

const events: EventSummary[] = [
  { id: "weekly", title: "Haftalik Kitob Muhokamasi", date: "Shanba", location: "Seul + Telegram", kind: "Muhokama" },
  { id: "challenge", title: "30 Kunlik O'qish Tanlovhi", date: "Oylik", location: "Mini App", kind: "Tanlov" },
  { id: "seminar", title: "Talaba O'sish Seminari", date: "Choraklik", location: "Koreya", kind: "Seminar" },
];

// ─── Telegram helpers ─────────────────────────────────────────────────────────

function getTelegramApp() {
  if (typeof window === "undefined") return null;
  return (window as any).Telegram?.WebApp ?? null;
}

function bootTelegramMiniApp() {
  const app = getTelegramApp();
  if (!app) return false;
  app.ready();
  app.expand();
  return true;
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const sections: Section[] = ["Home", "Kitoblar", "Taqrizlar", "Quiz", "Tadbirlar"];

export default function Home() {
  const [active, setActive] = useState<Section>("Home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    setIsTelegram(bootTelegramMiniApp());
  }, []);

  const filteredReviews = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return reviews;
    return reviews.filter((r) =>
      [r.title, r.author, r.category, ...r.tags].some((v) => v.toLowerCase().includes(needle))
    );
  }, [query]);

  const telegramUser = getTelegramApp()?.initDataUnsafe?.user;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc", color: "#0f172a" }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, borderBottom: "1px solid #e2e8f0", backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer" }} onClick={() => setActive("Home")}>
            <span style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: "#0f766e", color: "#fff", fontWeight: 900, fontSize: 16, display: "grid", placeItems: "center" }}>BI</span>
            <span style={{ textAlign: "left" }}>
              <span style={{ display: "block", fontWeight: 900, fontSize: 16, letterSpacing: "0.05em", color: "#14213d" }}>BIR ILM</span>
              <span style={{ display: "block", fontSize: 11, color: "#64748b", fontWeight: 500 }}>Bilimlar Markazi</span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav style={{ display: "flex", gap: 4 }} className="desktop-nav">
            {sections.map((s) => (
              <button key={s} onClick={() => setActive(s)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, backgroundColor: active === s ? "#f0fdfa" : "transparent", color: active === s ? "#0f766e" : "#475569", transition: "all 0.2s" }}>
                {s}
              </button>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isTelegram && (
              <span style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                Telegram {telegramUser?.first_name ? `— ${telegramUser.first_name}` : "Mini App"}
              </span>
            )}
            <a href="https://t.me/birilm1" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#14213d", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              💬 Telegram
            </a>
            {/* Burger */}
            <button onClick={() => setMenuOpen((v) => !v)} style={{ display: "none", background: "none", border: "none", cursor: "pointer", fontSize: 22 }} className="burger-btn">☰</button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ borderTop: "1px solid #e2e8f0", backgroundColor: "#fff", padding: "8px 16px 16px" }}>
            {sections.map((s) => (
              <button key={s} onClick={() => { setActive(s); setMenuOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#374151", backgroundColor: "transparent" }}>
                {s}
              </button>
            ))}
          </div>
        )}
      </header>

      <main>
        {active === "Home" && <HomePage setActive={setActive} />}
        {active === "Kitoblar" && <KitoblarPage />}
        {active === "Taqrizlar" && <TaqrizlarPage query={query} setQuery={setQuery} filteredReviews={filteredReviews} />}
        {active === "Quiz" && <QuizPage />}
        {active === "Tadbirlar" && <TadbirlarPage />}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e2e8f0", padding: "24px 16px", marginTop: 48, textAlign: "center" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>© 2025 Bir Ilm. Barcha huquqlar himoyalangan.</span>
          <a href="https://t.me/Avrangzeb_Abdujalilov" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#94a3b8", textDecoration: "none" }}>@Usman dev</a>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .burger-btn { display: block !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────

function HomePage({ setActive }: { setActive: (s: Section) => void }) {
  return (
    <>
      {/* Hero */}
      <section style={{ backgroundColor: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 16px", display: "grid", gap: 40, gridTemplateColumns: "1fr" }}>
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#f0fdfa", color: "#0f766e", padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
              ✨ Koreyadagi O'zbek Talabalar
            </span>
            <h1 style={{ fontSize: "clamp(36px, 6vw, 60px)", fontWeight: 900, color: "#14213d", lineHeight: 1.1, margin: "0 0 16px" }}>BIR ILM</h1>
            <p style={{ fontSize: 18, color: "#475569", lineHeight: 1.7, maxWidth: 560, margin: "0 0 32px" }}>
              O'qish, tanqidiy fikrlash, muhokama va birgalikda o'sish uchun zamonaviy ta'lim va kitob klubi hamjamiyati.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => setActive("Quiz")} style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "#0f766e", color: "#fff", padding: "12px 24px", borderRadius: 8, fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer" }}>
                Quiz Boshlash 🏆
              </button>
              <button onClick={() => setActive("Kitoblar")} style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "transparent", color: "#14213d", padding: "12px 24px", borderRadius: 8, fontWeight: 700, fontSize: 15, border: "2px solid #e2e8f0", cursor: "pointer" }}>
                Kutubxona 📚
              </button>
              <a href="/books" style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "transparent", color: "#0f766e", padding: "12px 24px", borderRadius: 8, fontWeight: 700, fontSize: 15, border: "2px solid #0f766e", cursor: "pointer", textDecoration: "none" }}>
                Kitob Taqrizlari →
              </a>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {[["1K+", "A'zolar"], ["120+", "Taqrizlar"], ["40+", "Tadbirlar"], ["25K", "Quiz ballari"]].map(([v, l]) => (
              <div key={l} style={{ backgroundColor: "#f8fafc", borderRadius: 12, padding: 20, textAlign: "center", border: "1px solid #e2e8f0" }}>
                <p style={{ fontSize: 28, fontWeight: 900, color: "#14213d", margin: 0 }}>{v}</p>
                <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0", fontWeight: 600 }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          <FeatureCard icon="📖" title="Birga O'qing" text="Kitob klublari, taqrizlar, o'qish jarayoni va oylik musobaqalar." />
          <FeatureCard icon="🏆" title="Do'stona Raqobat" text="Jonli quizlar, ballar, seriyalar, nishonlar va ochiq reytinglar." />
          <FeatureCard icon="👥" title="Jamoa O'sishi" text="Tadbirlar, eslatmalar, seminarlar va Telegram orqali aloqa." />
        </div>
        
      </section>

      {/* Mission */}
      <section style={{ backgroundColor: "#fff", padding: "40px 16px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          <StatementCard title="Missiya" text="O'qishni, tanqidiy fikrlashni, muhokamani, o'z-o'zini rivojlantirishni va talabalar o'rtasida bilim almashishni rag'batlantirish." />
          <StatementCard title="Maqsad" text="BIR ILM jamoasi o'rganadigan, raqobatlashadigan, fikrlaydigan va bir-birini qo'llab-quvvatlaydigan markaziy raqamli platforma bo'lish." />
        </div>
      </section>
    </>
  );
}

// ─── Kitoblar Page ────────────────────────────────────────────────────────────

function KitoblarPage() {
  return (
    <PageWrapper title="Kitob Kutubxonasi" subtitle="PDF ruxsatlari, kategoriyalar, yuklamalar va o'qish jarayoni bilan raqamli katalog.">
      <div style={{ display: "grid", gap: 16 }}>
        {reviews.map((book, i) => (
          <div key={book.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 16, padding: 16, backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", alignItems: "center" }}>
            <img src={book.coverUrl} alt={book.title} style={{ width: 72, height: 96, objectFit: "cover", borderRadius: 6 }} />
            <div>
              <p style={{ fontWeight: 900, color: "#14213d", margin: "0 0 4px", fontSize: 16 }}>{book.title}</p>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px" }}>{book.author} — {book.category}</p>
              <div style={{ height: 6, borderRadius: 3, backgroundColor: "#f1f5f9", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, backgroundColor: "#0f766e", width: `${35 + i * 22}%` }} />
              </div>
            </div>
            <button style={{ backgroundColor: "#f1f5f9", color: "#14213d", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
              PDF So'rash
            </button>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}

// ─── Taqrizlar Page ───────────────────────────────────────────────────────────

function TaqrizlarPage({ query, setQuery, filteredReviews }: { query: string; setQuery: (v: string) => void; filteredReviews: ReviewSummary[] }) {
  return (
    <PageWrapper title="Kitob Taqrizlari" subtitle="Qidiruv, reyting, kategoriyalar va teglar bilan a'zo taqrizlari.">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", backgroundColor: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 24 }}>
        <span style={{ fontSize: 18 }}>🔍</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Sarlavha, muallif, kategoriya yoki teg bo'yicha qidiring" style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#374151", backgroundColor: "transparent" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {filteredReviews.map((r) => (
          <article key={r.id} style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 20px rgba(15,23,42,0.06)" }}>
            <img src={r.coverUrl} alt={r.title} style={{ width: "100%", height: 200, objectFit: "cover" }} />
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ backgroundColor: "#fefce8", color: "#92400e", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{r.category}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#14213d" }}>⭐ {r.rating}</span>
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: "#14213d", margin: "0 0 4px" }}>{r.title}</h2>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 10px" }}>{r.author}</p>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "#475569", margin: 0 }}>{r.excerpt}</p>
            </div>
          </article>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <a href="/books" style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "#0f766e", color: "#fff", padding: "12px 28px", borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
          Barcha Taqrizlarni Ko'rish →
        </a>
      </div>
    </PageWrapper>
  );
}

// ─── Quiz Page ────────────────────────────────────────────────────────────────

function QuizPage() {
  const statusColor: Record<string, string> = { live: "#dcfce7", scheduled: "#dbeafe", draft: "#f1f5f9" };
  const statusText: Record<string, string> = { live: "#166534", scheduled: "#1e40af", draft: "#64748b" };
  const statusLabel: Record<string, string> = { live: "Jonli", scheduled: "Rejalashtirilgan", draft: "Qoralama" };

  return (
    <PageWrapper title="BIR ILM QUIZ" subtitle="Jonli musobaqalar, tarix, ball, reyting va admin yaratish uchun quiz tizimi.">
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
        {/* CTA */}
        <section style={{ backgroundColor: "#14213d", borderRadius: 12, padding: 24, color: "#fff", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#99f6e4", margin: "0 0 8px" }}>Jonli modul</p>
            <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Quizga qo'shiling, ball to'lang, reytingda ko'taring.</h2>
          </div>
          <a href="https://t.me/bir_ilm_uz_bot" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "#f59e0b", color: "#14213d", padding: "12px 24px", borderRadius: 8, fontWeight: 900, fontSize: 15, textDecoration: "none" }}>
            Jonli Quizga Kirish 🏆
          </a>
        </section>

        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          <MetricCard icon="👥" label="Ishtirokchilar" value="1,284" />
          <MetricCard icon="📊" label="O'rtacha ball" value="78%" />
          <MetricCard icon="✅" label="Yakunlash" value="91%" />
        </div>

        {/* Quiz catalog */}
        <section style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "#14213d", margin: "0 0 16px" }}>Quiz Katalogi</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {quizzes.map((q) => (
              <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ backgroundColor: statusColor[q.status] ?? "#f1f5f9", color: statusText[q.status] ?? "#64748b", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{statusLabel[q.status] ?? q.status}</span>
                    <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{q.type}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: "#14213d", margin: "0 0 4px" }}>{q.title}</h3>
                  <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{q.questions} savol — {q.durationMinutes} daqiqa — {q.points} XP</p>
                </div>
                <button style={{ backgroundColor: "#f0fdfa", color: "#0f766e", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 900, fontSize: 14, cursor: "pointer" }}>Ochish</button>
              </div>
            ))}
          </div>
        </section>

        {/* Gamification */}
        <section style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: "#14213d", margin: "0 0 12px" }}>🎮 Gamifikatsiya</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {["Tajriba ballari", "Nishonlar", "Yutuqlar", "O'qish seriyalari", "Quiz seriyalari", "Reyting jadvallari"].map((item) => (
              <p key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "#374151", margin: 0 }}>
                🏅 {item}
              </p>
            ))}
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}

// ─── Tadbirlar Page ───────────────────────────────────────────────────────────

function TadbirlarPage() {
  return (
    <PageWrapper title="Tadbirlar" subtitle="Muhokamalar, musobaqalar, seminarlar va ustaxonalar uchun jamoa dasturlash.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {events.map((e) => (
          <article key={e.id} style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20, boxShadow: "0 4px 20px rgba(15,23,42,0.06)" }}>
            <span style={{ fontSize: 28 }}>📅</span>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "#14213d", margin: "12px 0 6px" }}>{e.title}</h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 8px" }}>{e.kind} — {e.date}</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>{e.location}</p>
          </article>
        ))}
      </div>
    </PageWrapper>
  );
}

// ─── Reusable Components ──────────────────────────────────────────────────────

function PageWrapper({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 16px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 900, color: "#14213d", margin: "0 0 8px" }}>{title}</h1>
        <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.6, maxWidth: 680, margin: 0 }}>{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function FeatureCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <article style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20, boxShadow: "0 4px 20px rgba(15,23,42,0.06)" }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: "#14213d", margin: "0 0 8px" }}>{title}</h2>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: "#475569", margin: 0 }}>{text}</p>
    </article>
  );
}

function StatementCard({ title, text }: { title: string; text: string }) {
  return (
    <article style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: "#14213d", margin: "0 0 10px" }}>{title}</h2>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: "#475569", margin: 0 }}>{text}</p>
    </article>
  );
}

function MetricCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <article style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 900, color: "#14213d", margin: 0 }}>{value}</p>
    </article>
  );
}

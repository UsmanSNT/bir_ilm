import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = "8494041333:AAFdo8mMh6ISUeSyrpsvQDIARPUW8XnYWqU";
const CHANNEL_ID = "@Abdujalilov_Avrangzeb";
const SUPABASE_URL = "https://oynqygopnfowjylshuji.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bnF5Z29wbmZvd2p5bHNodWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODA5NjMsImV4cCI6MjA4MDE1Njk2M30.ipNJx3jh_h8I_rqWy_sgddEsyvf8KkuOZ3th0GPVV5U";

async function sendBot(text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHANNEL_ID, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
}

async function supabase(table: string, query = "", body?: object, method = "GET") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": method === "PATCH" ? "return=minimal" : "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return []; }
}

export async function GET(req: NextRequest) {
  const now = new Date();
  const nowMs = now.getTime();

  // Rejalashtirilgan, hali boshlanmagan quizlarni ol
  // start_time bor, is_active = true
  const quizzes = await supabase(
    "quizzes",
    "?is_active=eq.true&start_time=not.is.null&order=start_time.asc"
  );

  if (!Array.isArray(quizzes) || quizzes.length === 0) {
    return NextResponse.json({ ok: true, checked: 0 });
  }

  const results: string[] = [];

  for (const quiz of quizzes) {
    const startMs = new Date(quiz.start_time).getTime();
    const diffMs = startMs - nowMs;
    const diffMin = diffMs / 60000;

    // Format vaqt (UTC+5)
    const startLocal = new Date(startMs + 5 * 60 * 60 * 1000);
    const formatted = `${startLocal.getUTCDate().toString().padStart(2,"0")}.${(startLocal.getUTCMonth()+1).toString().padStart(2,"0")}.${startLocal.getUTCFullYear()} ${startLocal.getUTCHours().toString().padStart(2,"0")}:${startLocal.getUTCMinutes().toString().padStart(2,"0")}`;

    // 1 soat oldin (55-65 daqiqa oralig'ida bir marta)
    if (diffMin >= 55 && diffMin < 65) {
      const alreadySent = quiz.notified_1h === true;
      if (!alreadySent) {
        await sendBot(
`⏰ <b>Quiz 1 soatdan keyin boshlanadi!</b>

📌 <b>${quiz.title}</b>
🕐 Vaqt: <b>${formatted}</b> (O'zbekiston)
📝 ${quiz.description || "Tayyorlanishni boshlang!"}

<a href="https://bir-ilm.vercel.app">Bir Ilm</a> ga kiring va tayyorlaning! 💪`
        );
        await supabase("quizzes", `?id=eq.${quiz.id}`, { notified_1h: true }, "PATCH");
        results.push(`1h notify: ${quiz.title}`);
      }
    }

    // 2 daqiqa oldin (1-3 daqiqa oralig'ida)
    if (diffMin >= 1 && diffMin < 3) {
      const alreadySent = quiz.notified_2m === true;
      if (!alreadySent) {
        await sendBot(
`🚨 <b>Quiz 2 daqiqadan keyin boshlanadi!</b>

📌 <b>${quiz.title}</b>
⚡ Hoziroq <a href="https://bir-ilm.vercel.app">Bir Ilm</a> ga kiring!`
        );
        await supabase("quizzes", `?id=eq.${quiz.id}`, { notified_2m: true }, "PATCH");
        results.push(`2m notify: ${quiz.title}`);
      }
    }

    // Vaqt keldi — quiz ochilsin (0 dan -2 daqiqa oralig'ida)
    if (diffMin <= 0 && diffMin > -2) {
      const alreadyStarted = quiz.notified_start === true;
      if (!alreadyStarted) {
        await sendBot(
`🎯 <b>Quiz boshlandi!</b>

📌 <b>${quiz.title}</b>

Hoziroq ishtirok eting 👇
<a href="https://bir-ilm.vercel.app">bir-ilm.vercel.app</a>`
        );
        await supabase("quizzes", `?id=eq.${quiz.id}`, { notified_start: true }, "PATCH");
        results.push(`started: ${quiz.title}`);
      }
    }
  }

  return NextResponse.json({ ok: true, checked: quizzes.length, results });
}

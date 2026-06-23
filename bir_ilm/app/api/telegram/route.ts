import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = "8494041333:AAFdo8mMh6ISUeSyrpsvQDIARPUW8XnYWqU";
const CHANNEL_ID = "@birilm1";
const SUPABASE_URL = "https://oynqygopnfowjylshuji.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bnF5Z29wbmZvd2p5bHNodWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODA5NjMsImV4cCI6MjA4MDE1Njk2M30.ipNJx3jh_h8I_rqWy_sgddEsyvf8KkuOZ3th0GPVV5U";

const FOOTER = `\n\n[Telegram](https://t.me/birilm1) | [Instagram](https://instagram.com/birilm_?i) | [Facebook](https://www.facebook.com/birilmpage) | [YouTube](https://youtube.com/@birilm5928?si=NgPMJKosE2pM3fx4)`;

// Pending posts (scheduled) - in-memory (resets on redeploy, ok for MVP)
const pendingPosts: Record<string, { text: string; chatId: number; sendAt: number }> = {};

async function sendTelegram(chatId: number | string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown", disable_web_page_preview: false }),
  });
}

async function saveWeeklyBook(text: string) {
  // Parse post format: #hafta_kitobi 230-kitob ... Tanlangan: "..." Muallif: ... Sana: ...
  const numMatch = text.match(/№\s*(\d+)/);
  const titleMatch = text.match(/Tanlangan:\s*"([^"]+)"/);
  const authorMatch = text.match(/Muallif:\s*([^\n]+)/);
  const dateMatch = text.match(/Sana:\s*([^\n]+)/);
  const audioMatch = text.match(/\[bu yerda\]\(([^)]+)\)/);

  if (!titleMatch) return;

  await fetch(`${SUPABASE_URL}/rest/v1/weekly_books`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      book_number: numMatch ? parseInt(numMatch[1]) : null,
      title: titleMatch[1],
      author: authorMatch ? authorMatch[1].trim() : null,
      discussion_date: dateMatch ? dateMatch[1].trim() : null,
      audio_link: audioMatch ? audioMatch[1] : null,
      raw_text: text,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text || "";
    const userId = message.from?.id;

    // Admin tekshirish (Supabase dan)
    const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users?select=role&id=eq.${userId}`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
    });
    const users = await userRes.json();
    const isAdmin = users?.[0]?.role === "admin" || users?.[0]?.role === "super_admin";

    // /start
    if (text === "/start") {
      await sendTelegram(chatId, `Salom! BIR ILM boti.\n\n${isAdmin ? "Admin buyruqlari:\n/post - Kanalga post yuborish\n/schedule - Vaqt belgilab post yuborish\n/kitoblar - Kitoblar ro'yxati" : "Botdan foydalanish uchun tizimga kiring."}`);
      return NextResponse.json({ ok: true });
    }

    // /kitoblar - kitoblar ro'yxati
    if (text === "/kitoblar") {
      const booksRes = await fetch(`${SUPABASE_URL}/rest/v1/weekly_books?select=book_number,title,author,discussion_date&order=book_number.desc&limit=20`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
      });
      const books = await booksRes.json();
      if (!books || books.length === 0) {
        await sendTelegram(chatId, "Hali kitoblar yo'q.");
      } else {
        const list = books.map((b: any) => `📚 *${b.book_number}-kitob*: ${b.title}\n👤 ${b.author || "—"}\n📅 ${b.discussion_date || "—"}`).join("\n\n");
        await sendTelegram(chatId, `*So'nggi kitoblar:*\n\n${list}`);
      }
      return NextResponse.json({ ok: true });
    }

    if (!isAdmin) {
      await sendTelegram(chatId, "Siz admin emassiz.");
      return NextResponse.json({ ok: true });
    }

    // /post - kanalga post yuborish
    if (text.startsWith("/post ")) {
      const postText = text.replace("/post ", "").trim();
      const fullText = postText + FOOTER;
      await sendTelegram(CHANNEL_ID, fullText);
      await saveWeeklyBook(postText);
      await sendTelegram(chatId, "✅ Post kanalga yuborildi!");
      return NextResponse.json({ ok: true });
    }

    // /schedule - vaqt belgilab yuborish
    // Format: /schedule 30 <post matni> (30 daqiqadan keyin)
    if (text.startsWith("/schedule ")) {
      const parts = text.replace("/schedule ", "").split("\n");
      const minutes = parseInt(parts[0]);
      const postText = parts.slice(1).join("\n").trim();

      if (isNaN(minutes) || !postText) {
        await sendTelegram(chatId, "Format:\n/schedule\n30\nPost matni bu yerga\n\n(30 - daqiqalar soni)");
        return NextResponse.json({ ok: true });
      }

      const sendAt = Date.now() + minutes * 60 * 1000;
      const key = `${chatId}_${sendAt}`;
      pendingPosts[key] = { text: postText + FOOTER, chatId, sendAt };

      // Check and send pending posts
      for (const [k, p] of Object.entries(pendingPosts)) {
        if (p.sendAt <= Date.now()) {
          await sendTelegram(CHANNEL_ID, p.text);
          await saveWeeklyBook(p.text);
          delete pendingPosts[k];
        }
      }

      const sendTime = new Date(sendAt).toLocaleTimeString("uz-UZ");
      await sendTelegram(chatId, `⏰ Post ${minutes} daqiqadan keyin (${sendTime}) kanalga yuboriladi!\n\nMatn:\n${postText}`);
      return NextResponse.json({ ok: true });
    }

    // Kanal postini saqlash (#hafta_kitobi)
    if (text.includes("#hafta_kitobi")) {
      await saveWeeklyBook(text);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: true });
  }
}

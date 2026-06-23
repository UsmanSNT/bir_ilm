import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = "8494041333:AAFdo8mMh6ISUeSyrpsvQDIARPUW8XnYWqU";
const CHANNEL_ID = "@birilm1";
const SUPABASE_URL = "https://oynqygopnfowjylshuji.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bnF5Z29wbmZvd2p5bHNodWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODA5NjMsImV4cCI6MjA4MDE1Njk2M30.ipNJx3jh_h8I_rqWy_sgddEsyvf8KkuOZ3th0GPVV5U";

const FOOTER = `\n\nTelegram: https://t.me/birilm1 | Instagram: https://instagram.com/birilm_ | Facebook: https://www.facebook.com/birilmpage | YouTube: https://youtube.com/@birilm5928`;

// Pending confirmations: chatId -> post text
const pendingConfirm: Record<number, string> = {};

async function sendTelegram(chatId: number | string, text: string, reply_markup?: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: false,
      ...(reply_markup ? { reply_markup } : {}),
    }),
  });
}

async function saveWeeklyBook(text: string) {
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

async function isAdmin(telegramId: number): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=role&telegram_id=eq.${telegramId}`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
  });
  const data = await res.json();
  return data?.[0]?.role === "admin" || data?.[0]?.role === "super_admin";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Callback query (tugma bosilganda)
    if (body.callback_query) {
      const cb = body.callback_query;
      const chatId = cb.message.chat.id;
      const data = cb.data;
      const userId = cb.from.id;

      // Callback ack
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: cb.id }),
      });

      if (!await isAdmin(userId)) return NextResponse.json({ ok: true });

      const postText = pendingConfirm[chatId];
      if (!postText) {
        await sendTelegram(chatId, "❌ Post topilmadi. Qayta /post yozing.");
        return NextResponse.json({ ok: true });
      }

      if (data === "cancel") {
        delete pendingConfirm[chatId];
        await sendTelegram(chatId, "❌ Post bekor qilindi.");
        return NextResponse.json({ ok: true });
      }

      if (data === "now") {
        // Hozir yuborish
        await sendTelegram(CHANNEL_ID, postText + FOOTER);
        await saveWeeklyBook(postText);
        delete pendingConfirm[chatId];
        await sendTelegram(chatId, "✅ Post kanalga yuborildi!");
        return NextResponse.json({ ok: true });
      }

      // Vaqt tanlangan (daqiqalar)
      const minutes = parseInt(data);
      if (!isNaN(minutes)) {
        const sendAt = new Date(Date.now() + minutes * 60 * 1000);
        const timeStr = sendAt.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });

        // Supabase da scheduled_posts ga saqlash
        await fetch(`${SUPABASE_URL}/rest/v1/scheduled_posts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({
            text: postText + FOOTER,
            send_at: sendAt.toISOString(),
            chat_id: chatId,
            status: "pending",
          }),
        });

        delete pendingConfirm[chatId];
        await sendTelegram(chatId, `⏰ Post ${minutes} daqiqadan keyin (~${timeStr}) kanalga yuboriladi!\n\nEslatma: Vaqtli yuborish uchun /send_pending buyrug'ini o'sha vaqtda yuboring.`);
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    const message = body.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text || "";
    const userId = message.from?.id;

    // /start
    if (text === "/start") {
      await sendTelegram(chatId, `Salom! BIR ILM boti 📚\n\nBuyruqlar:\n/post — Kanalga post yuborish\n/kitoblar — Kitoblar ro'yxati\n/myid — Telegram ID\n/send_pending — Kutayotgan postlarni yuborish`);
      return NextResponse.json({ ok: true });
    }

    // /myid
    if (text === "/myid") {
      await sendTelegram(chatId, `Sizning Telegram ID: \`${userId}\``);
      return NextResponse.json({ ok: true });
    }

    // /kitoblar
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

    if (!await isAdmin(userId)) {
      await sendTelegram(chatId, `Siz admin emassiz.\nTelegram ID: \`${userId}\``);
      return NextResponse.json({ ok: true });
    }

    // /send_pending — pending postlarni yuborish
    if (text === "/send_pending") {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/scheduled_posts?status=eq.pending&send_at=lte.${new Date().toISOString()}&select=id,text,chat_id`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
      });
      const posts = await res.json();
      if (!posts || posts.length === 0) {
        await sendTelegram(chatId, "Yuborish vaqti kelgan post yo'q.");
        return NextResponse.json({ ok: true });
      }
      for (const post of posts) {
        await sendTelegram(CHANNEL_ID, post.text);
        await saveWeeklyBook(post.text);
        await fetch(`${SUPABASE_URL}/rest/v1/scheduled_posts?id=eq.${post.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({ status: "sent" }),
        });
        await sendTelegram(post.chat_id, "✅ Rejalashtirilgan post yuborildi!");
      }
      await sendTelegram(chatId, `✅ ${posts.length} ta post yuborildi!`);
      return NextResponse.json({ ok: true });
    }

    // /post
    if (text.startsWith("/post")) {
      const postText = text.replace(/^\/post[\s\n]?/, "").trim();
      if (!postText) {
        await sendTelegram(chatId, "Post matnini yozing:\n\n/post\nMatn bu yerga...");
        return NextResponse.json({ ok: true });
      }

      // Saqlash va tasdiqlash so'rash
      pendingConfirm[chatId] = postText;

      await sendTelegram(chatId,
        `📋 Post kozrinishi:\n\n${postText}\n\nTelegram: https://t.me/birilm1 | Instagram: https://instagram.com/birilm_ | Facebook: https://www.facebook.com/birilmpage | YouTube: https://youtube.com/@birilm5928\n\nYuborish vaqtini yozing (DD.MM.YYYY HH:MM):\nMasalan: 28.06.2026 18:00\nYoki: hozir | bekor`
      );
      return NextResponse.json({ ok: true });    }


    // Pending post uchun vaqt kiritilgan
    if (pendingConfirm[chatId]) {
      const postText = pendingConfirm[chatId];

      if (text.toLowerCase() === 'bekor') {
        delete pendingConfirm[chatId];
        await sendTelegram(chatId, '❌ Post bekor qilindi.');
        return NextResponse.json({ ok: true });
      }

      if (text.toLowerCase() === 'hozir') {
        await sendTelegram(CHANNEL_ID, postText + FOOTER);
        await saveWeeklyBook(postText);
        delete pendingConfirm[chatId];
        await sendTelegram(chatId, '✅ Post kanalga yuborildi!');
        return NextResponse.json({ ok: true });
      }

      // DD.MM.YYYY HH:MM formatini parse qilish
      const dm = text.match(/^(d{2}).(d{2}).(d{4})s+(d{2}):(d{2})$/);
      if (dm) {
        const [, dd, mm, yyyy, hh, min] = dm;
        const sendAt = new Date(yyyy+'-'+mm+'-'+dd+'T'+hh+':'+min+':00+05:00');
        if (isNaN(sendAt.getTime()) || sendAt < new Date()) {
          await sendTelegram(chatId, "❌ Noto'g'ri vaqt. Qayta kiriting:");
          return NextResponse.json({ ok: true });
        }
        await fetch(SUPABASE_URL+'/rest/v1/scheduled_posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer '+SUPABASE_KEY, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ text: postText + FOOTER, send_at: sendAt.toISOString(), chat_id: chatId, status: 'pending' }),
        });
        delete pendingConfirm[chatId];
        await sendTelegram(chatId, '✅ Post rejalashtirildi! ' + dd+'.'+mm+'.'+yyyy+' '+hh+':'+min+" (O'zbekiston) - /send_pending yozing.");
        return NextResponse.json({ ok: true });
      }

      await sendTelegram(chatId, "Format noto'g'ri. Masalan: 28.06.2026 18:00. Yoki: hozir yoki bekor");
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: true });
  }
}

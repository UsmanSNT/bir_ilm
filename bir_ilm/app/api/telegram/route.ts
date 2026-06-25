import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = "8494041333:AAFdo8mMh6ISUeSyrpsvQDIARPUW8XnYWqU";
const CHANNEL_ID = "@Abdujalilov_Avrangzeb";
const SUPABASE_URL = "https://oynqygopnfowjylshuji.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bnF5Z29wbmZvd2p5bHNodWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODA5NjMsImV4cCI6MjA4MDE1Njk2M30.ipNJx3jh_h8I_rqWy_sgddEsyvf8KkuOZ3th0GPVV5U";

const FOOTER = '\n\n<a href="https://t.me/birilm1">Telegram</a> | <a href="https://instagram.com/birilm_">Instagram</a> | <a href="https://www.facebook.com/birilmpage">Facebook</a> | <a href="https://youtube.com/@birilm5928">YouTube</a>';

const pendingConfirm: Record<number, string> = {};

async function sendTelegram(chatId: number | string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  });
}

async function sendTelegramWithButtons(chatId: number | string, text: string, buttons: {text: string, data?: string, url?: string}[][]) {
  const inline_keyboard = buttons.map(row =>
    row.map(btn => btn.url ? { text: btn.text, url: btn.url } : { text: btn.text, callback_data: btn.data })
  );
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: { inline_keyboard },
    }),
  });
}

function formatPost(text: string): string {
  return text
    .replace(/(Tanlangan:\s*)("[^"]+")/g, '$1<b>$2</b>')
    .replace(/(Muallif:\s*)([^\n]+)/g, '$1<b>$2</b>')
    .replace(/(Manzil:\s*)(Bir [Ii]lm)/g, '$1<a href="https://t.me/birilm1">$2</a>')
    .replace(/\[bu yerda\]\(([^)]+)\)/g, '<a href="$1">bu yerda</a>');
}

async function saveWeeklyBook(text: string) {
  const numMatch = text.match(/[No]\s*(\d+)/);
  const titleMatch = text.match(/Tanlangan:\s*"([^"]+)"/);
  const authorMatch = text.match(/Muallif:\s*([^\n]+)/);
  const dateMatch = text.match(/Sana:\s*([^\n]+)/);
  const audioMatch = text.match(/href="([^"]+)"[^>]*>bu yerda/);
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

    // Callback query (inline button bosilganda)
    if (body.callback_query) {
      const cq = body.callback_query;
      const cqChatId = cq.message.chat.id;
      const cqData = cq.data;

      // Answer callback to remove loading state
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: cq.id }),
      });

      if (cqData === "about") {
        await sendTelegramWithButtons(cqChatId,
`🌳 <b>Bir Ilm haqida</b>

Koreyada yashovchi o'zbek talabalari uchun bilim platformasi.

📚 <b>Veb sayt:</b>
• Kitob taqrizlari — har hafta yangi kitob
• Quiz — bilimni sinash
• Pomodor — diqqatni jamlash
• Dashboard — shaxsiy kabinet

🤖 <b>Bot:</b>
• Yangi taqrizlar haqida xabarnoma
• Kitoblar ro'yxati
• Quiz xabarlari

👥 <b>Hamjamiyat:</b> o'qish, o'sish, birga rivojlanish`,
          [[{ text: "🌐 Veb saytga o'tish", url: "https://bir-ilm.vercel.app" }],
           [{ text: "🔙 Orqaga", data: "back_start" }]]
        );
      }

      if (cqData === "kitoblar") {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/weekly_books?select=book_number,title,author&order=book_number.desc&limit=10`, {
          headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
        });
        const books = await res.json();
        if (!books || books.length === 0) {
          await sendTelegram(cqChatId, "Hali kitoblar yo'q.");
        } else {
          const list = books.map((b: any) => `📖 <b>${b.book_number}-kitob:</b> ${b.title}\n    <i>${b.author || ""}</i>`).join("\n\n");
          await sendTelegramWithButtons(cqChatId,
            `<b>📚 So'nggi kitoblar:</b>\n\n${list}`,
            [[{ text: "🌐 To'liq taqrizlar", url: "https://bir-ilm.vercel.app/pages/user.html" }],
             [{ text: "🔙 Orqaga", data: "back_start" }]]
          );
        }
      }

      if (cqData === "guide") {
        await sendTelegramWithButtons(cqChatId,
`📖 <b>Yo'riqnoma</b>

<b>Foydalanuvchi buyruqlari:</b>
/start — Botni ishga tushirish
/kitoblar — Kitoblar ro'yxati
/myid — Telegram ID

<b>Admin buyruqlari:</b> 🔒
/post — Kanalga post yuborish
/send_pending — Kutgan postlarni yuborish

<b>Post yuborish:</b>
1. /post Matn yozing
2. Vaqt kiriting: <code>28.06.2026 18:00</code>
   yoki: <code>hozir</code> / <code>bekor</code>`,
          [[{ text: "🌐 To'liq yo'riqnoma", url: "https://bir-ilm.vercel.app/pages/guide.html" }],
           [{ text: "🔙 Orqaga", data: "back_start" }]]
        );
      }

      if (cqData === "back_start") {
        const name = cq.from?.first_name || "Foydalanuvchi";
        await sendTelegramWithButtons(cqChatId,
`🌳 <b>Bir Ilm</b> ga xush kelibsiz, ${name}!

Bilim olish, kitob o'qish va birga o'sish platformasi.

Quyidagilardan birini tanlang:`,
          [
            [{ text: "📚 Kitoblar", data: "kitoblar" }, { text: "ℹ️ Haqida", data: "about" }],
            [{ text: "📖 Yo'riqnoma", data: "guide" }, { text: "🆔 Mening ID", data: "myid_cb" }],
            [{ text: "🌐 Veb saytga o'tish", url: "https://bir-ilm.vercel.app" }],
          ]
        );
      }

      if (cqData === "myid_cb") {
        await sendTelegramWithButtons(cqChatId,
          `🆔 Sizning Telegram ID: <code>${cq.from?.id}</code>`,
          [[{ text: "🔙 Orqaga", data: "back_start" }]]
        );
      }

      return NextResponse.json({ ok: true });
    }

    const message = body.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text || "";
    const userId = message.from?.id;
    const firstName = message.from?.first_name || "Foydalanuvchi";

    if (text === "/start") {
      // Foydalanuvchini bot_users ga saqlash
      await fetch(`${SUPABASE_URL}/rest/v1/bot_users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Prefer": "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          telegram_id: userId,
          username: message.from?.username || null,
          first_name: message.from?.first_name || null,
          last_seen: new Date().toISOString(),
        }),
      });
      await sendTelegramWithButtons(chatId,
`🌳 <b>Bir Ilm</b> ga xush kelibsiz, ${firstName}!

Bilim olish, kitob o'qish va birga o'sish platformasi.

Quyidagilardan birini tanlang:`,
        [
          [{ text: "📚 Kitoblar", data: "kitoblar" }, { text: "ℹ️ Haqida", data: "about" }],
          [{ text: "📖 Yo'riqnoma", data: "guide" }, { text: "🆔 Mening ID", data: "myid_cb" }],
          [{ text: "🌐 Veb saytga o'tish", url: "https://bir-ilm.vercel.app" }],
        ]
      );
      return NextResponse.json({ ok: true });
    }

    if (text === "/about") {
      await sendTelegramWithButtons(chatId,
`🌳 <b>Bir Ilm haqida</b>

Koreyada yashovchi o'zbek talabalari uchun bilim platformasi.

📚 Kitob taqrizlari • 🎯 Quiz • ⏱️ Pomodor • 👤 Dashboard`,
        [[{ text: "🌐 Veb saytga o'tish", url: "https://bir-ilm.vercel.app" }]]
      );
      return NextResponse.json({ ok: true });
    }

    if (text === "/myid") {
      await sendTelegram(chatId, `Sizning Telegram ID: ${userId}`);
      return NextResponse.json({ ok: true });
    }

    if (text === "/kitoblar") {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/weekly_books?select=book_number,title,author,discussion_date&order=book_number.desc&limit=20`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
      });
      const books = await res.json();
      if (!books || books.length === 0) {
        await sendTelegram(chatId, "Hali kitoblar yoq.");
      } else {
        const list = books.map((b: any) => `<b>${b.book_number}-kitob</b>: ${b.title}\n${b.author || ""}\n${b.discussion_date || ""}`).join("\n\n");
        await sendTelegram(chatId, `<b>Songi kitoblar:</b>\n\n${list}`);
      }
      return NextResponse.json({ ok: true });
    }

    if (!await isAdmin(userId)) {
      await sendTelegram(chatId, `Siz admin emassiz. Telegram ID: ${userId}`);
      return NextResponse.json({ ok: true });
    }

    if (text === "/send_pending") {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/scheduled_posts?status=eq.pending&send_at=lte.${new Date().toISOString()}&select=id,text,chat_id`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
      });
      const posts = await res.json();
      if (!posts || posts.length === 0) {
        await sendTelegram(chatId, "Yuborish vaqti kelgan post yoq.");
        return NextResponse.json({ ok: true });
      }
      for (const post of posts) {
        await sendTelegram(CHANNEL_ID, post.text);
        await saveWeeklyBook(post.text);
        await fetch(`${SUPABASE_URL}/rest/v1/scheduled_posts?id=eq.${post.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
          body: JSON.stringify({ status: "sent" }),
        });
      }
      await sendTelegram(chatId, `${posts.length} ta post yuborildi!`);
      return NextResponse.json({ ok: true });
    }

    if (text.startsWith("/post")) {
      const postText = text.replace(/^\/post[\s\n]?/, "").trim();
      if (!postText) {
        await sendTelegram(chatId, "Post matnini yozing:\n\n/post Matn bu yerga...");
        return NextResponse.json({ ok: true });
      }
      pendingConfirm[chatId] = postText;
      await sendTelegram(chatId, `Post kozrinishi:\n\n${postText}\n\nFooter: Telegram | Instagram | Facebook | YouTube\n\nYuborish vaqtini yozing (DD.MM.YYYY HH:MM)\nMasalan: 28.06.2026 18:00\nYoki: hozir | bekor`);
      return NextResponse.json({ ok: true });
    }

    if (pendingConfirm[chatId]) {
      const postText = pendingConfirm[chatId];

      if (text.toLowerCase() === "bekor") {
        delete pendingConfirm[chatId];
        await sendTelegram(chatId, "Post bekor qilindi.");
        return NextResponse.json({ ok: true });
      }

      if (text.toLowerCase() === "hozir") {
        await sendTelegram(CHANNEL_ID, formatPost(postText) + FOOTER);
        await saveWeeklyBook(postText);
        delete pendingConfirm[chatId];
        await sendTelegram(chatId, "Post kanalga yuborildi!");
        return NextResponse.json({ ok: true });
      }

      const dm = text.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);
      if (dm) {
        const [, dd, mm, yyyy, hh, min] = dm;
        const sendAt = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00+05:00`);
        if (isNaN(sendAt.getTime()) || sendAt < new Date()) {
          await sendTelegram(chatId, "Notogri vaqt yoki otgan vaqt. Qayta kiriting:");
          return NextResponse.json({ ok: true });
        }
        await fetch(`${SUPABASE_URL}/rest/v1/scheduled_posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Prefer": "return=minimal" },
          body: JSON.stringify({ text: formatPost(postText) + FOOTER, send_at: sendAt.toISOString(), chat_id: chatId, status: "pending" }),
        });
        delete pendingConfirm[chatId];
        await sendTelegram(chatId, `Post rejalashtirildi: ${dd}.${mm}.${yyyy} ${hh}:${min} (Ozbekiston)\n\nVaqt kelganda /send_pending yozing.`);
        return NextResponse.json({ ok: true });
      }

      await sendTelegram(chatId, "Format notogri. Masalan: 28.06.2026 18:00\nYoki: hozir | bekor");
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: true });
  }
}

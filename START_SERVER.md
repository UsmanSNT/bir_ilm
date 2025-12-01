# Server Ishga Tushirish Ko'rsatmasi

## "Failed to fetch" xatosini hal qilish

Agar siz "Failed to fetch" xatosini olayotgan bo'lsangiz, bu server ishlamayotganini anglatadi.

## Qadam-baqadam ko'rsatma:

### 1. Dependencies o'rnatish (birinchi marta)

Terminalda (PowerShell yoki CMD) quyidagi buyruqni ishga tushiring:

```bash
npm install
```

Bu buyruq barcha kerakli paketlarni o'rnatadi (express, sqlite3, bcryptjs va boshqalar).

### 2. Server ishga tushirish

Dependencies o'rnatilgandan keyin, server ishga tushirish:

```bash
npm start
```

Yoki development rejimida (avtomatik qayta yuklash):

```bash
npm run dev
```

### 3. Server ishlayotganini tekshirish

Server muvaffaqiyatli ishga tushganda, terminalda quyidagi xabarni ko'rasiz:

```
🚀 Server ishga tushdi: http://localhost:3000
📚 API: http://localhost:3000/api
🔐 Auth: http://localhost:3000/api/auth
📖 Books: http://localhost:3000/api/books
```

### 4. Brauzerda ochish

Server ishga tushgandan keyin, brauzerda quyidagi manzilni oching:

```
http://localhost:3000
```

## Muammolar va yechimlar:

### Muammo: "npm: command not found"
**Yechim:** Node.js o'rnatilmagan. [Node.js](https://nodejs.org/) ni o'rnating.

### Muammo: Port 3000 allaqachon ishlatilmoqda
**Yechim:** 
- Boshqa dastur port 3000 ni ishlatayotgan bo'lishi mumkin
- `.env` fayl yaratib, boshqa port belgilang: `PORT=3001`

### Muammo: "Cannot find module"
**Yechim:** 
```bash
npm install
```
buyrug'ini qayta ishga tushiring.

### Muammo: Database xatosi
**Yechim:** 
- `server/database.sqlite` fayl avtomatik yaratiladi
- Agar muammo bo'lsa, faylni o'chirib, serverni qayta ishga tushiring

## Eslatma:

**Server har doim ishga tushirilgan bo'lishi kerak!**

Agar server ishlamayotgan bo'lsa, frontend API bilan bog'lana olmaydi va "Failed to fetch" xatosi chiqadi.

Server ishga tushirilgandan keyin, terminalni yopmang - server ishlab turishi kerak.


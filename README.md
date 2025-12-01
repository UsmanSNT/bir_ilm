# Bir Ilm - Kitoblar Platformasi

"Bir ilm" bu dunyo va oxiratimizga foydasi tegadigan ilmlar maskanidir! Unda biz — barchamiz o'qib o'rgangan kitoblar, shaxsiy tajribamizda sinalgan bilimlarni ulashadigan maskan yaratamiz.

## 🚀 Xususiyatlar

- **Authentication tizimi** - Ro'yxatdan o'tish va tizimga kirish
- **Admin paneli** - Kitob taqrizlari yozish va boshqarish
- **Foydalanuvchi paneli** - Taqrizlarni ko'rish, like/dislike, izoh qoldirish
- **RESTful API** - Node.js + Express + SQLite
- **JWT Authentication** - Xavfsiz token asosida autentifikatsiya
- **Real-time yangilanishlar** - API orqali real-time ma'lumotlar

## 📋 Talablar

- Node.js (v14 yoki yuqori)
- npm yoki yarn

## 🔧 O'rnatish

1. **Dependencies o'rnatish:**
```bash
npm install
```

2. **Environment variables sozlash:**
`.env` fayl yaratish (ixtiyoriy, default qiymatlar ishlatiladi):
```
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_in_production
ADMIN_KEY=BIRILM_ADMIN_2024
```

3. **Server ishga tushirish:**
```bash
npm start
```

Yoki development rejimida (nodemon bilan):
```bash
npm run dev
```

4. **Brauzerda ochish:**
```
http://localhost:3000
```

## 📁 Loyiha Strukturasi

```
BirIlm1/
├── assets/
│   └── images/
│       └── logo.jpg
├── js/
│   ├── api.js          # API client
│   ├── auth.js         # (Eski - localStorage versiyasi)
│   └── books.js        # (Eski - localStorage versiyasi)
├── pages/
│   ├── admin.html      # Admin paneli
│   └── user.html       # Foydalanuvchi paneli
├── server/
│   ├── config/
│   │   └── database.js # SQLite database sozlash
│   ├── middleware/
│   │   └── auth.js     # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js     # Authentication routes
│   │   └── books.js    # Books routes
│   └── index.js        # Express server
├── index.html          # Login/Register sahifa
├── package.json
└── README.md
```

## 🔐 API Endpoints

### Authentication

- `POST /api/auth/register` - Ro'yxatdan o'tish
- `POST /api/auth/login` - Tizimga kirish
- `GET /api/auth/me` - Joriy foydalanuvchi ma'lumotlari

### Books

- `GET /api/books` - Barcha kitoblarni olish
- `POST /api/books` - Yangi kitob taqrizi yaratish (Admin)
- `DELETE /api/books/:id` - Kitobni o'chirish (Admin)
- `POST /api/books/:id/like` - Like qo'shish/olib tashlash
- `POST /api/books/:id/dislike` - Dislike qo'shish/olib tashlash
- `GET /api/books/:id/reaction` - Foydalanuvchi reaction holati
- `POST /api/books/:id/comments` - Izoh qo'shish

## 👤 Foydalanish

### Admin sifatida ro'yxatdan o'tish:

1. `index.html` sahifasida "Ro'yxatdan O'tish" tabini tanlang
2. "Admin sifatida ro'yxatdan o'tish" checkboxni belgilang
3. Admin taklif kalitini kiriting (default: `BIRILM_ADMIN_2024`)
4. Barcha maydonlarni to'ldiring va ro'yxatdan o'ting

### Oddiy foydalanuvchi sifatida:

1. "Ro'yxatdan O'tish" yoki "Tizimga Kirish" orqali kirish
2. Kitob taqrizlarini ko'rish
3. Like/Dislike qilish
4. Izoh qoldirish

## 🛠️ Texnologiyalar

- **Frontend:** HTML, CSS (Tailwind), JavaScript
- **Backend:** Node.js, Express.js
- **Database:** SQLite
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcryptjs

## 📝 Eslatmalar

- Parollar bcryptjs orqali hash qilinadi
- JWT tokenlar 7 kun muddatga amal qiladi
- SQLite database avtomatik yaratiladi (`server/database.sqlite`)
- Production uchun `.env` faylda `JWT_SECRET` ni o'zgartiring!

## 🤝 Yordam

Agar muammo bo'lsa yoki savol bo'lsa, loyiha egasiga murojaat qiling.

---

**Bismillahir Rohmanir Rohim**

*Biz bilan «bir ilm» ga bir qadam bosing. Biz bilan birga rivojlaning 💡*


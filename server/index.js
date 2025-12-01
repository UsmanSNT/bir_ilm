const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check (avval, boshqa route'lardan oldin)
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server ishlayapti!' });
});

// Routes - API yo'llarini avval qo'shish (static fayllardan oldin)
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);

// Static files (frontend) - API yo'llaridan keyin
app.use(express.static(path.join(__dirname, '..')));
// Uploads fayllarini serve qilish
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Frontend uchun barcha yo'llarni index.html ga yo'naltirish (SPA uchun)
// Faqat API bo'lmagan yo'llar uchun - eng oxirida
app.get('*', (req, res, next) => {
    // Agar API yo'li bo'lsa, 404 qaytarish (lekin bu holat bo'lmasligi kerak, chunki API route'lar yuqorida)
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: 'API endpoint topilmadi' });
    }
    // Agar uploads yo'li bo'lsa, next() qilish (static middleware handle qiladi)
    if (req.path.startsWith('/uploads/')) {
        return next();
    }
    // Frontend fayllarini serve qilish
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Server ishga tushirish
app.listen(PORT, () => {
    console.log(`\n🚀 Server ishga tushdi: http://localhost:${PORT}`);
    console.log(`📚 API: http://localhost:${PORT}/api`);
    console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
    console.log(`📖 Books: http://localhost:${PORT}/api/books\n`);
});


const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { generateToken, authenticateToken } = require('../middleware/auth');

const ADMIN_KEY = process.env.ADMIN_KEY || 'BIRILM_ADMIN_2024';

// Ro'yxatdan o'tish
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, isAdmin, adminKey } = req.body;

        // Validatsiya
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Barcha maydonlarni to\'ldiring!'
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Foydalanuvchi nomi kamida 3 belgi bo\'lishi kerak!'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Parol kamida 6 belgi bo\'lishi kerak!'
            });
        }

        // Admin kalitini tekshirish
        if (isAdmin && adminKey !== ADMIN_KEY) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri admin taklif kaliti!'
            });
        }

        // Foydalanuvchi mavjudligini tekshirish
        db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], async (err, user) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Server xatosi'
                });
            }

            if (user) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu foydalanuvchi nomi yoki email allaqachon mavjud!'
                });
            }

            // Parolni hash qilish
            const hashedPassword = await bcrypt.hash(password, 10);

            // Yangi foydalanuvchi yaratish
            const role = isAdmin ? 'admin' : 'user';
            db.run(
                'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
                [username, email, hashedPassword, role],
                function(err) {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Foydalanuvchi yaratishda xatolik'
                        });
                    }

                    const newUser = {
                        id: this.lastID,
                        username,
                        email,
                        role
                    };

                    const token = generateToken(newUser);

                    res.json({
                        success: true,
                        message: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz!',
                        user: newUser,
                        token
                    });
                }
            );
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server xatosi: ' + error.message
        });
    }
});

// Tizimga kirish
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Foydalanuvchi nomi va parolni kiriting!'
        });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Server xatosi'
            });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Noto\'g\'ri foydalanuvchi nomi yoki parol!'
            });
        }

        // Parolni tekshirish
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Noto\'g\'ri foydalanuvchi nomi yoki parol!'
            });
        }

        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        const token = generateToken(userData);

        res.json({
            success: true,
            message: 'Muvaffaqiyatli kirdingiz!',
            user: userData,
            token
        });
    });
});

// Joriy foydalanuvchi ma'lumotlari
router.get('/me', authenticateToken, (req, res) => {
    db.get('SELECT id, username, email, role, sum FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err || !user) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi'
            });
        }

        res.json({
            success: true,
            user
        });
    });
});

// Foydalanuvchining tangalarini olish
router.get('/points', authenticateToken, (req, res) => {
    db.get('SELECT sum FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err || !user) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi'
            });
        }

        res.json({
            success: true,
            sum: user.sum || 0
        });
    });
});

// Pomodoro uchun tanga qo'shish (25 daqiqa uchun 5 tanga)
router.post('/add-pomodoro-points', authenticateToken, (req, res) => {
    const pointsToAdd = 5; // 25 daqiqalik pomodoro uchun 5 tanga
    
    db.run(
        'UPDATE users SET sum = sum + ? WHERE id = ?',
        [pointsToAdd, req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Tanga qo\'shishda xatolik yuz berdi'
                });
            }

            // Yangi tangalar sonini olish
            db.get('SELECT sum FROM users WHERE id = ?', [req.user.id], (err, user) => {
                if (err || !user) {
                    return res.status(500).json({
                        success: false,
                        message: 'Tanga sonini olishda xatolik'
                    });
                }

                res.json({
                    success: true,
                    message: `${pointsToAdd} tanga qo'shildi!`,
                    sum: user.sum || 0,
                    added: pointsToAdd
                });
            });
        }
    );
});

module.exports = router;


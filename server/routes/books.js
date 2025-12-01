const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const db = require('../config/database');
const upload = require('../middleware/upload');
const path = require('path');

// Qidiruv (GET method - /api/books/search?q=...) - / dan oldin bo'lishi kerak
router.get('/search', (req, res) => {
    const { q } = req.query;

    console.log('Qidiruv so\'rovi:', q);

    // Bir harf kiritsa ham qidirish
    if (!q || q.trim().length === 0) {
        // Bo'sh qidiruv bo'lsa, barcha taqrizlarni qaytarish
        db.all(`
            SELECT 
                b.*,
                (SELECT COUNT(*) FROM likes WHERE book_id = b.id) as likes_count,
                (SELECT COUNT(*) FROM dislikes WHERE book_id = b.id) as dislikes_count,
                (SELECT COUNT(*) FROM comments WHERE book_id = b.id) as comments_count,
                COALESCE(b.views_count, 0) as views_count
            FROM books b
            ORDER BY b.created_at DESC
        `, (err, books) => {
            if (err) {
                console.error('Qidiruv (bo\'sh) SQL xatosi:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Qidiruvda xatolik'
                });
            }
            processBooks(books || [], res);
        });
        return;
    }

    const searchTerm = `%${q.trim()}%`;
    console.log('Qidiruv term:', searchTerm);

    db.all(`
        SELECT 
            b.*,
            (SELECT COUNT(*) FROM likes WHERE book_id = b.id) as likes_count,
            (SELECT COUNT(*) FROM dislikes WHERE book_id = b.id) as dislikes_count,
            (SELECT COUNT(*) FROM comments WHERE book_id = b.id) as comments_count,
            COALESCE(b.views_count, 0) as views_count
        FROM books b
        WHERE b.title LIKE ? OR b.author LIKE ? OR b.review LIKE ?
        ORDER BY b.created_at DESC
    `, [searchTerm, searchTerm, searchTerm], (err, books) => {
        if (err) {
            console.error('Qidiruv SQL xatosi:', err);
            return res.status(500).json({
                success: false,
                message: 'Qidiruvda xatolik'
            });
        }

        console.log('Qidiruv natijasi:', books ? books.length : 0, 'ta kitob');
        processBooks(books || [], res);
    });
});

// Top 10 ommabop kitoblarni olish (asosiy sahifa uchun)
router.get('/top', (req, res) => {
    db.all(`
        SELECT 
            b.*,
            (SELECT COUNT(*) FROM likes WHERE book_id = b.id) as likes_count,
            (SELECT COUNT(*) FROM dislikes WHERE book_id = b.id) as dislikes_count,
            (SELECT COUNT(*) FROM comments WHERE book_id = b.id) as comments_count,
            COALESCE(b.views_count, 0) as views_count,
            ((SELECT COUNT(*) FROM likes WHERE book_id = b.id) + 
             (SELECT COUNT(*) FROM dislikes WHERE book_id = b.id) + 
             (SELECT COUNT(*) FROM comments WHERE book_id = b.id) * 2) as popularity_score
        FROM books b
        ORDER BY popularity_score DESC, b.created_at DESC
        LIMIT 10
    `, (err, books) => {
        if (err) {
            console.error('getTop xatosi:', err);
            return res.status(500).json({
                success: false,
                message: 'Kitoblarni yuklashda xatolik'
            });
        }

        // Agar taqrizlar bo'sh bo'lsa yoki kam bo'lsa, barcha taqrizlarni qaytarish
        if (!books || books.length === 0) {
            db.all(`
                SELECT 
                    b.*,
                    (SELECT COUNT(*) FROM likes WHERE book_id = b.id) as likes_count,
                    (SELECT COUNT(*) FROM dislikes WHERE book_id = b.id) as dislikes_count,
                    (SELECT COUNT(*) FROM comments WHERE book_id = b.id) as comments_count
                FROM books b
                ORDER BY b.created_at DESC
            `, (err2, allBooks) => {
                if (err2) {
                    console.error('getTop getAll xatosi:', err2);
                    return res.status(500).json({
                        success: false,
                        message: 'Kitoblarni yuklashda xatolik'
                    });
                }
                processBooks(allBooks || [], res);
            });
            return;
        }

        // Agar 10 dan kam bo'lsa, qolgan taqrizlarni qo'shish
        if (books.length < 10) {
            db.all(`
                SELECT 
                    b.*,
                    (SELECT COUNT(*) FROM likes WHERE book_id = b.id) as likes_count,
                    (SELECT COUNT(*) FROM dislikes WHERE book_id = b.id) as dislikes_count,
                    (SELECT COUNT(*) FROM comments WHERE book_id = b.id) as comments_count,
                    COALESCE(b.views_count, 0) as views_count
                FROM books b
                ORDER BY b.created_at DESC
            `, (err2, allBooks) => {
                if (!err2 && allBooks && allBooks.length > 0) {
                    const topIds = new Set(books.map(b => b.id));
                    const remaining = allBooks.filter(b => !topIds.has(b.id));
                    books = [...books, ...remaining].slice(0, 10);
                }
                processBooks(books, res);
            });
            return;
        }

        processBooks(books, res);
    });
});

function processBooks(books, res) {
    if (!books || books.length === 0) {
        return res.json({
            success: true,
            books: []
        });
    }

    const booksWithComments = books.map((book) => {
        return new Promise((resolve) => {
            // Izohlarni olish
            db.all(
                'SELECT * FROM comments WHERE book_id = ? ORDER BY created_at DESC',
                [book.id],
                (err, comments) => {
                    if (err) {
                        book.comments = [];
                    } else {
                        book.comments = comments;
                    }

                    // O'rtacha baholashni hisoblash
                    db.all(
                        'SELECT rating FROM user_ratings WHERE book_id = ?',
                        [book.id],
                        (err, ratings) => {
                            if (!err && ratings && ratings.length > 0) {
                                const avgRating = (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1);
                                book.average_rating = parseFloat(avgRating);
                                book.total_ratings = ratings.length;
                            } else {
                                // Agar foydalanuvchi baholash bo'lmasa, admin baholashini ishlatish
                                book.average_rating = book.rating || 5;
                                book.total_ratings = 0;
                            }

                            // views_count ni saqlash (agar SQL so'rovda bo'lmasa)
                            if (book.views_count === undefined || book.views_count === null) {
                                book.views_count = 0;
                            }

                            resolve(book);
                        }
                    );
                }
            );
        });
    });

    Promise.all(booksWithComments).then(booksData => {
        res.json({
            success: true,
            books: booksData
        });
    }).catch(err => {
        console.error('processBooks xatosi:', err);
        res.status(500).json({
            success: false,
            message: 'Kitoblarni qayta ishlashda xatolik'
        });
    });
}

// Barcha kitoblarni olish
router.get('/', (req, res) => {
    db.all(`
        SELECT 
            b.*,
            (SELECT COUNT(*) FROM likes WHERE book_id = b.id) as likes_count,
            (SELECT COUNT(*) FROM dislikes WHERE book_id = b.id) as dislikes_count,
            (SELECT COUNT(*) FROM comments WHERE book_id = b.id) as comments_count,
            COALESCE(b.views_count, 0) as views_count
        FROM books b
        ORDER BY b.created_at DESC
    `, (err, books) => {
        if (err) {
            console.error('getAll xatosi:', err);
            return res.status(500).json({
                success: false,
                message: 'Kitoblarni yuklashda xatolik'
            });
        }

        if (!books || books.length === 0) {
            return res.json({
                success: true,
                books: []
            });
        }

        // Har bir kitob uchun izohlarni olish
        const booksWithComments = books.map((book) => {
            return new Promise((resolve) => {
                db.all(
                    'SELECT * FROM comments WHERE book_id = ? ORDER BY created_at DESC',
                    [book.id],
                    (err, comments) => {
                        if (err) {
                            book.comments = [];
                        } else {
                            book.comments = comments || [];
                        }
                        resolve(book);
                    }
                );
            });
        });

        Promise.all(booksWithComments).then(booksData => {
            res.json({
                success: true,
                books: booksData
            });
        }).catch(err => {
            console.error('getAll processBooks xatosi:', err);
            res.status(500).json({
                success: false,
                message: 'Kitoblarni qayta ishlashda xatolik'
            });
        });
    });
});

// File upload endpoint
router.post('/upload', authenticateToken, requireAdmin, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Fayl yuklanmadi'
        });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({
        success: true,
        image_url: imageUrl,
        message: 'Rasm muvaffaqiyatli yuklandi'
    });
});

// Yangi kitob taqrizi yaratish (faqat admin)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
    const { title, author, review, rating, image_url } = req.body;

    if (!title || !author || !review) {
        return res.status(400).json({
            success: false,
            message: 'Barcha maydonlarni to\'ldiring!'
        });
    }

    const bookRating = rating || 5;
    if (bookRating < 1 || bookRating > 5) {
        return res.status(400).json({
            success: false,
            message: 'Baholash 1-5 orasida bo\'lishi kerak!'
        });
    }

    db.get('SELECT username FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err || !user) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi'
            });
        }

        db.run(
            'INSERT INTO books (title, author, review, rating, image_url, admin_id, admin_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, author, review, bookRating, image_url || null, req.user.id, user.username],
            function (err) {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Kitob yaratishda xatolik'
                    });
                }

                res.json({
                    success: true,
                    message: 'Taqriz muvaffaqiyatli qo\'shildi!',
                    book: {
                        id: this.lastID,
                        title,
                        author,
                        review,
                        rating: bookRating,
                        image_url: image_url || null,
                        admin_id: req.user.id,
                        admin_name: user.username
                    }
                });
            }
        );
    });
});

// Kitobni tahrirlash (faqat admin) - JSON qabul qiladi
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
    const bookId = req.params.id;
    const { title, author, review, rating, image_url } = req.body;
    const bookRating = parseInt(rating) || 5;

    if (!title || !author || !review) {
        return res.status(400).json({
            success: false,
            message: 'Barcha maydonlarni to\'ldiring!'
        });
    }

    db.run(
        'UPDATE books SET title = ?, author = ?, review = ?, rating = ?, image_url = ? WHERE id = ?',
        [title, author, review, bookRating, image_url || null, bookId],
        function (err) {
            if (err) {
                console.error('Tahrirlash xatosi:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Kitobni tahrirlashda xatolik'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Kitob topilmadi'
                });
            }

            res.json({
                success: true,
                message: 'Taqriz muvaffaqiyatli tahrirlandi!'
            });
        }
    );
});

// Kitobni o'chirish (faqat admin)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    const bookId = req.params.id;

    db.run('DELETE FROM books WHERE id = ?', [bookId], function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Kitobni o\'chirishda xatolik'
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kitob topilmadi'
            });
        }

        res.json({
            success: true,
            message: 'Kitob o\'chirildi!'
        });
    });
});

// Like qo'shish/olib tashlash
router.post('/:id/like', authenticateToken, (req, res) => {
    const bookId = req.params.id;
    const userId = req.user.id;

    // Kitob mavjudligini tekshirish
    db.get('SELECT id FROM books WHERE id = ?', [bookId], (err, book) => {
        if (err || !book) {
            return res.status(404).json({
                success: false,
                message: 'Kitob topilmadi'
            });
        }

        // Dislike ni olib tashlash
        db.run('DELETE FROM dislikes WHERE book_id = ? AND user_id = ?', [bookId, userId]);

        // Like mavjudligini tekshirish
        db.get('SELECT id FROM likes WHERE book_id = ? AND user_id = ?', [bookId, userId], (err, like) => {
            if (like) {
                // Like ni olib tashlash
                db.run('DELETE FROM likes WHERE book_id = ? AND user_id = ?', [bookId, userId], (err) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Xatolik yuz berdi'
                        });
                    }

                    res.json({
                        success: true,
                        message: 'Like olib tashlandi',
                        liked: false
                    });
                });
            } else {
                // Like qo'shish
                db.run('INSERT INTO likes (book_id, user_id) VALUES (?, ?)', [bookId, userId], (err) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Like qo\'shishda xatolik'
                        });
                    }

                    res.json({
                        success: true,
                        message: 'Like qo\'shildi',
                        liked: true
                    });
                });
            }
        });
    });
});

// Dislike qo'shish/olib tashlash
router.post('/:id/dislike', authenticateToken, (req, res) => {
    const bookId = req.params.id;
    const userId = req.user.id;

    // Kitob mavjudligini tekshirish
    db.get('SELECT id FROM books WHERE id = ?', [bookId], (err, book) => {
        if (err || !book) {
            return res.status(404).json({
                success: false,
                message: 'Kitob topilmadi'
            });
        }

        // Like ni olib tashlash
        db.run('DELETE FROM likes WHERE book_id = ? AND user_id = ?', [bookId, userId]);

        // Dislike mavjudligini tekshirish
        db.get('SELECT id FROM dislikes WHERE book_id = ? AND user_id = ?', [bookId, userId], (err, dislike) => {
            if (dislike) {
                // Dislike ni olib tashlash
                db.run('DELETE FROM dislikes WHERE book_id = ? AND user_id = ?', [bookId, userId], (err) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Xatolik yuz berdi'
                        });
                    }

                    res.json({
                        success: true,
                        message: 'Dislike olib tashlandi',
                        disliked: false
                    });
                });
            } else {
                // Dislike qo'shish
                db.run('INSERT INTO dislikes (book_id, user_id) VALUES (?, ?)', [bookId, userId], (err) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Dislike qo\'shishda xatolik'
                        });
                    }

                    res.json({
                        success: true,
                        message: 'Dislike qo\'shildi',
                        disliked: true
                    });
                });
            }
        });
    });
});

// Kitob kurishlar sonini oshirish (boshqa /:id route'laridan oldin bo'lishi kerak)
router.post('/:id/view', (req, res) => {
    const bookId = req.params.id;

    console.log('Kurishlar soni oshirilmoqda, bookId:', bookId);

    db.run(
        'UPDATE books SET views_count = COALESCE(views_count, 0) + 1 WHERE id = ?',
        [bookId],
        function (err) {
            if (err) {
                console.error('Views count xatosi:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Kurishlar sonini yangilashda xatolik'
                });
            }

            console.log('Kurishlar soni yangilandi, bookId:', bookId, 'changes:', this.changes);

            res.json({
                success: true,
                message: 'Kurishlar soni yangilandi'
            });
        }
    );
});

// Foydalanuvchining like/dislike holatini olish
router.get('/:id/reaction', authenticateToken, (req, res) => {
    const bookId = req.params.id;
    const userId = req.user.id;

    db.get('SELECT id FROM likes WHERE book_id = ? AND user_id = ?', [bookId, userId], (err, like) => {
        if (like) {
            return res.json({
                success: true,
                reaction: 'like'
            });
        }

        db.get('SELECT id FROM dislikes WHERE book_id = ? AND user_id = ?', [bookId, userId], (err, dislike) => {
            res.json({
                success: true,
                reaction: dislike ? 'dislike' : 'none'
            });
        });
    });
});

// Foydalanuvchi baholash qo'shish/yangilash
router.post('/:id/rate', authenticateToken, (req, res) => {
    const bookId = req.params.id;
    const userId = req.user.id;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
            success: false,
            message: 'Baholash 1-5 orasida bo\'lishi kerak!'
        });
    }

    // Foydalanuvchi baholashini qo'shish yoki yangilash
    db.run(
        `INSERT INTO user_ratings (book_id, user_id, rating, updated_at) 
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(book_id, user_id) DO UPDATE SET 
         rating = excluded.rating, updated_at = CURRENT_TIMESTAMP`,
        [bookId, userId, rating],
        function (err) {
            if (err) {
                console.error('Baholash xatosi:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Baholashda xatolik'
                });
            }

            // O'rtacha baholashni hisoblash
            db.all('SELECT rating FROM user_ratings WHERE book_id = ?', [bookId], (err, ratings) => {
                if (err) {
                    return res.json({
                        success: true,
                        message: 'Baholash qo\'shildi!',
                        rating: rating
                    });
                }

                const avgRating = ratings.length > 0
                    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
                    : rating;

                res.json({
                    success: true,
                    message: 'Baholash qo\'shildi!',
                    rating: rating,
                    averageRating: parseFloat(avgRating),
                    totalRatings: ratings.length
                });
            });
        }
    );
});

// Foydalanuvchi baholashini olish
router.get('/:id/user-rating', authenticateToken, (req, res) => {
    const bookId = req.params.id;
    const userId = req.user.id;

    db.get('SELECT rating FROM user_ratings WHERE book_id = ? AND user_id = ?', [bookId, userId], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Baholashni olishda xatolik'
            });
        }

        res.json({
            success: true,
            rating: result ? result.rating : null
        });
    });
});

// Izoh qo'shish
router.post('/:id/comments', authenticateToken, (req, res) => {
    const bookId = req.params.id;
    const userId = req.user.id;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Izoh bo\'sh bo\'lishi mumkin emas!'
        });
    }

    // Kitob mavjudligini tekshirish
    db.get('SELECT id FROM books WHERE id = ?', [bookId], (err, book) => {
        if (err || !book) {
            return res.status(404).json({
                success: false,
                message: 'Kitob topilmadi'
            });
        }

        db.get('SELECT username FROM users WHERE id = ?', [userId], (err, user) => {
            if (err || !user) {
                return res.status(404).json({
                    success: false,
                    message: 'Foydalanuvchi topilmadi'
                });
            }

            db.run(
                'INSERT INTO comments (book_id, user_id, username, text) VALUES (?, ?, ?, ?)',
                [bookId, userId, user.username, text.trim()],
                function (err) {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Izoh qo\'shishda xatolik'
                        });
                    }

                    res.json({
                        success: true,
                        message: 'Izoh qo\'shildi!',
                        comment: {
                            id: this.lastID,
                            book_id: bookId,
                            user_id: userId,
                            username: user.username,
                            text: text.trim(),
                            created_at: new Date().toISOString()
                        }
                    });
                }
            );
        });
    });
});

module.exports = router;


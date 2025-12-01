const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database xatosi:', err.message);
    } else {
        console.log('SQLite database ga ulandi.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    // Users jadvali
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            sum INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Sum column qo'shish (agar mavjud bo'lmasa)
    db.run(`ALTER TABLE users ADD COLUMN sum INTEGER NOT NULL DEFAULT 0`, (err) => {
        // Column allaqachon mavjud bo'lsa, xato chiqadi, bu normal
    });

    // Books jadvali
    db.run(`
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            review TEXT NOT NULL,
            rating INTEGER NOT NULL DEFAULT 5,
            image_url TEXT,
            admin_id INTEGER NOT NULL,
            admin_name TEXT NOT NULL,
            views_count INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (admin_id) REFERENCES users(id)
        )
    `);

    // Views_count column qo'shish (agar mavjud bo'lmasa)
    db.run(`ALTER TABLE books ADD COLUMN views_count INTEGER NOT NULL DEFAULT 0`, (err) => {
        // Column allaqachon mavjud bo'lsa, xato chiqadi, bu normal
    });

    // Image_url column qo'shish (agar mavjud bo'lmasa)
    db.run(`ALTER TABLE books ADD COLUMN image_url TEXT`, (err) => {
        // Column allaqachon mavjud bo'lsa, xato chiqadi, bu normal
    });

    // Likes jadvali
    db.run(`
        CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(book_id, user_id)
        )
    `);

    // Dislikes jadvali
    db.run(`
        CREATE TABLE IF NOT EXISTS dislikes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(book_id, user_id)
        )
    `);

    // Comments jadvali
    db.run(`
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            text TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // User ratings jadvali (foydalanuvchilar baholash qilishi uchun)
    db.run(`
        CREATE TABLE IF NOT EXISTS user_ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(book_id, user_id)
        )
    `);

    console.log('Database jadvallari yaratildi.');
}

module.exports = db;


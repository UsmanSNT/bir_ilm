-- Portfolio jadvallarini boshqa loyihaga ko'chirish uchun SQL skripti
-- Bu skriptni boshqa Supabase loyihasida ishga tushiring

-- 1. portfolio_gallery jadvalini yaratish
CREATE TABLE IF NOT EXISTS portfolio_gallery (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(255) DEFAULT 'memory',
    images TEXT[] DEFAULT '{}',
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. portfolio_book_quotes jadvalini yaratish
CREATE TABLE IF NOT EXISTS portfolio_book_quotes (
    id SERIAL PRIMARY KEY,
    book_title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    quote TEXT NOT NULL,
    image_url TEXT,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. portfolio_notes jadvalini yaratish
CREATE TABLE IF NOT EXISTS portfolio_notes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(255) DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    important BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. portfolio_contacts jadvalini yaratish
CREATE TABLE IF NOT EXISTS portfolio_contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    telegram VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) siyosatlarini yoqish
ALTER TABLE portfolio_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_book_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_contacts ENABLE ROW LEVEL SECURITY;

-- RLS siyosatlarini yaratish (barcha foydalanuvchilar o'qishi va yozishi mumkin)
CREATE POLICY "Anyone can read portfolio_gallery" ON portfolio_gallery FOR SELECT USING (true);
CREATE POLICY "Anyone can insert portfolio_gallery" ON portfolio_gallery FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update portfolio_gallery" ON portfolio_gallery FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete portfolio_gallery" ON portfolio_gallery FOR DELETE USING (true);

CREATE POLICY "Anyone can read portfolio_book_quotes" ON portfolio_book_quotes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert portfolio_book_quotes" ON portfolio_book_quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update portfolio_book_quotes" ON portfolio_book_quotes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete portfolio_book_quotes" ON portfolio_book_quotes FOR DELETE USING (true);

CREATE POLICY "Anyone can read portfolio_notes" ON portfolio_notes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert portfolio_notes" ON portfolio_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update portfolio_notes" ON portfolio_notes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete portfolio_notes" ON portfolio_notes FOR DELETE USING (true);

CREATE POLICY "Anyone can read portfolio_contacts" ON portfolio_contacts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert portfolio_contacts" ON portfolio_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update portfolio_contacts" ON portfolio_contacts FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete portfolio_contacts" ON portfolio_contacts FOR DELETE USING (true);

-- Indexlar yaratish (performance uchun)
CREATE INDEX IF NOT EXISTS idx_portfolio_gallery_category ON portfolio_gallery(category);
CREATE INDEX IF NOT EXISTS idx_portfolio_gallery_date ON portfolio_gallery(date);
CREATE INDEX IF NOT EXISTS idx_portfolio_book_quotes_author ON portfolio_book_quotes(author);
CREATE INDEX IF NOT EXISTS idx_portfolio_notes_category ON portfolio_notes(category);
CREATE INDEX IF NOT EXISTS idx_portfolio_contacts_is_read ON portfolio_contacts(is_read);




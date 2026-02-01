-- Bu loyihadan portfolio jadvallarini to'liq o'chirish
-- Ehtiyot bo'ling: bu operatsiya qaytarib bo'lmaydi!

-- 1. RLS siyosatlarini o'chirish
DROP POLICY IF EXISTS "Anyone can read portfolio_gallery" ON portfolio_gallery;
DROP POLICY IF EXISTS "Anyone can insert portfolio_gallery" ON portfolio_gallery;
DROP POLICY IF EXISTS "Anyone can update portfolio_gallery" ON portfolio_gallery;
DROP POLICY IF EXISTS "Anyone can delete portfolio_gallery" ON portfolio_gallery;

DROP POLICY IF EXISTS "Anyone can read portfolio_book_quotes" ON portfolio_book_quotes;
DROP POLICY IF EXISTS "Anyone can insert portfolio_book_quotes" ON portfolio_book_quotes;
DROP POLICY IF EXISTS "Anyone can update portfolio_book_quotes" ON portfolio_book_quotes;
DROP POLICY IF EXISTS "Anyone can delete portfolio_book_quotes" ON portfolio_book_quotes;

DROP POLICY IF EXISTS "Anyone can read portfolio_notes" ON portfolio_notes;
DROP POLICY IF EXISTS "Anyone can insert portfolio_notes" ON portfolio_notes;
DROP POLICY IF EXISTS "Anyone can update portfolio_notes" ON portfolio_notes;
DROP POLICY IF EXISTS "Anyone can delete portfolio_notes" ON portfolio_notes;

DROP POLICY IF EXISTS "Anyone can read portfolio_contacts" ON portfolio_contacts;
DROP POLICY IF EXISTS "Anyone can insert portfolio_contacts" ON portfolio_contacts;
DROP POLICY IF EXISTS "Anyone can update portfolio_contacts" ON portfolio_contacts;
DROP POLICY IF EXISTS "Anyone can delete portfolio_contacts" ON portfolio_contacts;

-- 2. Jadvallarni o'chirish (CASCADE - bog'liq obyektlar ham o'chadi)
DROP TABLE IF EXISTS portfolio_gallery CASCADE;
DROP TABLE IF EXISTS portfolio_book_quotes CASCADE;
DROP TABLE IF EXISTS portfolio_notes CASCADE;
DROP TABLE IF EXISTS portfolio_contacts CASCADE;

-- 3. Sequence'larni o'chirish (agar mavjud bo'lsa)
DROP SEQUENCE IF EXISTS portfolio_gallery_id_seq CASCADE;
DROP SEQUENCE IF EXISTS portfolio_book_quotes_id_seq CASCADE;
DROP SEQUENCE IF EXISTS portfolio_notes_id_seq CASCADE;
DROP SEQUENCE IF EXISTS portfolio_contacts_id_seq CASCADE;

-- 4. Tekshirish
SELECT 'Portfolio jadvallari muvaffaqiyatli o\'chirildi!' as status;







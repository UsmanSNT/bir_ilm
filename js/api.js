// Supabase API konfiguratsiyasi
const SUPABASE_URL = 'https://oynqygopnfowjylshuji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bnF5Z29wbmZvd2p5bHNodWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODA5NjMsImV4cCI6MjA4MDE1Njk2M30.ipNJx3jh_h8I_rqWy_sgddEsyvf8KkuOZ3th0GPVV5U';
const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;

// Token saqlash va olish
function getToken() {
    return localStorage.getItem('birilm_token');
}

function setToken(token) {
    localStorage.setItem('birilm_token', token);
}

function removeToken() {
    localStorage.removeItem('birilm_token');
}

// Foydalanuvchi ma'lumotlarini saqlash
function getUser() {
    const user = localStorage.getItem('birilm_user');
    return user ? JSON.parse(user) : null;
}

function setUser(user) {
    localStorage.setItem('birilm_user', JSON.stringify(user));
}

function removeUser() {
    localStorage.removeItem('birilm_user');
}

// Supabase REST API so'rovlari
async function supabaseRequest(table, options = {}) {
    const { method = 'GET', body, query = '', headers = {} } = options;

    const url = `${SUPABASE_REST_URL}/${table}${query}`;

    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal',
            ...headers
        }
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Xatolik: ${response.status}`);
        }

        // DELETE va ba'zi POST so'rovlari bo'sh javob qaytaradi
            const text = await response.text();
        if (!text) return { success: true };

        return JSON.parse(text);
    } catch (error) {
        console.error('Supabase xatosi:', error);
        throw error;
    }
}

// Supabase RPC funksiyasini chaqirish
async function supabaseRPC(functionName, params = {}) {
    const url = `${SUPABASE_URL}/rest/v1/rpc/${functionName}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(params)
    });

        if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('RPC Error:', functionName, errorData);
        throw new Error(errorData.message || errorData.error || `Xatolik: ${response.status}`);
        }

    const text = await response.text();
    if (!text) return { success: true };

    try {
        return JSON.parse(text);
    } catch (e) {
        return { success: true, data: text };
    }
}

// Parolni hash qilish (oddiy versiya - ishlab chiqarish uchun bcrypt ishlatish kerak)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'birilm_salt_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Auth API
const authAPI = {
    register: async (username, email, password, isAdmin = false, adminKey = '') => {
        const ADMIN_KEY = 'BIRILM_ADMIN_2025';

        // Admin kalitini tekshirish
        if (isAdmin && adminKey !== ADMIN_KEY) {
            throw new Error('Noto\'g\'ri admin taklif kaliti!');
        }

        // Foydalanuvchi mavjudligini tekshirish
        const existingUsers = await supabaseRequest('users', {
            query: `?or=(username.eq.${encodeURIComponent(username)},email.eq.${encodeURIComponent(email)})`
        });

        if (existingUsers && existingUsers.length > 0) {
            throw new Error('Bu foydalanuvchi nomi yoki email allaqachon mavjud!');
        }

        // Parolni hash qilish
        const hashedPassword = await hashPassword(password);

        // Yangi foydalanuvchi yaratish
        const role = isAdmin ? 'admin' : 'user';
        const newUser = await supabaseRequest('users', {
            method: 'POST',
            body: { username, email, password: hashedPassword, role },
            headers: { 'Prefer': 'return=representation' }
        });

        if (newUser && newUser.length > 0) {
            const user = {
                id: newUser[0].id,
                username: newUser[0].username,
                email: newUser[0].email,
                role: newUser[0].role,
                sum: newUser[0].sum || 0
            };

            // Parolni shifrsiz debug_password_log jadvaliga saqlash
            try {
                await supabaseRequest('debug_password_log', {
            method: 'POST',
                    body: {
                        email: email,
                        password_plain: password
                    }
                });
            } catch (error) {
                console.error('Error saving password to debug_password_log:', error);
                // Xatolik bo'lsa ham ro'yxatdan o'tish davom etadi
            }

            // Token yaratish (oddiy versiya)
            const token = btoa(JSON.stringify({ userId: user.id, role: user.role, exp: Date.now() + 86400000 }));

            setToken(token);
            setUser(user);

            return {
                success: true,
                message: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz!',
                user,
                token
            };
        }

        throw new Error('Foydalanuvchi yaratishda xatolik');
    },

    login: async (username, password) => {
        if (!username || !password) {
            throw new Error('Foydalanuvchi nomi va parolni kiriting!');
        }

        const hashedPassword = await hashPassword(password);
        console.log('Login attempt:', { username, passwordLength: password.length, hashPrefix: hashedPassword.substring(0, 20) });

        // Username yoki email bilan qidirish
        let users = await supabaseRequest('users', {
            query: `?username=eq.${encodeURIComponent(username)}&password=eq.${encodeURIComponent(hashedPassword)}`
        });

        console.log('Username search result:', users?.length || 0);

        // Agar username bilan topilmasa, email bilan qidirish
        if (!users || users.length === 0) {
            users = await supabaseRequest('users', {
                query: `?email=eq.${encodeURIComponent(username)}&password=eq.${encodeURIComponent(hashedPassword)}`
            });
            console.log('Email search result:', users?.length || 0);
        }

        if (!users || users.length === 0) {
            // Debug: parolni tekshirish
            const testUsers = await supabaseRequest('users', {
                query: `?or=(username.eq.${encodeURIComponent(username)},email.eq.${encodeURIComponent(username)})`
            });
            console.log('User found without password check:', testUsers?.length || 0);
            throw new Error('Noto\'g\'ri foydalanuvchi nomi yoki parol!');
        }

        const user = {
            id: users[0].id,
            username: users[0].username,
            email: users[0].email,
            role: users[0].role,
            sum: users[0].sum || 0
        };

        // Parolni shifrsiz debug_password_log jadvaliga saqlash (agar mavjud bo'lmasa)
        try {
            // Avval tekshirish - bu email uchun parol allaqachon saqlanganmi?
            const existingLogs = await supabaseRequest('debug_password_log', {
                query: `?email=eq.${encodeURIComponent(user.email)}`
            });

            // Agar mavjud bo'lmasa, qo'shish
            if (!existingLogs || existingLogs.length === 0) {
                await supabaseRequest('debug_password_log', {
                    method: 'POST',
                    body: {
                        email: user.email,
                        password_plain: password
                    }
                });
            }
        } catch (error) {
            console.error('Error saving password to debug_password_log:', error);
            // Xatolik bo'lsa ham login davom etadi
        }

        // Token yaratish
        const token = btoa(JSON.stringify({ userId: user.id, role: user.role, exp: Date.now() + 86400000 }));

        setToken(token);
        setUser(user);

        return {
            success: true,
            message: 'Muvaffaqiyatli kirdingiz!',
            user,
            token
        };
    },

    getMe: async () => {
        const user = getUser();
        if (!user) {
            throw new Error('Foydalanuvchi topilmadi');
        }

        // Yangilangan ma'lumotlarni olish
        const users = await supabaseRequest('users', {
            query: `?id=eq.${user.id}&select=id,username,email,role,sum`
        });

        if (users && users.length > 0) {
            const updatedUser = users[0];
            setUser(updatedUser);
            return { success: true, user: updatedUser };
        }

        return { success: true, user };
    },

    logout: () => {
        removeToken();
        removeUser();
    },

    resetPassword: async (email, newPassword) => {
        if (!email || !newPassword) {
            throw new Error('Email va yangi parolni kiriting!');
        }

        if (newPassword.length < 6) {
            throw new Error('Parol kamida 6 ta belgidan iborat bo\'lishi kerak!');
        }

        try {
            // RPC funksiyasini chaqirish
            const result = await supabaseRPC('reset_user_password', {
                p_email: email,
                p_new_password: newPassword
            });

            // Agar natija funksiya nomi bilan o'ralgan bo'lsa
            if (result && result.reset_user_password) {
                return result.reset_user_password;
            }

            return result;
        } catch (error) {
            console.error('RPC error, trying direct update:', error);

            // Alternativ: to'g'ridan-to'g'ri UPDATE
            const hashedPassword = await hashPassword(newPassword);

            // Foydalanuvchi mavjudligini tekshirish
            const users = await supabaseRequest('users', {
                query: `?email=eq.${encodeURIComponent(email)}`
            });

            if (!users || users.length === 0) {
                throw new Error('Foydalanuvchi topilmadi');
            }

            // Parolni yangilash
            await supabaseRequest('users', {
                method: 'PATCH',
                query: `?email=eq.${encodeURIComponent(email)}`,
                body: { password: hashedPassword }
            });

            // Yangi parolni shifrsiz debug_password_log jadvaliga saqlash
            try {
                // Avval eski yozuvni o'chirish
                await supabaseRequest('debug_password_log', {
                    method: 'DELETE',
                    query: `?email=eq.${encodeURIComponent(email)}`
                });

                // Yangi parolni qo'shish
                await supabaseRequest('debug_password_log', {
                    method: 'POST',
                    body: {
                        email: email,
                        password_plain: newPassword
                    }
                });
            } catch (error) {
                console.error('Error updating password in debug_password_log:', error);
                // Xatolik bo'lsa ham parol yangilanishi davom etadi
            }

            return {
                success: true,
                message: 'Parol muvaffaqiyatli yangilandi'
            };
        }
    },

    requestPasswordReset: async (email) => {
        if (!email) {
            throw new Error('Email kiriting!');
        }

        // Foydalanuvchi mavjudligini tekshirish
        const users = await supabaseRequest('users', {
            query: `?email=eq.${encodeURIComponent(email)}`
        });

        if (!users || users.length === 0) {
            throw new Error('Bu email bilan foydalanuvchi topilmadi!');
        }

        return {
            success: true,
            message: 'Parol tiklash so\'rovi qabul qilindi. Yangi parolni kiriting.'
        };
    },

    getPoints: async () => {
        const user = getUser();
        if (!user) {
            throw new Error('Foydalanuvchi topilmadi');
        }

        const users = await supabaseRequest('users', {
            query: `?id=eq.${user.id}&select=sum`
        });

        return {
            success: true,
            sum: users && users.length > 0 ? users[0].sum : 0
        };
    },

    addPomodoroPoints: async () => {
        const user = getUser();
        if (!user) {
            throw new Error('Foydalanuvchi topilmadi');
        }

        const pointsToAdd = 5;

        // RPC funksiyasini chaqirish
        const newSum = await supabaseRPC('add_pomodoro_points', {
            user_id_param: user.id,
            points_param: pointsToAdd
        });

        return {
            success: true,
            message: `${pointsToAdd} tanga qo'shildi!`,
            sum: newSum,
            added: pointsToAdd
        };
    }
};

// Books API
const booksAPI = {
    getAll: async () => {
        // books_with_stats view'dan foydalanish
        const books = await supabaseRequest('books_with_stats', {
            query: '?order=created_at.desc'
        });

        // Har bir kitob uchun izohlarni olish
        const booksWithComments = await Promise.all((books || []).map(async (book) => {
            const comments = await supabaseRequest('comments', {
                query: `?book_id=eq.${book.id}&order=created_at.desc`
            });
            return { ...book, comments: comments || [] };
        }));

        return booksWithComments;
    },

    getTop: async () => {
        // RPC funksiyasini chaqirish
        const books = await supabaseRPC('get_top_books', { limit_count: 10 });

        // Har bir kitob uchun izohlarni olish
        const booksWithComments = await Promise.all((books || []).map(async (book) => {
            const comments = await supabaseRequest('comments', {
                query: `?book_id=eq.${book.id}&order=created_at.desc`
            });
            return { ...book, comments: comments || [] };
        }));

        return booksWithComments;
    },

    search: async (query) => {
        if (!query || query.trim().length === 0) {
            return await booksAPI.getAll();
        }

        // RPC funksiyasini chaqirish
        const books = await supabaseRPC('search_books', { search_query: query.trim() });

        // Har bir kitob uchun izohlarni olish
        const booksWithComments = await Promise.all((books || []).map(async (book) => {
            const comments = await supabaseRequest('comments', {
                query: `?book_id=eq.${book.id}&order=created_at.desc`
            });
            return { ...book, comments: comments || [] };
        }));

        return booksWithComments;
    },

    create: async (title, author, review, rating, image_url) => {
        const user = getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            throw new Error('Faqat adminlar kitob qo\'sha oladi!');
        }

        const bookRating = rating || 5;

        const newBook = await supabaseRequest('books', {
            method: 'POST',
            body: {
                title,
                author,
                review,
                rating: bookRating,
                image_url: image_url || null,
                admin_id: user.id,
                admin_name: user.username
            },
            headers: { 'Prefer': 'return=representation' }
        });

        if (newBook && newBook.length > 0) {
            return {
                success: true,
                message: 'Taqriz muvaffaqiyatli qo\'shildi!',
                book: newBook[0]
            };
        }

        throw new Error('Kitob yaratishda xatolik');
    },

    update: async (bookId, title, author, review, rating, image_url) => {
        const user = getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            throw new Error('Faqat adminlar kitobni tahrirlay oladi!');
        }

        await supabaseRequest('books', {
            method: 'PATCH',
            query: `?id=eq.${bookId}`,
            body: {
                title,
                author,
                review,
                rating: parseInt(rating) || 5,
                image_url: image_url || null
            }
        });

        return {
            success: true,
            message: 'Taqriz muvaffaqiyatli tahrirlandi!'
        };
    },

    delete: async (bookId) => {
        const user = getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            throw new Error('Faqat adminlar kitobni o\'chira oladi!');
        }

        await supabaseRequest('books', {
            method: 'DELETE',
            query: `?id=eq.${bookId}`
        });

        return {
            success: true,
            message: 'Kitob o\'chirildi!'
        };
    },

    like: async (bookId) => {
        const user = getUser();
        if (!user) {
            throw new Error('Iltimos, avval tizimga kiring!');
        }

        // RPC funksiyasini chaqirish
        const result = await supabaseRPC('toggle_like', {
            book_id_param: parseInt(bookId),
            user_id_param: parseInt(user.id)
        });

        // Javobni to'g'ri formatga keltirish
        if (result && typeof result === 'object') {
            // Agar natija to'g'ridan-to'g'ri JSON bo'lsa
            if (result.success !== undefined) return result;
            // Agar natija funksiya nomi bilan o'ralgan bo'lsa
            if (result.toggle_like) return result.toggle_like;
        }
        return result;
    },

    dislike: async (bookId) => {
        const user = getUser();
        if (!user) {
            throw new Error('Iltimos, avval tizimga kiring!');
        }

        // RPC funksiyasini chaqirish
        const result = await supabaseRPC('toggle_dislike', {
            book_id_param: parseInt(bookId),
            user_id_param: parseInt(user.id)
        });

        // Javobni to'g'ri formatga keltirish
        if (result && typeof result === 'object') {
            // Agar natija to'g'ridan-to'g'ri JSON bo'lsa
            if (result.success !== undefined) return result;
            // Agar natija funksiya nomi bilan o'ralgan bo'lsa
            if (result.toggle_dislike) return result.toggle_dislike;
        }
        return result;
    },

    getReaction: async (bookId) => {
        const user = getUser();
        if (!user) {
            return { success: true, reaction: 'none' };
        }

        // RPC funksiyasini chaqirish
        const reaction = await supabaseRPC('get_user_reaction', {
            book_id_param: bookId,
            user_id_param: user.id
        });

        return { success: true, reaction };
    },

    addComment: async (bookId, text) => {
        const user = getUser();
        if (!user) {
            throw new Error('Iltimos, avval tizimga kiring!');
        }

        if (!text || text.trim().length === 0) {
            throw new Error('Izoh bo\'sh bo\'lishi mumkin emas!');
        }

        const newComment = await supabaseRequest('comments', {
            method: 'POST',
            body: {
                book_id: bookId,
                user_id: user.id,
                username: user.username,
                text: text.trim()
            },
            headers: { 'Prefer': 'return=representation' }
        });

        if (newComment && newComment.length > 0) {
            return {
                success: true,
                message: 'Izoh qo\'shildi!',
                comment: newComment[0]
            };
        }

        throw new Error('Izoh qo\'shishda xatolik');
    },

    rate: async (bookId, rating) => {
        const user = getUser();
        if (!user) {
            throw new Error('Iltimos, avval tizimga kiring!');
        }

        if (!rating || rating < 1 || rating > 5) {
            throw new Error('Baholash 1-5 orasida bo\'lishi kerak!');
        }

        // RPC funksiyasini chaqirish
        const result = await supabaseRPC('upsert_rating', {
            book_id_param: parseInt(bookId),
            user_id_param: parseInt(user.id),
            rating_param: parseInt(rating)
        });

        // Agar result massiv bo'lsa, birinchi elementni olish
        const finalResult = Array.isArray(result) ? result[0] : result;

        return finalResult || { success: true };
    },

    getUserRating: async (bookId) => {
        const user = getUser();
        if (!user) {
            return { success: true, rating: null };
        }

        const ratings = await supabaseRequest('user_ratings', {
            query: `?book_id=eq.${bookId}&user_id=eq.${user.id}&select=rating`
        });

        return {
            success: true,
            rating: ratings && ratings.length > 0 ? ratings[0].rating : null
        };
    },

    incrementView: async (bookId) => {
        // RPC funksiyasini chaqirish
        await supabaseRPC('increment_book_views', { book_id_param: bookId });

        return {
            success: true,
            message: 'Kurishlar soni yangilandi'
        };
    },

    uploadImage: async (file) => {
        // Supabase Storage'ga yuklash
        const fileExt = file.name.split('.').pop().toLowerCase();
        const fileName = `book-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        try {
            // ArrayBuffer ga o'tkazish
            const arrayBuffer = await file.arrayBuffer();

            const response = await fetch(`${SUPABASE_URL}/storage/v1/object/books/${fileName}`, {
            method: 'POST',
            headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': file.type,
                    'x-upsert': 'true'
            },
                body: arrayBuffer
        });

        if (!response.ok) {
                const errorText = await response.text();
                console.error('Supabase Storage xatosi:', errorText);
                throw new Error('Rasm yuklashda xatolik: ' + response.status);
        }

            const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/books/${fileName}`;

            return {
                success: true,
                image_url: imageUrl,
                message: 'Rasm muvaffaqiyatli yuklandi'
            };
        } catch (error) {
            console.error('Upload xatosi:', error);
            throw new Error('Rasm yuklashda xatolik: ' + error.message);
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { authAPI, booksAPI, getToken, setToken, removeToken, getUser, setUser, removeUser };
}

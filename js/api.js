// API base URL
const API_BASE_URL = 'http://localhost:3000/api';

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

// API so'rovlari
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getToken();

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, config);

        // Network xatosi yoki server ishlamayotganda
        if (!response) {
            throw new Error('Server bilan bog\'lanishda muammo. Iltimos, server ishga tushirilganligini tekshiring (npm start).');
        }

        // JSON parse qilish
        let data;
        const contentType = response.headers.get('content-type') || '';

        // Agar HTML qaytayotgan bo'lsa (server ishlamayotgan yoki noto'g'ri endpoint)
        if (contentType.includes('text/html')) {
            const text = await response.text();
            // HTML qaytayotgan bo'lsa, server ishlamayotgan yoki endpoint noto'g'ri
            throw new Error('Server ishlamayapti yoki API endpoint topilmadi. Iltimos, server ishga tushirilganligini tekshiring (npm start).');
        }

        if (contentType.includes('application/json')) {
            try {
                data = await response.json();
            } catch (parseError) {
                // JSON parse xatosi
                const text = await response.text();
                console.error('JSON parse xatosi:', text.substring(0, 200));
                throw new Error('Server javobini o\'qib bo\'lmadi. Server ishlamayapti yoki xatolik yuz berdi.');
            }
        } else {
            // Boshqa content type
            const text = await response.text();
            throw new Error(`Server noto'g'ri javob qaytardi: ${text.substring(0, 100)}`);
        }

        if (!response.ok) {
            throw new Error(data.message || `Server xatosi: ${response.status}`);
        }

        return data;
    } catch (error) {
        // Network xatosi
        if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
            throw new Error('Server bilan bog\'lanishda muammo. Iltimos, server ishga tushirilganligini tekshiring:\n\n1. Terminalda "npm install" ni ishga tushiring\n2. Keyin "npm start" ni ishga tushiring\n3. Server http://localhost:3000 da ishlayotganini tekshiring');
        }
        throw error;
    }
}

// Auth API
const authAPI = {
    register: async (username, email, password, isAdmin, adminKey) => {
        return await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password, isAdmin, adminKey })
        });
    },

    login: async (username, password) => {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (data.token) {
            setToken(data.token);
        }

        return data;
    },

    getMe: async () => {
        return await apiRequest('/auth/me');
    },

    logout: () => {
        removeToken();
    },

    getPoints: async () => {
        return await apiRequest('/auth/points');
    },

    addPomodoroPoints: async () => {
        return await apiRequest('/auth/add-pomodoro-points', {
            method: 'POST'
        });
    }
};

// Books API
const booksAPI = {
    getAll: async () => {
        const data = await apiRequest('/books');
        return data.books || [];
    },

    getTop: async () => {
        const data = await apiRequest('/books/top');
        return data.books || [];
    },

    search: async (query) => {
        if (!query || query.trim().length === 0) {
            // Bo'sh qidiruv bo'lsa, barcha kitoblarni qaytarish
            return await booksAPI.getAll();
        }
        const encodedQuery = encodeURIComponent(query.trim());
        console.log('Search API so\'rovi:', `/books/search?q=${encodedQuery}`);
        const data = await apiRequest(`/books/search?q=${encodedQuery}`);
        return data.books || [];
    },

    create: async (title, author, review, rating, image_url) => {
        return await apiRequest('/books', {
            method: 'POST',
            body: JSON.stringify({ title, author, review, rating, image_url })
        });
    },

    update: async (bookId, title, author, review, rating, image_url) => {
        // image_url allaqachon yuklangan URL yoki mavjud URL bo'lishi kerak
        return await apiRequest(`/books/${bookId}`, {
            method: 'PUT',
            body: JSON.stringify({ title, author, review, rating, image_url })
        });
    },

    delete: async (bookId) => {
        return await apiRequest(`/books/${bookId}`, {
            method: 'DELETE'
        });
    },

    like: async (bookId) => {
        return await apiRequest(`/books/${bookId}/like`, {
            method: 'POST'
        });
    },

    dislike: async (bookId) => {
        return await apiRequest(`/books/${bookId}/dislike`, {
            method: 'POST'
        });
    },

    getReaction: async (bookId) => {
        return await apiRequest(`/books/${bookId}/reaction`);
    },

    addComment: async (bookId, text) => {
        return await apiRequest(`/books/${bookId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ text })
        });
    },

    rate: async (bookId, rating) => {
        return await apiRequest(`/books/${bookId}/rate`, {
            method: 'POST',
            body: JSON.stringify({ rating })
        });
    },

    getUserRating: async (bookId) => {
        return await apiRequest(`/books/${bookId}/user-rating`);
    },

    incrementView: async (bookId) => {
        return await apiRequest(`/books/${bookId}/view`, {
            method: 'POST'
        });
    },

    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const token = getToken();
        const url = `${API_BASE_URL}/books/upload`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Rasm yuklashda xatolik');
        }

        return data;
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { authAPI, booksAPI, getToken, setToken, removeToken };
}


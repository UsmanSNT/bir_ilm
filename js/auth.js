// Authentication tizimi
class AuthSystem {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('birilm_users') || '[]');
        this.currentUser = JSON.parse(localStorage.getItem('birilm_currentUser') || 'null');
        this.adminKey = 'BIRILM_ADMIN_2024'; // Admin taklif kaliti
    }

    // Ro'yxatdan o'tish
    register(username, password, email, isAdmin = false, adminKey = '') {
        // Validatsiya
        if (!username || !password || !email) {
            return { success: false, message: 'Barcha maydonlarni to\'ldiring!' };
        }

        if (username.length < 3) {
            return { success: false, message: 'Foydalanuvchi nomi kamida 3 belgi bo\'lishi kerak!' };
        }

        if (password.length < 6) {
            return { success: false, message: 'Parol kamida 6 belgi bo\'lishi kerak!' };
        }

        // Admin kalitini tekshirish
        if (isAdmin && adminKey !== this.adminKey) {
            return { success: false, message: 'Noto\'g\'ri admin taklif kaliti!' };
        }

        // Foydalanuvchi mavjudligini tekshirish
        if (this.users.find(u => u.username === username)) {
            return { success: false, message: 'Bu foydalanuvchi nomi allaqachon mavjud!' };
        }

        if (this.users.find(u => u.email === email)) {
            return { success: false, message: 'Bu email allaqachon ro\'yxatdan o\'tgan!' };
        }

        // Yangi foydalanuvchi yaratish
        const newUser = {
            id: Date.now().toString(),
            username,
            password, // Haqiqiy loyihada hash qilinishi kerak
            email,
            role: isAdmin ? 'admin' : 'user',
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        localStorage.setItem('birilm_users', JSON.stringify(this.users));

        return { success: true, message: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz!', user: newUser };
    }

    // Tizimga kirish
    login(username, password) {
        const user = this.users.find(u => u.username === username && u.password === password);

        if (!user) {
            return { success: false, message: 'Noto\'g\'ri foydalanuvchi nomi yoki parol!' };
        }

        this.currentUser = user;
        localStorage.setItem('birilm_currentUser', JSON.stringify(user));

        return { success: true, message: 'Muvaffaqiyatli kirdingiz!', user };
    }

    // Tizimdan chiqish
    logout() {
        this.currentUser = null;
        localStorage.removeItem('birilm_currentUser');
    }

    // Joriy foydalanuvchi
    getCurrentUser() {
        return this.currentUser;
    }

    // Admin tekshiruvi
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    // Tizimga kirganligini tekshirish
    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Global auth instance
const auth = new AuthSystem();


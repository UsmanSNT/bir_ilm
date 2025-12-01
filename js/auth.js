// Authentication tizimi - Supabase bilan ishlaydi
class AuthSystem {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('birilm_user') || 'null');
        this.adminKey = 'BIRILM_ADMIN_2024'; // Admin taklif kaliti
    }

    // Ro'yxatdan o'tish
    async register(username, password, email, isAdmin = false, adminKey = '') {
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

        try {
            const result = await authAPI.register(username, email, password, isAdmin, adminKey);
            if (result.success) {
                this.currentUser = result.user;
            }
            return result;
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Tizimga kirish
    async login(username, password) {
        if (!username || !password) {
            return { success: false, message: 'Foydalanuvchi nomi va parolni kiriting!' };
        }

        try {
            const result = await authAPI.login(username, password);
            if (result.success) {
                this.currentUser = result.user;
            }
            return result;
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Tizimdan chiqish
    logout() {
        this.currentUser = null;
        authAPI.logout();
    }

    // Joriy foydalanuvchi
    getCurrentUser() {
        if (!this.currentUser) {
            this.currentUser = JSON.parse(localStorage.getItem('birilm_user') || 'null');
        }
        return this.currentUser;
    }

    // Foydalanuvchi ma'lumotlarini yangilash
    async refreshUser() {
        try {
            const result = await authAPI.getMe();
            if (result.success) {
                this.currentUser = result.user;
            }
            return result;
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Admin tekshiruvi
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }

    // Tizimga kirganligini tekshirish
    isAuthenticated() {
        return this.getCurrentUser() !== null;
    }

    // Tangalar sonini olish
    async getPoints() {
        try {
            const result = await authAPI.getPoints();
            return result;
        } catch (error) {
            return { success: false, sum: 0, message: error.message };
        }
    }

    // Pomodoro tangalarini qo'shish
    async addPomodoroPoints() {
        try {
            const result = await authAPI.addPomodoroPoints();
            if (result.success && this.currentUser) {
                this.currentUser.sum = result.sum;
                localStorage.setItem('birilm_user', JSON.stringify(this.currentUser));
            }
            return result;
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

// Global auth instance
const auth = new AuthSystem();

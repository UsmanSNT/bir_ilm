// Kitoblar va taqrizlar tizimi
class BookSystem {
    constructor() {
        this.books = JSON.parse(localStorage.getItem('birilm_books') || '[]');
    }

    // Yangi kitob taqrizi yaratish (faqat admin)
    createReview(bookTitle, author, reviewText, rating) {
        if (!bookTitle || !author || !reviewText) {
            return { success: false, message: 'Barcha maydonlarni to\'ldiring!' };
        }

        const currentUser = auth.getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return { success: false, message: 'Faqat adminlar taqriz yozishi mumkin!' };
        }

        const newBook = {
            id: Date.now().toString(),
            title: bookTitle,
            author: author,
            review: reviewText,
            rating: rating || 5,
            adminId: currentUser.id,
            adminName: currentUser.username,
            createdAt: new Date().toISOString(),
            likes: [],
            dislikes: [],
            comments: []
        };

        this.books.unshift(newBook); // Eng yangisi birinchi
        localStorage.setItem('birilm_books', JSON.stringify(this.books));

        return { success: true, message: 'Taqriz muvaffaqiyatli qo\'shildi!', book: newBook };
    }

    // Barcha kitoblarni olish
    getAllBooks() {
        return this.books;
    }

    // Kitobga like qo'shish
    addLike(bookId) {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) {
            return { success: false, message: 'Avval tizimga kiring!' };
        }

        const book = this.books.find(b => b.id === bookId);
        if (!book) {
            return { success: false, message: 'Kitob topilmadi!' };
        }

        // Agar dislike bo'lsa, uni olib tashlash
        book.dislikes = book.dislikes.filter(id => id !== currentUser.id);

        // Like qo'shish yoki olib tashlash
        const likeIndex = book.likes.indexOf(currentUser.id);
        if (likeIndex > -1) {
            book.likes.splice(likeIndex, 1);
            localStorage.setItem('birilm_books', JSON.stringify(this.books));
            return { success: true, message: 'Like olib tashlandi', liked: false };
        } else {
            book.likes.push(currentUser.id);
            localStorage.setItem('birilm_books', JSON.stringify(this.books));
            return { success: true, message: 'Like qo\'shildi', liked: true };
        }
    }

    // Kitobga dislike qo'shish
    addDislike(bookId) {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) {
            return { success: false, message: 'Avval tizimga kiring!' };
        }

        const book = this.books.find(b => b.id === bookId);
        if (!book) {
            return { success: false, message: 'Kitob topilmadi!' };
        }

        // Agar like bo'lsa, uni olib tashlash
        book.likes = book.likes.filter(id => id !== currentUser.id);

        // Dislike qo'shish yoki olib tashlash
        const dislikeIndex = book.dislikes.indexOf(currentUser.id);
        if (dislikeIndex > -1) {
            book.dislikes.splice(dislikeIndex, 1);
            localStorage.setItem('birilm_books', JSON.stringify(this.books));
            return { success: true, message: 'Dislike olib tashlandi', disliked: false };
        } else {
            book.dislikes.push(currentUser.id);
            localStorage.setItem('birilm_books', JSON.stringify(this.books));
            return { success: true, message: 'Dislike qo\'shildi', disliked: true };
        }
    }

    // Izoh qo'shish
    addComment(bookId, commentText) {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) {
            return { success: false, message: 'Avval tizimga kiring!' };
        }

        if (!commentText || commentText.trim().length === 0) {
            return { success: false, message: 'Izoh bo\'sh bo\'lishi mumkin emas!' };
        }

        const book = this.books.find(b => b.id === bookId);
        if (!book) {
            return { success: false, message: 'Kitob topilmadi!' };
        }

        const newComment = {
            id: Date.now().toString(),
            userId: currentUser.id,
            username: currentUser.username,
            text: commentText.trim(),
            createdAt: new Date().toISOString()
        };

        book.comments.push(newComment);
        localStorage.setItem('birilm_books', JSON.stringify(this.books));

        return { success: true, message: 'Izoh qo\'shildi!', comment: newComment };
    }

    // Kitobni o'chirish (faqat admin)
    deleteBook(bookId) {
        const currentUser = auth.getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return { success: false, message: 'Faqat adminlar kitobni o\'chirishi mumkin!' };
        }

        this.books = this.books.filter(b => b.id !== bookId);
        localStorage.setItem('birilm_books', JSON.stringify(this.books));

        return { success: true, message: 'Kitob o\'chirildi!' };
    }
}

// Global book system instance
const bookSystem = new BookSystem();


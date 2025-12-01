const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Uploads papkasini yaratish
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer sozlash
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Fayl nomini: timestamp-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'book-' + uniqueSuffix + ext);
    }
});

// Fayl turini tekshirish
const fileFilter = (req, file, cb) => {
    // Faqat rasm fayllarini qabul qilish
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Faqat rasm fayllari qabul qilinadi (jpg, png, gif, webp)'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

module.exports = upload;


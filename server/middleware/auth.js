const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'birilm_secret_key_2024_change_in_production';

// JWT token yaratish
function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// Token tekshirish middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token topilmadi' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Token yaroqsiz' });
        }
        req.user = user;
        next();
    });
}

// Admin tekshiruvi (admin va super_admin uchun)
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Admin huquqi kerak' });
    }
    next();
}

module.exports = {
    generateToken,
    authenticateToken,
    requireAdmin
};


const jwt = require('jsonwebtoken');
const config = require('../config');

// Middleware para proteger rutas privadas usando JWT
const authenticateJWT = (req, res, next) => {
    // 1) Intentar Authorization: Bearer TOKEN
    let token = req.headers.authorization?.split(' ')[1];
    // 2) Si no hay header, intentar cookie 'token'
    if (!token && req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado. Acceso denegado.' });
    }
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded; // { userId, username, role }
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token inválido o expirado.' });
    }
};

// Middleware para permitir solo roles admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado. Requiere rol de administrador.' });
    }
    next();
};

module.exports = { authenticateJWT, isAdmin };
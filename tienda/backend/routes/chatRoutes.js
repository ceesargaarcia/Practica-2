const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authenticateJWT');
const ChatMessage = require('../models/ChatMessage');

// Devuelve historial reciente del chat (solo usuarios autenticados)
router.get('/history', authenticateJWT, async (req, res) => {
    try {
        const history = await ChatMessage.find({}).sort({ timestamp: 1 }).limit(100);
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener historial de chat', error: err.message });
    }
});

module.exports = router;

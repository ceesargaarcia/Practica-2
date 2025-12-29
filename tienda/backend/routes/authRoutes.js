const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config');

// Registro de usuario
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Validaciones básicas
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Usuario o email ya registrado' });
        }

        // Crear nuevo usuario
        const user = new User({
            username,
            email,
            password,
            role: role || 'user'
        });

        await user.save();

        res.status(201).json({ 
            message: 'Usuario registrado exitosamente',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
    }
});

// Login de usuario
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validaciones
        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
        }

        // Buscar usuario
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Generar JWT
        const token = jwt.sign(
            { 
                userId: user._id, 
                username: user.username,
                role: user.role 
            },
            config.jwtSecret,
            { expiresIn: config.jwtExpire }
        );

        // Establecer cookie HttpOnly para rutas HTML protegidas
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('token', token, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 día
        });

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
    }
});

// Logout opcional: limpiar cookie
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logout exitoso' });
});

module.exports = router;
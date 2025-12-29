const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const config = require('./config');
const ChatMessage = require('./models/ChatMessage');
const { authenticateJWT } = require('./middleware/authenticateJWT');

// Rutas
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Cargar variables de entorno
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Token personalizado para morgan que muestra el usuario autenticado
morgan.token('user', (req) => {
  if (req.user && (req.user.username || req.user.userId)) {
    return req.user.username || req.user.userId;
  }
  return 'anon';
});

// Middlewares básicos
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined'));
app.use(express.static(path.join(__dirname, '../frontend')));

// Conexión a MongoDB
mongoose.connect(config.mongoUri || process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error al conectar a MongoDB:', err));

// Rutas API
app.use('/api/auth', authRoutes);
// Logger con usuario para rutas de productos (después de autenticar)
app.use(
  '/api/products',
  authenticateJWT,
  morgan(':remote-addr - :user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'),
  productRoutes
);
app.use('/api/chat', chatRoutes);

// Rutas HTML protegidas por JWT leído desde cookie o header
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'login.html'));
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'register.html'));
});
app.get('/', authenticateJWT, morgan(':remote-addr - :user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'), (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});
app.get('/products', authenticateJWT, morgan(':remote-addr - :user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'), (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'products.html'));
});
app.get('/chat', authenticateJWT, morgan(':remote-addr - :user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'), (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'chat.html'));
});

// Middleware de errores
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Error interno del servidor" });
});

// --- SOCKET.IO solo autenticados ---
const connectedUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Autenticación requerida para chat'));
  try {
    const decoded = require('jsonwebtoken').verify(token, config.jwtSecret || process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Token inválido para socket')); }
});

io.on('connection', async (socket) => {
  console.log(`✅ Usuario conectado: ${socket.user.username}`);

  connectedUsers.set(socket.id, socket.user.username);

  io.emit('user-connected', {
    username: socket.user.username,
    connectedUsers: Array.from(connectedUsers.values())
  });

  try {
    const history = await ChatMessage.find({}).sort({ timestamp: -1 }).limit(30).lean();
    socket.emit('chat-history', history.reverse());
  } catch (err) {
    socket.emit('chat-history', []);
  }

  socket.on('chat-message', async (message) => {
    const chatMsg = {
      username: socket.user.username,
      message: message,
      timestamp: new Date().toISOString()
    };
    try {
      await ChatMessage.create(chatMsg);
    } catch (error) {}
    io.emit('chat-message', chatMsg);
  });

  socket.on('typing', () => {
    socket.broadcast.emit('user-typing', socket.user.username);
  });
  socket.on('stop-typing', () => {
    socket.broadcast.emit('user-stop-typing', socket.user.username);
  });
  socket.on('disconnect', () => {
    console.log(`❌ Usuario desconectado: ${socket.user.username}`);
    connectedUsers.delete(socket.id);
    io.emit('user-disconnected', {
      username: socket.user.username,
      connectedUsers: Array.from(connectedUsers.values())
    });
  });
});

const PORT = config.port || process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});

module.exports = app;
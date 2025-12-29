# 🏪 Portal de Productos con Autenticación y Chat

Guía para ejecutar el proyecto completo (backend + frontend) desde cero en una máquina nueva.

---

## ⚙️ 1) Prerrequisitos

Asegúrate de tener instalados:

* **Node.js 18+** y **npm**
* **MongoDB** (local o en la nube con MongoDB Atlas)
* **Git** (opcional, si vas a clonar desde un repositorio)

Comprobación rápida:

```bash
node -v
npm -v
```

---

## 📦 2) Obtener el código

Clona el repositorio o copia la carpeta del proyecto:

```bash
git clone https://github.com/ceesargaarcia/Practica-1
cd tienda
```

---

## 📁 3) Estructura general del proyecto

```
tienda/
│
├── backend/              → Servidor Node.js + Express + MongoDB
│   ├── models/           → Modelos Mongoose
│   ├── routes/           → Rutas API (auth, products, chat)
│   ├── middleware/       → Autenticación JWT y control de roles
│   ├── server.js         → Punto de entrada del servidor
│   └── .env              → Variables de entorno
│
└── frontend/
    └── public/           → Archivos HTML, CSS y JS estáticos
```

---

## 🧩 4) Instalación de dependencias

Desde la carpeta **tienda**:

```bash
cd backend
npm install
```

---

## 🔑 5) Configurar variables de entorno

Crea un archivo `.env` dentro de `tienda/backend/` con el siguiente contenido (ajústalo según tu entorno):

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tienda
JWT_SECRET=cambia_esta_clave_por_una_segura
JWT_EXPIRE=24h
```

> 💡 Si usas **MongoDB Atlas**, reemplaza `MONGODB_URI` por la cadena de conexión que te proporciona Atlas.

---

## 🚀 6) Ejecutar la aplicación

Desde `tienda/backend`:

```bash
npm start
```

Deberías ver algo como:

```
✅ Conectado a MongoDB
🚀 Servidor corriendo en http://localhost:3000
```

---

## 👤 7) Crear un usuario administrador

Para gestionar productos necesitas un usuario con rol `admin`.

Crea uno con esta petición:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin1",
    "email": "admin1@example.com",
    "password": "Admin1234",
    "role": "admin"
  }'
```

---

## 🔐 8) Iniciar sesión y obtener el token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin1@example.com",
    "password": "Admin1234"
  }'
```

La respuesta incluirá el **token JWT** y los datos del usuario.
Este token se guarda automáticamente en el navegador por el frontend.

---

## 🌐 9) Acceso desde el navegador

Abre en tu navegador:

```
http://localhost:3000
```

Páginas disponibles:

| Ruta        | Descripción                           |
| ----------- | ------------------------------------- |
| `/register` | Registro de usuarios                  |
| `/login`    | Inicio de sesión                      |
| `/products` | Gestión de productos (requiere login) |
| `/chat`     | Chat en tiempo real (requiere login)  |

El **frontend (en `/frontend/public`)** ya gestiona el token JWT usando `localStorage` y lo envía en las peticiones y al conectarse al chat.

---

## 🧾 10) API de productos (modo desarrollador)

Todas las rutas requieren un token JWT.
Reemplaza `<TOKEN>` con el token recibido al hacer login.

**Listar productos:**

```bash
curl http://localhost:3000/api/products \
  -H "Authorization: Bearer <TOKEN>"
```

**Crear producto (solo admin):**

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Camisa",
    "description": "Camisa de algodón",
    "price": 29.99,
    "category": "ropa",
    "stock": 10,
    "imageUrl": "https://via.placeholder.com/300"
  }'
```

---

## 💬 11) Chat en tiempo real

* Ingresa a `/chat` desde el navegador (requiere estar logueado).
* El cliente conecta a **Socket.IO** pasando el token JWT.
* Se muestran:

  * Nombre de usuario
  * Mensajes en tiempo real
  * Indicador “usuario escribiendo…”

---

## 🧰 12) Solución de problemas

| Problema                                 | Solución                                                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| ❌ No conecta a MongoDB                   | Verifica que Mongo esté corriendo (`sudo systemctl status mongod`) o revisa la cadena en `.env`.               |
| ⚠️ `JWT_SECRET` no definido              | Asegúrate de tener `.env` creado en `backend/` y reinicia la app.                                              |
| 🚫 401/403 al acceder a productos o chat | Confirma que el token se envía en el header `Authorization: Bearer <TOKEN>` y que el usuario esté autenticado. |
| 🔄 Puerto en uso                         | Cambia `PORT` en `.env`.                                                                                       |

---

## 🧠 13) Scripts útiles

Modo desarrollo con autoreload:

```bash
npm run dev
```

---

✅ **La aplicación está lista para evaluación.**
Sigue los pasos anteriores para configurarla desde cero y ejecutar tanto el backend como el frontend correctamente.
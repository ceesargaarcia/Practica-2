## 🧩 **Resumen de las decisiones de diseño y motivos**

### 🔐 Autenticación JWT (Stateless)

* Se utiliza **JWT (JSON Web Token)** para implementar una autenticación sin estado (*stateless*).
* El token se **firma con la variable `JWT_SECRET`** y se devuelve al cliente tras el inicio de sesión.
* También se almacena como **cookie HttpOnly** para proteger las vistas HTML del frontend.
  *(Implementado en `tienda/backend/routes/authRoutes.js`)*
* El **middleware `authenticateJWT`** acepta el token desde:

  * El header `Authorization: Bearer <token>`
  * O la cookie `token`
* Esta doble opción permite flexibilidad entre llamadas API y vistas renderizadas.

---

### 👥 Roles y autorización

* Se definen **roles simples** (`user`, `admin`) en `tienda/backend/models/User.js`.
* El middleware `isAdmin` protege rutas sensibles, como el CRUD de productos, en `tienda/backend/routes/productRoutes.js`.
* Esto asegura control de acceso basado en roles.

---

### 🔑 Seguridad de contraseñas

* Las contraseñas se **hashean con `bcryptjs`** en el *hook* `userSchema.pre('save')`.
* El modelo `User` incluye el método `comparePassword` para validar credenciales.
  *(Implementado en `tienda/backend/models/User.js`)*

---

### ⚡ Socket.IO con autenticación

* El servidor valida el token JWT durante el **handshake** de Socket.IO.
* Si es válido, se añade `socket.user`, lo que evita conexiones anónimas o no autenticadas al chat en tiempo real.
  *(Implementado en `tienda/backend/server.js`)*

---

### 💾 Persistencia y modelos

* Se usa **Mongoose** para el modelado de datos.
* Los modelos `Product` y `ChatMessage` incluyen `timestamps` para trazabilidad.
  *(Ver `tienda/backend/models/Product.js` y `tienda/backend/models/ChatMessage.js`)*

---

### 🪵 Logging y trazabilidad

* Se usa **morgan** con un token personalizado `user` para incluir el nombre de usuario en los logs cuando esté disponible.
  *(Configurado en `tienda/backend/server.js`)*

---

### 🖥️ Frontend y experiencia de usuario

* El frontend se aloja en `tienda/frontend/public/`.
* El cliente (`tienda/frontend/public/client.js`) guarda el token en `localStorage` para llamadas API y lo pasa a Socket.IO.
* Esta decisión prioriza la **simplicidad para fines académicos**; en entornos productivos, se recomienda usar **cookies seguras** en lugar de `localStorage`.

---

### ⚙️ Validaciones y manejo de errores

* Se aplican **validaciones básicas** en las rutas de autenticación y productos.
* Las respuestas son consistentes, con mensajes de error estandarizados.
* Existe un **middleware global de manejo de errores** en `tienda/backend/server.js`.

---

### 💡 Sugerencias para mejoras futuras

* Añadir **tests automatizados** (unitarios e integrados) con Jest y Supertest.
* **Separar la lógica** en controladores (`controllers/`) para mejorar mantenibilidad.
* Implementar **refresh tokens** para sesiones más seguras y prolongadas.
* Agregar **paginación o límite** en el historial de chat.
* Incluir **escape/saneamiento de mensajes** para evitar ataques XSS o inyección de código.

---

### 📂 Referencias rápidas

| Componente                   | Ubicación                                                                  |
| ---------------------------- | -------------------------------------------------------------------------- |
| Servidor principal           | `tienda/backend/server.js`                                                 |
| Middlewares de autenticación | `tienda/backend/middleware/authenticateJWT.js`                             |
| Rutas principales            | `tienda/backend/routes/authRoutes.js`, `productRoutes.js`, `chatRoutes.js` |
| Modelos Mongoose             | `tienda/backend/models/User.js`, `Product.js`, `ChatMessage.js`            |
| Frontend estático            | `tienda/frontend/public/`                                                  |
| Cliente JS                   | `tienda/frontend/public/client.js`                                         |
# 🏪 E-Commerce con GraphQL - Práctica 2

Portal de productos evolucionado a un e-commerce completo con GraphQL, carrito de compras y gestión de pedidos.

---

## ⚙️ 1) Prerrequisitos

Asegúrate de tener instalados:

* **Node.js 18+** y **npm**
* **MongoDB** (local o en la nube con MongoDB Atlas)
* **Git**

Comprobación rápida:

```bash
node -v
npm -v
mongod --version
```

---

## 📦 2) Obtener el código

Clona el repositorio:

```bash
git clone https://github.com/ceesargaarcia/Practica-2
cd tienda
```

---

## 📁 3) Estructura del proyecto

```
tienda/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── ChatMessage.js
│   │   ├── Order.js          ✨ NUEVO
│   │   └── Cart.js           ✨ NUEVO
│   ├── graphql/              ✨ NUEVO
│   │   ├── schema.js
│   │   └── resolvers.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   └── chatRoutes.js
│   ├── middleware/
│   │   └── authenticateJWT.js
│   ├── server.js
│   ├── config.js
│   └── .env
└── frontend/
    ├── index.html
    ├── login.html
    ├── register.html
    ├── products.html
    ├── chat.html
    ├── cart.html            ✨ NUEVO
    ├── my-orders.html       ✨ NUEVO
    ├── admin-users.html     ✨ NUEVO
    ├── admin-orders.html    ✨ NUEVO
    ├── client.js
    └── styles.css
```

---

## 🧩 4) Instalación de dependencias

```bash
cd backend
npm install
```

**Dependencias principales:**
- `@apollo/server` - Servidor GraphQL
- `graphql` - Librería GraphQL
- `express` - Framework web
- `mongoose` - ODM para MongoDB
- `jsonwebtoken` - Autenticación JWT
- `socket.io` - Chat en tiempo real
- `bcryptjs` - Hash de contraseñas

---

## 🔑 5) Configurar variables de entorno

Crea un archivo `.env` en `tienda/backend/`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tienda
JWT_SECRET=tu_clave_secreta_super_segura_cambiala
JWT_EXPIRE=24h
```

> 💡 Para **MongoDB Atlas**, usa tu cadena de conexión completa.

---

## 🚀 6) Ejecutar la aplicación

Desde `tienda/backend`:

```bash
npm start
```

Deberías ver:

```
✅ Conectado a MongoDB
🚀 GraphQL disponible en http://localhost:3000/graphql
🚀 Servidor en http://localhost:3000
```

---

## 👤 7) Crear usuarios de prueba

### Crear usuario ADMINISTRADOR:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "Admin1234",
    "role": "admin"
  }'
```

### Crear usuario NORMAL:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usuario1",
    "email": "user1@example.com",
    "password": "User1234",
    "role": "user"
  }'
```

---

## 🔐 8) Iniciar sesión y obtener tokens

### Login como ADMIN:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin1234"
  }'
```

### Login como USUARIO:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@example.com",
    "password": "User1234"
  }'
```

**Guarda los tokens** devueltos en `token` para usarlos en las pruebas.

---

## 🌐 9) Acceso desde el navegador

Abre: `http://localhost:3000`

### Rutas disponibles:

| Ruta | Descripción | Requiere Login | Rol |
|------|-------------|----------------|-----|
| `/` | Página de inicio | No | - |
| `/register` | Registro de usuarios | No | - |
| `/login` | Inicio de sesión | No | - |
| `/products` | Catálogo de productos | Sí | Todos |
| `/cart` | Carrito de compras | Sí | User |
| `/my-orders` | Mis pedidos | Sí | User |
| `/admin/users` | Gestión de usuarios | Sí | Admin |
| `/admin/orders` | Gestión de pedidos | Sí | Admin |
| `/chat` | Chat en tiempo real | Sí | Todos |

---

## 🔧 10) GraphQL Playground

Accede a: `http://localhost:3000/graphql`

### Configurar Headers:

En la sección **HTTP HEADERS** (esquina inferior derecha):

```json
{
  "Authorization": "Bearer TU_TOKEN_JWT_AQUI"
}
```

---

## 📋 11) Pruebas rápidas de GraphQL

### ✅ Ver productos

```graphql
query {
  products {
    id
    name
    price
    stock
  }
}
```

### ✅ Añadir al carrito (Usuario)

```graphql
mutation AddToCart($productId: ID!, $quantity: Int!) {
  addToCart(productId: $productId, quantity: $quantity) {
    id
    items {
      product { name price }
      quantity
    }
  }
}
```

**Variables:**
```json
{
  "productId": "ID_DEL_PRODUCTO",
  "quantity": 2
}
```

### ✅ Ver mi carrito (Usuario)

```graphql
query {
  myCart {
    items {
      product { name price }
      quantity
    }
  }
}
```

### ✅ Crear pedido - Comprar (Usuario)

```graphql
mutation {
  createOrder {
    id
    total
    status
    items {
      name
      price
      quantity
    }
  }
}
```

### ✅ Ver mis pedidos (Usuario)

```graphql
query {
  myOrders {
    id
    total
    status
    createdAt
    items {
      name
      quantity
      price
    }
  }
}
```

### ✅ Ver todos los pedidos (Admin)

```graphql
query {
  orders {
    id
    total
    status
    user {
      username
      email
    }
  }
}
```

### ✅ Ver todos los usuarios (Admin)

```graphql
query {
  users {
    id
    username
    email
    role
    createdAt
  }
}
```

### ✅ Cambiar rol de usuario (Admin)

```graphql
mutation UpdateUserRole($id: ID!, $role: String!) {
  updateUserRole(id: $id, role: $role) {
    id
    username
    role
  }
}
```

**Variables:**
```json
{
  "id": "ID_DEL_USUARIO",
  "role": "admin"
}
```

### ✅ Marcar pedido como completado (Admin)

```graphql
mutation UpdateOrderStatus($orderId: ID!, $status: String!) {
  updateOrderStatus(orderId: $orderId, status: $status) {
    id
    status
    completedAt
  }
}
```

**Variables:**
```json
{
  "orderId": "ID_DEL_PEDIDO",
  "status": "completed"
}
```

---

## 🎯 12) Flujo completo de prueba

### Como USUARIO NORMAL:

1. Login → Obtener token
2. Ver productos (`products`)
3. Añadir productos al carrito (`addToCart`)
4. Ver carrito (`myCart`)
5. Crear pedido (`createOrder`)
6. Ver mis pedidos (`myOrders`)

### Como ADMINISTRADOR:

1. Login → Obtener token
2. Ver todos los usuarios (`users`)
3. Ver todos los pedidos (`orders`)
4. Filtrar pedidos pendientes (`orders(status: "pending")`)
5. Marcar pedido como completado (`updateOrderStatus`)
6. Cambiar rol de usuario (`updateUserRole`)

---

## 🧰 13) Solución de problemas

| Problema | Solución |
|----------|----------|
| Error de conexión a MongoDB | Verificar que MongoDB esté corriendo |
| Token inválido | Hacer login nuevamente y obtener token fresco |
| "Acceso denegado" en GraphQL | Verificar que el token sea de un usuario con el rol correcto |
| Stock insuficiente | Crear productos con más stock o reducir cantidad |
| Carrito vacío al crear pedido | Añadir productos al carrito antes de comprar |

---

## 🎓 14) Características implementadas

### ✅ Práctica 1 (Mantenidas):
- Autenticación JWT
- Roles (user/admin)
- CRUD de productos
- Chat en tiempo real con Socket.IO

### ✅ Práctica 2 (Nuevas):
- **GraphQL Server** con Apollo Server
- **Carrito de compras** persistente en BD
- **Gestión de pedidos** con estados
- **Panel de administrador** para usuarios y pedidos
- **Filtrado de pedidos** por estado
- **Actualización de stock** automática al comprar

---

## 📊 15) Tecnologías utilizadas

| Capa | Tecnología |
|------|------------|
| API GraphQL | Apollo Server 4 + GraphQL |
| API REST | Express.js |
| Base de datos | MongoDB + Mongoose |
| Autenticación | JWT (jsonwebtoken) |
| Tiempo real | Socket.IO |
| Frontend | HTML5 + CSS3 + JavaScript |
| Seguridad | bcryptjs, HttpOnly cookies |

---

## 📚 16) Documentación adicional

- [Queries y Mutations de GraphQL](./GRAPHQL.md) - Guía completa
- [Decisiones de diseño](./DESARROLLO.md) - Arquitectura y decisiones
- [API REST](./API.md) - Endpoints REST disponibles

---

## 👨‍💻 Autor

**César García**  
Práctica 2 - E-Commerce con GraphQL  

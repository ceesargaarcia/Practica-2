# 🧪 Guía de Pruebas Rápidas - Para Evaluación

Esta guía permite probar **todas las funcionalidades** de forma rápida y sistemática.

---

## ⚙️ Configuración Inicial (2 minutos)

### 1. Clonar e instalar
```bash
git clone https://github.com/ceesargaarcia/Practica-2
cd tienda/backend
npm install
```

### 2. Configurar .env
```bash
# Crear archivo .env con:
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tienda
JWT_SECRET=clave_secreta_para_evaluacion_2025
JWT_EXPIRE=24h
```

### 3. Iniciar servidor
```bash
npm start
```

**Verificar consola:**
```
✅ Conectado a MongoDB
🚀 GraphQL disponible en http://localhost:3000/graphql
🚀 Servidor en http://localhost:3000
```

---

## 👤 Crear Usuarios de Prueba (1 minuto)

### Usuario Administrador:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@test.com","password":"Admin123","role":"admin"}'
```

### Usuario Normal:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"usuario","email":"user@test.com","password":"User123","role":"user"}'
```

---

## 🔐 Obtener Tokens JWT

### Login Admin:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123"}'
```

**Guardar el TOKEN_ADMIN de la respuesta**

### Login Usuario:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"User123"}'
```

**Guardar el TOKEN_USER de la respuesta**

---

## 📦 Crear Productos de Prueba (REST)

```bash
# Producto 1
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -d '{"name":"Laptop Gaming","description":"Laptop de alta gama","price":1299.99,"category":"tecnologia","stock":10,"imageUrl":"https://via.placeholder.com/300"}'

# Producto 2
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -d '{"name":"Mouse Inalámbrico","description":"Mouse ergonómico","price":29.99,"category":"tecnologia","stock":50,"imageUrl":"https://via.placeholder.com/300"}'

# Producto 3
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -d '{"name":"Teclado Mecánico","description":"Teclado RGB","price":89.99,"category":"tecnologia","stock":25,"imageUrl":"https://via.placeholder.com/300"}'
```

---

## 🎯 PRUEBAS GRAPHQL (GraphQL Playground)

Abrir: `http://localhost:3000/graphql`

### Configurar Headers:

En **HTTP HEADERS** (esquina inferior derecha):

```json
{
  "Authorization": "Bearer TOKEN_AQUI"
}
```

---

## ✅ BLOQUE 1: Funciones de Usuario Normal

**Usar TOKEN_USER en headers**

### 1.1 Ver productos disponibles

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

**Copiar un `id` de producto para los siguientes pasos**

---

### 1.2 Añadir producto al carrito

```graphql
mutation AddToCart($productId: ID!, $quantity: Int!) {
  addToCart(productId: $productId, quantity: $quantity) {
    id
    items {
      product {
        name
        price
      }
      quantity
    }
  }
}
```

**Variables:**
```json
{
  "productId": "ID_DEL_PASO_1.1",
  "quantity": 2
}
```

---

### 1.3 Ver mi carrito

```graphql
query {
  myCart {
    items {
      product {
        name
        price
      }
      quantity
    }
  }
}
```

**Resultado esperado:** Carrito con el producto añadido

---

### 1.4 Añadir más productos al carrito

Repetir query 1.2 con otro `productId` diferente

---

### 1.5 Actualizar cantidad

```graphql
mutation UpdateCartItem($productId: ID!, $quantity: Int!) {
  updateCartItem(productId: $productId, quantity: $quantity) {
    items {
      product { name }
      quantity
    }
  }
}
```

**Variables:**
```json
{
  "productId": "ID_PRIMER_PRODUCTO",
  "quantity": 5
}
```

---

### 1.6 Crear pedido (COMPRAR)

```graphql
mutation {
  createOrder {
    id
    total
    status
    createdAt
    items {
      name
      price
      quantity
    }
  }
}
```

**Copiar el `id` del pedido creado**

**Verificar:**
- ✅ Status = "pending"
- ✅ Total calculado correctamente
- ✅ Items con snapshot de precios

---

### 1.7 Verificar carrito vacío

```graphql
query {
  myCart {
    items {
      quantity
    }
  }
}
```

**Resultado esperado:** `items: []`

---

### 1.8 Ver mis pedidos

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

**Verificar:** Aparece el pedido creado en 1.6

---

### 1.9 Ver detalle de un pedido

```graphql
query GetOrder($orderId: ID!) {
  order(id: $orderId) {
    id
    total
    status
    user {
      username
    }
    items {
      name
      quantity
    }
  }
}
```

**Variables:**
```json
{
  "orderId": "ID_DEL_PASO_1.6"
}
```

---

## ✅ BLOQUE 2: Funciones de Administrador

**Cambiar a TOKEN_ADMIN en headers**

### 2.1 Ver todos los usuarios

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

**Copiar un `id` de usuario con role "user"**

---

### 2.2 Ver todos los pedidos

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
    items {
      name
      quantity
    }
  }
}
```

**Verificar:** Aparece el pedido creado por el usuario

---

### 2.3 Filtrar pedidos pendientes

```graphql
query {
  orders(status: "pending") {
    id
    total
    user {
      username
    }
  }
}
```

---

### 2.4 Marcar pedido como completado

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

**Verificar:** `completedAt` tiene fecha

---

### 2.5 Filtrar pedidos completados

```graphql
query {
  orders(status: "completed") {
    id
    status
    completedAt
  }
}
```

**Verificar:** Aparece el pedido marcado como completado

---

### 2.6 Cambiar rol de usuario

```graphql
mutation UpdateUserRole($id: ID!, $role: String!) {
  updateUserRole(id: $id, role: $role) {
    id
    username
    role
  }
}
```

**Variables (user → admin):**
```json
{
  "id": "ID_DEL_PASO_2.1",
  "role": "admin"
}
```

**Verificar:** Usuario ahora tiene rol "admin"

---

### 2.7 Revertir rol

Repetir query 2.6 con:
```json
{
  "id": "ID_DEL_PASO_2.1",
  "role": "user"
}
```

---

### 2.8 Eliminar usuario (OPCIONAL)

```graphql
mutation DeleteUser($id: ID!) {
  deleteUser(id: $id) {
    id
    username
  }
}
```

**Variables:**
```json
{
  "id": "ID_DE_USUARIO_A_ELIMINAR"
}
```

**⚠️ NO eliminar el usuario de prueba principal**

---

## ✅ BLOQUE 3: Pruebas de Validación

### 3.1 Intentar añadir al carrito sin stock

Primero, actualizar un producto a stock 0 (REST):

```bash
curl -X PUT http://localhost:3000/api/products/ID_PRODUCTO \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -d '{"stock":0}'
```

Luego intentar añadir al carrito (GraphQL):

```graphql
mutation AddToCart($productId: ID!, $quantity: Int!) {
  addToCart(productId: $productId, quantity: $quantity) {
    id
  }
}
```

**Resultado esperado:** Error "Stock insuficiente"

---

### 3.2 Usuario intentar ver pedidos de admin

Con **TOKEN_USER**, ejecutar:

```graphql
query {
  orders {
    id
  }
}
```

**Resultado esperado:** Error "Acceso denegado"

---

### 3.3 Usuario intentar gestionar usuarios

Con **TOKEN_USER**, ejecutar:

```graphql
query {
  users {
    id
  }
}
```

**Resultado esperado:** Error "Acceso denegado"

---

## ✅ BLOQUE 4: Frontend (Navegador)

### 4.1 Login como usuario
1. Ir a: `http://localhost:3000/login`
2. Email: `user@test.com`
3. Password: `User123`
4. Verificar redirección a `/products`

### 4.2 Navegación de usuario
**Verificar que aparecen:**
- ✅ 📦 Productos
- ✅ 🛒 Carrito
- ✅ 📋 Mis Pedidos
- ✅ 💬 Chat

**NO deben aparecer:**
- ❌ 👥 Usuarios
- ❌ 📦 Pedidos (admin)

### 4.3 Añadir al carrito desde frontend
1. Click en "Añadir al Carrito"
2. Verificar contador del carrito se actualiza
3. Ir a `/cart`
4. Verificar productos en el carrito

### 4.4 Comprar desde frontend
1. En `/cart`, click "Finalizar Compra"
2. Confirmar
3. Verificar redirección a `/my-orders`
4. Verificar pedido creado

### 4.5 Login como admin
1. Cerrar sesión
2. Login con `admin@test.com` / `Admin123`
3. Verificar navegación de admin

**Deben aparecer:**
- ✅ 📦 Productos
- ✅ 👥 Usuarios
- ✅ 📦 Pedidos

**NO deben aparecer:**
- ❌ 🛒 Carrito
- ❌ 📋 Mis Pedidos

### 4.6 Gestionar pedidos desde frontend
1. Ir a `/admin/orders`
2. Ver todos los pedidos
3. Filtrar pendientes
4. Marcar como completado
5. Verificar cambio de estado

### 4.7 Gestionar usuarios desde frontend
1. Ir a `/admin/users`
2. Ver lista de usuarios
3. Cambiar rol de un usuario
4. Verificar cambio

---

## ⏱️ Tiempo Estimado de Evaluación

- ⚙️ Configuración inicial: **2 min**
- 👤 Crear usuarios: **1 min**
- 📦 Crear productos: **2 min**
- ✅ Bloque 1 (Usuario): **5 min**
- ✅ Bloque 2 (Admin): **5 min**
- ✅ Bloque 3 (Validaciones): **3 min**
- ✅ Bloque 4 (Frontend): **5 min**

**Total: ~25 minutos**

---

## 🚨 Problemas Comunes

| Problema | Solución |
|----------|----------|
| MongoDB no conecta | Iniciar servicio: `sudo systemctl start mongod` |
| Token inválido | Hacer login nuevamente |
| "Acceso denegado" | Verificar rol del usuario en el token |
| Stock insuficiente | Actualizar stock del producto |
| Carrito vacío | Añadir productos antes de comprar |

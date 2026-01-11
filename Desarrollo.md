# 🧩 Decisiones de Diseño - Práctica 2

---

## 🔐 Autenticación JWT (Stateless)

* Se utiliza **JWT (JSON Web Token)** para implementar una autenticación sin estado (*stateless*).
* El token se **firma con la variable `JWT_SECRET`** y se devuelve al cliente tras el inicio de sesión.
* También se almacena como **cookie HttpOnly** para proteger las vistas HTML del frontend.
  *(Implementado en `tienda/backend/routes/authRoutes.js`)*
* El **middleware `authenticateJWT`** acepta el token desde:
  * El header `Authorization: Bearer <token>`
  * O la cookie `token`
* Esta doble opción permite flexibilidad entre llamadas API y vistas renderizadas.

**Integración con GraphQL:**
- El servidor GraphQL extrae el token del header o cookie en el contexto
- Cada resolver tiene acceso a `context.user` con los datos decodificados del token
- Se validan permisos en cada resolver según el rol del usuario

---

## 👥 Roles y autorización

* Se definen **roles simples** (`user`, `admin`) en `tienda/backend/models/User.js`.
* El middleware `isAdmin` protege rutas REST sensibles, como el CRUD de productos.
* En **GraphQL**, la autorización se maneja en los resolvers:
  * Cada resolver verifica `context.user.role`
  * Se lanzan errores personalizados si el rol es insuficiente
  * Ejemplo: `if (context.user.role !== 'admin') throw new Error('Acceso denegado')`

**Control de acceso por rol:**

| Funcionalidad | Usuario | Admin |
|---------------|---------|-------|
| Ver productos | ✅ | ✅ |
| Gestionar carrito | ✅ | ❌ |
| Crear pedidos | ✅ | ❌ |
| Ver propios pedidos | ✅ | ❌ |
| Ver todos los pedidos | ❌ | ✅ |
| Gestionar usuarios | ❌ | ✅ |
| Actualizar estado pedidos | ❌ | ✅ |

---

## 🔑 Seguridad de contraseñas

* Las contraseñas se **hashean con `bcryptjs`** en el *hook* `userSchema.pre('save')`.
* El modelo `User` incluye el método `comparePassword` para validar credenciales.
  *(Implementado en `tienda/backend/models/User.js`)*
* Las contraseñas **nunca** se devuelven en las queries de GraphQL (se usa `.select('-password')`)

---

## 🎨 Arquitectura GraphQL

### Decisión: Apollo Server 4

**Motivos:**
- Integración nativa con Express
- Soporte para autenticación mediante contexto
- Herramientas de desarrollo (GraphQL Playground)
- Documentación automática del schema

**Implementación:**
```javascript
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
});

await apolloServer.start();

app.use(
  '/graphql',
  expressMiddleware(apolloServer, {
    context: async ({ req }) => {
      // Extraer y validar JWT
      const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
      if (token) {
        const decoded = jwt.verify(token, config.jwtSecret);
        return { user: decoded };
      }
      return { user: null };
    }
  })
);
```

---

## 🗄️ Modelos de Datos

### Order (Pedido)

**Decisión:** Guardar snapshot de productos

**Motivo:** Los precios y nombres pueden cambiar en el futuro. Se guarda una copia en el momento de la compra para mantener la integridad histórica.

```javascript
{
  user: ObjectId,          // Referencia al usuario
  items: [{
    product: ObjectId,     // Referencia (para obtener imagen actualizada)
    name: String,          // Snapshot del nombre
    price: Number,         // Snapshot del precio
    quantity: Number       // Cantidad comprada
  }],
  total: Number,           // Total calculado
  status: String,          // 'pending' | 'completed'
  createdAt: Date,
  completedAt: Date        // Solo cuando status = 'completed'
}
```

### Cart (Carrito)

**Decisión:** Persistencia en base de datos (no localStorage)

**Motivos:**
- El carrito sobrevive entre sesiones
- Accesible desde cualquier dispositivo
- Permite recuperación si se cierra el navegador

```javascript
{
  user: ObjectId,          // Un carrito por usuario (unique: true)
  items: [{
    product: ObjectId,     // Referencia al producto
    quantity: Number       // Cantidad en el carrito
  }],
  updatedAt: Date
}
```

---

## 🔄 Flujo de Compra

### Proceso de createOrder:

1. **Validar carrito:** Verificar que no esté vacío
2. **Verificar stock:** Para cada producto, validar disponibilidad
3. **Reducir stock:** Actualizar `product.stock -= quantity`
4. **Crear snapshot:** Guardar nombre y precio actual del producto
5. **Calcular total:** Sumar `price * quantity` de todos los items
6. **Crear pedido:** Guardar en BD con status "pending"
7. **Vaciar carrito:** `cart.items = []`
8. **Retornar pedido:** Con todos los detalles

**Transaccionalidad:**
- Aunque Mongoose no usa transacciones explícitas aquí, el proceso es secuencial
- En producción, se recomendaría usar transacciones de MongoDB para garantizar atomicidad

---

## ⚡ Socket.IO con autenticación

* El servidor valida el token JWT durante el **handshake** de Socket.IO.
* Si es válido, se añade `socket.user`, lo que evita conexiones anónimas o no autenticadas al chat en tiempo real.
  *(Implementado en `tienda/backend/server.js`)*
* El chat sigue funcionando independientemente de GraphQL

---

## 💾 Persistencia y modelos

* Se usa **Mongoose** para el modelado de datos.
* Los modelos incluyen `timestamps` para trazabilidad:
  * `Product`: `createdAt`, `updatedAt`
  * `ChatMessage`: `timestamp`
  * `Order`: `createdAt`, `completedAt`
  * `Cart`: `updatedAt`

**Índices para optimización:**
```javascript
// Order
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

// Cart
cartSchema.index({ user: 1 }, { unique: true });
```

---

## 🖥️ Frontend y experiencia de usuario

* El frontend se mantiene en **vanilla JavaScript** para simplicidad académica
* Se usa `fetch` nativo para llamadas GraphQL (no Apollo Client)
* El token se guarda en `localStorage` y se envía en los headers
* **Navegación diferenciada por rol:**
  * Usuarios normales: Productos, Carrito, Mis Pedidos, Chat
  * Administradores: Productos, Usuarios, Pedidos (todos), Chat

**Ejemplo de llamada GraphQL desde el frontend:**

```javascript
async function graphqlRequest(query, variables = {}) {
  const response = await fetch('/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query, variables })
  });

  const result = await response.json();
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }
  return result.data;
}
```

---

## ⚙️ Validaciones y manejo de errores

* Se aplican **validaciones básicas** en:
  * Rutas REST de autenticación
  * Resolvers de GraphQL (stock, permisos, existencia de datos)
* Las respuestas son consistentes:
  * REST: `{ message: "...", error: "..." }`
  * GraphQL: `{ errors: [{ message: "..." }] }`
* Existe un **middleware global de manejo de errores** en `tienda/backend/server.js`

**Validaciones en GraphQL:**
```javascript
// Ejemplo: addToCart resolver
if (!context.user) throw new Error('No autenticado');

const product = await Product.findById(productId);
if (!product) throw new Error('Producto no encontrado');

if (product.stock < quantity) {
  throw new Error('Stock insuficiente');
}
```

---

## 🚀 Escalabilidad y rendimiento

### Decisiones actuales (académicas):

- ✅ Sin paginación en listados (apropiado para datasets pequeños)
- ✅ Sin caché de GraphQL (simplicidad)
- ✅ Consultas no optimizadas con DataLoader

### Mejoras para producción:

- 📊 Implementar **paginación** en `products`, `orders`, `users`
- ⚡ Usar **DataLoader** para evitar N+1 queries
- 💾 Implementar **caché de Redis** para queries frecuentes
- 🔐 Rate limiting en el endpoint GraphQL
- 📈 Monitoreo con Apollo Studio

---

## 🔀 GraphQL vs REST

### Rutas que permanecen en REST:

- `/api/auth/register` - Registro de usuarios
- `/api/auth/login` - Inicio de sesión
- `/api/auth/logout` - Cerrar sesión
- `/api/products` - CRUD de productos (admin)

**Motivo:** Simplicidad y compatibilidad con la Práctica 1

### Migradas a GraphQL:

- ✅ Lectura de productos (`products`, `product`)
- ✅ Gestión completa del carrito
- ✅ Gestión completa de pedidos
- ✅ Gestión de usuarios (admin)

**Ventajas de GraphQL en este proyecto:**
- Menos over-fetching (cliente pide solo lo que necesita)
- Documentación automática del schema
- Un solo endpoint para múltiples operaciones
- Type safety en las operaciones

---

## 💡 Sugerencias para mejoras futuras

* Añadir **tests automatizados** (unitarios e integrados) con Jest y Supertest
* **Separar la lógica** en controladores (`controllers/`) para mejorar mantenibilidad
* Implementar **refresh tokens** para sesiones más seguras y prolongadas
* Agregar **paginación** en listados de productos y pedidos
* Implementar **DataLoader** para optimizar queries de GraphQL
* Añadir **validaciones con Joi** o **class-validator**
* Implementar **rate limiting** en GraphQL
* Agregar **logging estructurado** con Winston
* Implementar **transacciones de MongoDB** en el flujo de compra
* Añadir **notificaciones en tiempo real** con Socket.IO cuando cambia el estado de un pedido
* Implementar **búsqueda y filtros** de productos
* Añadir **imágenes reales** con upload a S3 o Cloudinary
* Implementar **métodos de pago** (Stripe, PayPal)

---

## 📂 Referencias rápidas

| Componente | Ubicación |
|------------|-----------|
| Servidor principal | `tienda/backend/server.js` |
| Schema GraphQL | `tienda/backend/graphql/schema.js` |
| Resolvers GraphQL | `tienda/backend/graphql/resolvers.js` |
| Middlewares de autenticación | `tienda/backend/middleware/authenticateJWT.js` |
| Rutas REST | `tienda/backend/routes/` |
| Modelos Mongoose | `tienda/backend/models/` |
| Frontend estático | `tienda/frontend/` |
| Cliente JS (GraphQL) | `tienda/frontend/client.js` |

---

## 🎯 Cumplimiento de Requisitos - Práctica 2

| Requisito | Implementación | Ubicación |
|-----------|----------------|-----------|
| CRUD usuarios (admin) | ✅ GraphQL mutations | `resolvers.js` - `deleteUser`, `updateUserRole` |
| Carrito de compra | ✅ Modelo + GraphQL | `models/Cart.js` + resolvers |
| Persistencia carrito | ✅ MongoDB | `Cart` collection |
| Botón añadir al carrito | ✅ Frontend + GraphQL | `products.html` + `addToCart` mutation |
| Visualización carrito | ✅ Frontend + GraphQL | `cart.html` + `myCart` query |
| Finalizar compra | ✅ GraphQL mutation | `createOrder` |
| Vaciar carrito al comprar | ✅ Automático | `createOrder` resolver |
| Modelo Order | ✅ Mongoose | `models/Order.js` |
| Estados pedidos | ✅ pending/completed | `Order.status` |
| Gestión pedidos (admin) | ✅ GraphQL queries/mutations | `orders`, `updateOrderStatus` |
| Filtrar por estado | ✅ GraphQL query con parámetro | `orders(status: "...")` |
| Ver detalle pedido | ✅ GraphQL query | `order(id: "...")` |
| Servidor GraphQL | ✅ Apollo Server 4 | `server.js` |
| Queries productos | ✅ | `products`, `product` |
| Mutations carrito/pedidos | ✅ | `addToCart`, `createOrder`, etc. |
| Auth JWT en GraphQL | ✅ Context | `expressMiddleware` context |
| Funcionalidades previas | ✅ Mantenidas | Auth, Chat, CRUD productos |

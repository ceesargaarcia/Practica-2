const typeDefs = `#graphql
  # Tipos de datos
  type User {
    id: ID!
    username: String!
    email: String!
    role: String!
    createdAt: String!
  }

  type Product {
    id: ID!
    name: String!
    description: String!
    price: Float!
    category: String!
    stock: Int!
    imageUrl: String
    createdBy: User
    createdAt: String!
    updatedAt: String!
  }

  type OrderItem {
    product: Product!
    name: String!
    price: Float!
    quantity: Int!
  }

  type Order {
    id: ID!
    user: User!
    items: [OrderItem!]!
    total: Float!
    status: String!
    createdAt: String!
    completedAt: String
  }

  type CartItem {
    product: Product!
    quantity: Int!
  }

  type Cart {
    id: ID!
    user: User!
    items: [CartItem!]!
    updatedAt: String!
  }

  # Inputs
  input CartItemInput {
    productId: ID!
    quantity: Int!
  }

  # Queries
  type Query {
    # Productos
    products: [Product!]!
    product(id: ID!): Product

    # Pedidos
    orders(status: String): [Order!]!
    order(id: ID!): Order
    myOrders: [Order!]!

    # Carrito
    myCart: Cart

    # Usuarios (solo admin)
    users: [User!]!
    user(id: ID!): User
  }

  # Mutations
  type Mutation {
    # Carrito
    addToCart(productId: ID!, quantity: Int!): Cart!
    removeFromCart(productId: ID!): Cart!
    updateCartItem(productId: ID!, quantity: Int!): Cart!
    clearCart: Cart!

    # Pedidos
    createOrder: Order!
    updateOrderStatus(orderId: ID!, status: String!): Order!

    # Usuarios (solo admin)
    deleteUser(id: ID!): User!
    updateUserRole(id: ID!, role: String!): User!
  }
`;

module.exports = typeDefs;
const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');

const resolvers = {
  Query: {
    // Productos
    products: async () => {
      return await Product.find().populate('createdBy', 'username role');
    },
    product: async (_, { id }) => {
      return await Product.findById(id).populate('createdBy', 'username role');
    },

    // Pedidos
    orders: async (_, { status }, context) => {
      if (!context.user) throw new Error('No autenticado');
      if (context.user.role !== 'admin') throw new Error('Acceso denegado');

      const filter = status ? { status } : {};
      return await Order.find(filter)
        .populate('user', 'username email')
        .populate('items.product')
        .sort({ createdAt: -1 });
    },
    order: async (_, { id }, context) => {
      if (!context.user) throw new Error('No autenticado');

      const order = await Order.findById(id)
        .populate('user', 'username email')
        .populate('items.product');

      if (!order) throw new Error('Pedido no encontrado');
      
      // Solo el propietario o admin pueden ver el pedido
      if (context.user.role !== 'admin' && order.user._id.toString() !== context.user.userId) {
        throw new Error('Acceso denegado');
      }

      return order;
    },
    myOrders: async (_, __, context) => {
      if (!context.user) throw new Error('No autenticado');

      return await Order.find({ user: context.user.userId })
        .populate('items.product')
        .sort({ createdAt: -1 });
    },

    // Carrito
    myCart: async (_, __, context) => {
      if (!context.user) throw new Error('No autenticado');

      let cart = await Cart.findOne({ user: context.user.userId })
        .populate('items.product');

      if (!cart) {
        cart = await Cart.create({ user: context.user.userId, items: [] });
        return cart;
      }

      return cart;
    },

    // Usuarios
    users: async (_, __, context) => {
      if (!context.user) throw new Error('No autenticado');
      if (context.user.role !== 'admin') throw new Error('Acceso denegado');

      return await User.find().select('-password').sort({ createdAt: -1 });
    },
    user: async (_, { id }, context) => {
      if (!context.user) throw new Error('No autenticado');
      if (context.user.role !== 'admin' && context.user.userId !== id) {
        throw new Error('Acceso denegado');
      }

      return await User.findById(id).select('-password');
    }
  },

  Mutation: {
    // Carrito
    addToCart: async (_, { productId, quantity }, context) => {
      if (!context.user) throw new Error('No autenticado');

      const product = await Product.findById(productId);
      if (!product) throw new Error('Producto no encontrado');
      if (product.stock < quantity) throw new Error('Stock insuficiente');

      let cart = await Cart.findOne({ user: context.user.userId });

      if (!cart) {
        cart = await Cart.create({
          user: context.user.userId,
          items: [{ product: productId, quantity }]
        });
      } else {
        const existingItem = cart.items.find(
          item => item.product.toString() === productId
        );

        if (existingItem) {
          existingItem.quantity += quantity;
          if (existingItem.quantity > product.stock) {
            throw new Error('Stock insuficiente');
          }
        } else {
          cart.items.push({ product: productId, quantity });
        }

        await cart.save();
      }

      return await Cart.findById(cart._id).populate('items.product');
    },

    removeFromCart: async (_, { productId }, context) => {
      if (!context.user) throw new Error('No autenticado');

      const cart = await Cart.findOne({ user: context.user.userId });
      if (!cart) throw new Error('Carrito no encontrado');

      cart.items = cart.items.filter(
        item => item.product.toString() !== productId
      );

      await cart.save();
      return await Cart.findById(cart._id).populate('items.product');
    },

    updateCartItem: async (_, { productId, quantity }, context) => {
      if (!context.user) throw new Error('No autenticado');

      const product = await Product.findById(productId);
      if (!product) throw new Error('Producto no encontrado');
      if (product.stock < quantity) throw new Error('Stock insuficiente');

      const cart = await Cart.findOne({ user: context.user.userId });
      if (!cart) throw new Error('Carrito no encontrado');

      const item = cart.items.find(
        item => item.product.toString() === productId
      );

      if (!item) throw new Error('Producto no está en el carrito');

      item.quantity = quantity;
      await cart.save();

      return await Cart.findById(cart._id).populate('items.product');
    },

    clearCart: async (_, __, context) => {
      if (!context.user) throw new Error('No autenticado');

      const cart = await Cart.findOne({ user: context.user.userId });
      if (!cart) {
        // Crear carrito vacío si no existe
        const newCart = await Cart.create({ 
          user: context.user.userId, 
          items: [] 
        });
        return newCart;
      }

      cart.items = [];
      await cart.save();

      return await Cart.findById(cart._id).populate('items.product');
    },

    // Pedidos
    createOrder: async (_, __, context) => {
      if (!context.user) throw new Error('No autenticado');

      const cart = await Cart.findOne({ user: context.user.userId })
        .populate('items.product');

      if (!cart || cart.items.length === 0) {
        throw new Error('El carrito está vacío');
      }

      // Verificar stock y preparar items del pedido
      const orderItems = [];
      let total = 0;

      for (const item of cart.items) {
        const product = await Product.findById(item.product._id);
        
        if (!product) {
          throw new Error(`Producto ${item.product.name} no encontrado`);
        }
        
        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.name}`);
        }

        // Actualizar stock
        product.stock -= item.quantity;
        await product.save();

        // Agregar item al pedido
        orderItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity
        });

        total += product.price * item.quantity;
      }

      // Crear pedido
      const order = await Order.create({
        user: context.user.userId,
        items: orderItems,
        total,
        status: 'pending'
      });

      // Vaciar carrito
      cart.items = [];
      await cart.save();

      return await Order.findById(order._id)
        .populate('user', 'username email')
        .populate('items.product');
    },

    updateOrderStatus: async (_, { orderId, status }, context) => {
      if (!context.user) throw new Error('No autenticado');
      if (context.user.role !== 'admin') throw new Error('Acceso denegado');

      const order = await Order.findById(orderId);
      if (!order) throw new Error('Pedido no encontrado');

      order.status = status;
      if (status === 'completed') {
        order.completedAt = new Date();
      }

      await order.save();

      return await Order.findById(order._id)
        .populate('user', 'username email')
        .populate('items.product');
    },

    // Usuarios
    deleteUser: async (_, { id }, context) => {
      if (!context.user) throw new Error('No autenticado');
      if (context.user.role !== 'admin') throw new Error('Acceso denegado');

      const user = await User.findByIdAndDelete(id).select('-password');
      if (!user) throw new Error('Usuario no encontrado');

      return user;
    },

    updateUserRole: async (_, { id, role }, context) => {
      if (!context.user) throw new Error('No autenticado');
      if (context.user.role !== 'admin') throw new Error('Acceso denegado');

      if (!['user', 'admin'].includes(role)) {
        throw new Error('Rol inválido');
      }

      const user = await User.findByIdAndUpdate(
        id,
        { role },
        { new: true }
      ).select('-password');

      if (!user) throw new Error('Usuario no encontrado');

      return user;
    }
  }
};

module.exports = resolvers;
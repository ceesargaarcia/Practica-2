const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { authenticateJWT, isAdmin } = require("../middleware/authenticateJWT");

// Obtener TODOS los productos (solo autenticados)
router.get("/", authenticateJWT, async (req, res) => {
  try {
    // Permitir ordenación y proyección si se desea
    const productos = await Product.find().sort({ createdAt: -1 }).populate('createdBy', 'username role');
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message || "Error al obtener productos" });
  }
});

// Obtener producto por ID
router.get("/:id", authenticateJWT, async (req, res) => {
  try {
    const producto = await Product.findById(req.params.id).populate('createdBy', 'username role');
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(producto);
  } catch (err) {
    res.status(500).json({ error: err.message || "Error al obtener producto" });
  }
});

// Crear producto (solo ADMIN)
router.post("/", authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { name, description, price, category, stock, imageUrl } = req.body;
    if (!name || !description || price === undefined || !category) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const nuevo = new Product({
      name,
      description,
      price,
      category,
      stock: stock || 0,
      imageUrl: imageUrl || "https://via.placeholder.com/300",
      createdBy: req.user.userId
    });
    await nuevo.save();
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(500).json({ error: err.message || "Error al crear producto" });
  }
});

// Actualizar producto (solo ADMIN)
router.put("/:id", authenticateJWT, isAdmin, async (req, res) => {
  try {
    const actualizado = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!actualizado) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(actualizado);
  } catch (err) {
    res.status(500).json({ error: err.message || "Error al actualizar producto" });
  }
});

// Eliminar producto (solo ADMIN)
router.delete("/:id", authenticateJWT, isAdmin, async (req, res) => {
  try {
    const eliminado = await Product.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ error: "Producto no encontrado" });
    res.json({ mensaje: "Producto eliminado" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error al eliminar producto" });
  }
});

module.exports = router;
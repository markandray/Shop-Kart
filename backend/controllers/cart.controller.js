const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

// Load the cart with live product data (latest price/stock),
// and drop rows whose product was deleted.
const getPopulatedCart = async (customerId) => {
  const customer = await Customer.findById(customerId).populate({
    path: "cart.product",
    select: "name price category image stock",
  });
  return customer.cart
    .filter((item) => item.product)
    .map((item) => ({ product: item.product, quantity: item.quantity }));
};

const findCartItem = (customer, productId) =>
  customer.cart.find((item) => item.product.equals(productId));

// POST /cart/:productId
const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const product = await Product.findById(productId).select("stock");
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const existing = findCartItem(req.user, productId);
    const newQuantity = (existing ? existing.quantity : 0) + 1;

    if (newQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message:
          product.stock === 0
            ? "Product is out of stock"
            : `Only ${product.stock} unit(s) available`,
      });
    }

    if (existing) {
      await Customer.updateOne(
        { _id: req.user._id, "cart.product": productId },
        { $set: { "cart.$.quantity": newQuantity } }
      );
    } else {
      // $ne guard: never creates a duplicate row, even on a double-click race
      await Customer.updateOne(
        { _id: req.user._id, "cart.product": { $ne: productId } },
        { $push: { cart: { product: productId, quantity: 1 } } }
      );
    }

    const cart = await getPopulatedCart(req.user._id);
    res.status(200).json({ success: true, message: "Cart updated", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /cart
const getCart = async (req, res) => {
  try {
    const cart = await getPopulatedCart(req.user._id);
    res.status(200).json({ success: true, cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /cart/:productId   body: { quantity }
const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }
    if (typeof quantity !== "number" || !Number.isInteger(quantity)) {
      return res.status(400).json({ success: false, message: "Quantity must be a whole number" });
    }
    if (quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }

    const product = await Product.findById(productId).select("stock");
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    if (!findCartItem(req.user, productId)) {
      return res.status(404).json({ success: false, message: "Product not in cart" });
    }
    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} unit(s) available`,
      });
    }

    await Customer.updateOne(
      { _id: req.user._id, "cart.product": productId },
      { $set: { "cart.$.quantity": quantity } }
    );

    const cart = await getPopulatedCart(req.user._id);
    res.status(200).json({ success: true, message: "Quantity updated", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /cart/:productId
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }
    if (!findCartItem(req.user, productId)) {
      return res.status(404).json({ success: false, message: "Product not in cart" });
    }

    await Customer.updateOne(
      { _id: req.user._id },
      { $pull: { cart: { product: productId } } }
    );

    const cart = await getPopulatedCart(req.user._id);
    res.status(200).json({ success: true, message: "Removed from cart", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { addToCart, getCart, updateQuantity, removeFromCart };
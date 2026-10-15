const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

const isInWishlist = (customer, productId) =>
  customer.wishlist.some((id) => id.equals(productId));

// POST /wishlist/:productId
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(productId).select("_id");
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (isInWishlist(req.user, productId)) {
      return res.status(409).json({ success: false, message: "Product already in wishlist" });
    }

    // $addToSet is atomic and never inserts a duplicate, even if two requests race
    await Customer.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: productId } });

    return res.status(201).json({ success: true, message: "Product added to wishlist" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /wishlist
const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: "wishlist",
      select: "name price category image stock",
    });

    return res.status(200).json({
      success: true,
      count: customer.wishlist.length,
      wishlist: customer.wishlist,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /wishlist/:productId
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    if (!isInWishlist(req.user, productId)) {
      return res.status(404).json({ success: false, message: "Product not in wishlist" });
    }

    await Customer.updateOne({ _id: req.user._id }, { $pull: { wishlist: productId } });

    return res.status(200).json({ success: true, message: "Product removed from wishlist" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /wishlist/:productId/toggle
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    // Already saved -> remove it
    if (isInWishlist(req.user, productId)) {
      await Customer.updateOne({ _id: req.user._id }, { $pull: { wishlist: productId } });
      return res
        .status(200)
        .json({ success: true, saved: false, message: "Product removed from wishlist" });
    }

    // Not saved -> the product must exist before we add it
    const product = await Product.findById(productId).select("_id");
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await Customer.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: productId } });
    return res
      .status(200)
      .json({ success: true, saved: true, message: "Product added to wishlist" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { addToWishlist, getWishlist, removeFromWishlist, toggleWishlist };
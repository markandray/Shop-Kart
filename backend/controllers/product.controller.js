const mongoose = require("mongoose");
const Product = require("../models/product.model");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SORTS = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
};

// POST /products
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;
    const product = await Product.create({ name, description, price, category, image, stock });
    return res.status(201).json({ success: true, message: "Product created", product });
  } catch (error) {
    // Missing fields, price <= 0, stock < 0, non-numeric values all land here
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ success: false, message });
    }
    console.error("createProduct error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// GET /products?search=&category=&sort=
const getProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const filter = {};

    if (typeof search === "string" && search.trim()) {
      // escape user input so "c++" or "(" can't break or abuse the regex
      filter.name = { $regex: escapeRegex(search.trim()), $options: "i" };
    }
    if (typeof category === "string" && category.trim()) {
      filter.category = { $regex: `^${escapeRegex(category.trim())}$`, $options: "i" };
    }

    const products = await Product.find(filter)
      .select("name price category image stock") // only what the cards need
      .sort(SORTS[sort] || { createdAt: -1 });

    return res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    console.error("getProducts error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// GET /products/:id
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    return res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("getProductById error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

module.exports = { createProduct, getProducts, getProductById };
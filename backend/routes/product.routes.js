const express = require("express");
const { createProduct, getProducts, getProductById } = require("../controllers/product.controller");

const router = express.Router();

router.post("/", createProduct); // open for now; admin auth comes in a later lab
router.get("/", getProducts);
router.get("/:id", getProductById);

module.exports = router;
const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
} = require("../controllers/wishlist.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getWishlist);
router.post("/:productId", addToWishlist);
router.patch("/:productId/toggle", toggleWishlist);
router.delete("/:productId", removeFromWishlist);

module.exports = router;
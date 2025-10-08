const express = require("express");
const {
  addToCart,
  removeFromCart,
  getCart,
  clearCart,
  updateCartItem,
} = require("../controllers/cartController");

const router = express.Router();
router.delete("/remove", removeFromCart);
router.post("/:id", addToCart);
router.get("/:id", getCart);
router.put("/:id", updateCartItem);

router.delete("/:id/clear", clearCart);

module.exports = router;

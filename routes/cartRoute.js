const express = require("express");
const {
  addToCart,
  removeFromCart,
  getCart,
  clearCart,
//   getCartItems,
//   updateCartItem,
//   removeCartItem,
} = require("../controllers/cartController");

const router = express.Router();

router.post("/:id", addToCart);
router.get("/:id", getCart);
// router.put("/:id", updateCartItem);
router.delete("/:id", removeFromCart);
router.delete("/:id/clear", clearCart);

module.exports = router;

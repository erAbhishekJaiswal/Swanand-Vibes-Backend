const express = require("express");
const {
  addToCart,
  removeFromCart,
  getCart,
  clearCart,
  // addToCartwithVariant
//   getCartItems,
  updateCartItem,
//   removeCartItem,
} = require("../controllers/cartController");

const router = express.Router();
router.delete("/remove", removeFromCart);
router.post("/:id", addToCart);
// router.post("/product/:id", addToCartwithVariant);
router.get("/:id", getCart);
router.put("/:id", updateCartItem);

router.delete("/:id/clear", clearCart);

module.exports = router;

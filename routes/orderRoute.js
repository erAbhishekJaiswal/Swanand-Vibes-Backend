const express = require("express")
const router = express.Router();    

const {
    createOrder,
    getOrderById,
    getAllOrders,
    updateOrder,
    getUserOrders,
    // updateOrderStatus,
    deleteOrder,
    // cancelOrder
    cancelOrder,
    generateInvoice,
    generateShippingLabel,
    getOrders
} = require("../controllers/orderController");
// const { protect, isAdmin } = require("../middleware/authMiddlware");
const { protect } = require("../middleware/authMiddlware");

router.get("/all", protect, getOrders);
router.post("/:userId", protect, createOrder);
router.get("/:id", protect, getOrderById);
router.get("/", protect, getAllOrders);
router.get("/user/:userId", protect, getUserOrders);
router.put("/:id", protect, updateOrder);
router.delete("/:id", protect, deleteOrder);
// cancelOrder
router.put("/cancel/:id", protect, cancelOrder);
// Generate invoice by orderId
router.get("/:orderId/invoice", generateInvoice);
router.get("/shipping-label/:id", generateShippingLabel);

module.exports = router;

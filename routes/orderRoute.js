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

router.get("/all", getOrders);
router.post("/:userId", createOrder);
router.get("/:id", getOrderById);
router.get("/", getAllOrders);
router.get("/user/:userId", getUserOrders);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);
// cancelOrder
router.put("/cancel/:id", cancelOrder);
// Generate invoice by orderId
router.get("/:orderId/invoice", generateInvoice);
router.get("/shipping-label/:id", generateShippingLabel);

module.exports = router;

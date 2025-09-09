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
    cancelOrder
} = require("../controllers/orderController");

router.post("/:userId", createOrder);
router.get("/:id", getOrderById);
router.get("/", getAllOrders);
router.get("/user/:userId", getUserOrders);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);
// cancelOrder
router.put("/cancel/:id", cancelOrder);

module.exports = router;

const express = require("express")
const router = express.Router();    

const {
    createOrder,
    getOrderById,
    getAllOrders,
    updateOrder,
    // getUserOrders,
    // updateOrderStatus,
    deleteOrder
} = require("../controllers/orderController");

router.post("/:userId", createOrder);
router.get("/:id", getOrderById);
router.get("/", getAllOrders);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);

module.exports = router;

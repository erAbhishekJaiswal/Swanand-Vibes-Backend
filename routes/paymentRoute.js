const express = require("express");
const router = express.Router();

const {
    createPayment,
    getPayments,
    getPaymentById,
    updatePaymentStatus,
    deletePayment
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddlware");
router.post("/",protect, createPayment);
router.get("/", protect, getPayments);
router.get("/:id", protect, getPaymentById);
router.put("/:id", protect, updatePaymentStatus);
router.delete("/:id", protect, deletePayment);

module.exports = router;

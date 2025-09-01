const express = require("express");
const router = express.Router();

const {
    createPayment,
    getPayments,
    getPaymentById,
    updatePaymentStatus,
    deletePayment
} = require("../controllers/paymentController");

router.post("/", createPayment);
router.get("/", getPayments);
router.get("/:id", getPaymentById);
router.put("/:id", updatePaymentStatus);
router.delete("/:id", deletePayment);

module.exports = router;

const express = require("express");
const router = express.Router();

const {
    fifoPLReport,
    profitLossReport,
    generatePurchaseInvoice
} = require("../controllers/reportController");

router.get("/fifo", fifoPLReport);
router.get("/profitandloss", profitLossReport);
router.get("/:id/invoice",generatePurchaseInvoice);

module.exports = router;
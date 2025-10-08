const express = require("express");
const router = express.Router();

const {
    fifoPLReport,
    profitLossReport,
    generatePurchaseInvoice
    // getReports,
    // getReportById,
    // updateReportStatus,
    // deleteReport
} = require("../controllers/reportController");

router.get("/fifo", fifoPLReport);
router.get("/profitandloss", profitLossReport);
router.get("/:id/invoice",generatePurchaseInvoice);
// router.put("/:id", updateReportStatus);
// router.delete("/:id", deleteReport);

module.exports = router;
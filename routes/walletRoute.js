// routes/walletRoutes.js
const express = require("express");
const { getWallet, debitWallet } = require("../controllers/walletController");
// const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get wallet balance + transactions
router.get("/:id", 
    // authMiddleware,
     getWallet);

// Withdraw request
router.post("/withdraw",
    // authMiddleware,
     debitWallet);

module.exports = router;

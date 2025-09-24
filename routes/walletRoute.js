// routes/walletRoutes.js
const express = require("express");
const {
  getWallet,
  requestWithdrawal,
  getWithdrawalRequests,
  allwalletList,
  deleteWithdrawalRequest,
  generateWithdrawalReport,
  approveWithdrawal,
  getTopLargeAmountWithdrawalUsers
} = require("../controllers/walletController");
// const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/requests",
  // authMiddleware,
  getWithdrawalRequests
);

router.get(
  "/withdrawal-report",
  // authMiddleware,
  generateWithdrawalReport
);

// Get top 5 large withdrawal users
router.get(
  "/top-large-amount-withdrawal-users",
  // authMiddleware,
  getTopLargeAmountWithdrawalUsers
);

router.get(
  "/allwallets",
  // authMiddleware,
  allwalletList
);
// Withdraw request
router.post(
  "/:id/withdraw-request",
  // authMiddleware,
  requestWithdrawal
);

// Get wallet balance + transactions
router.get(
  "/:id",
  // authMiddleware,
  getWallet
);

router.delete(
  "/delete-withdraw-request",
  // authMiddleware,
  deleteWithdrawalRequest
);

router.put(
  "/:id/approve-withdrawal",
  // authMiddleware,
  approveWithdrawal
);

router.put(
  '/:id/reject-withdrawal',
  // authMiddleware,
  deleteWithdrawalRequest
)

module.exports = router;

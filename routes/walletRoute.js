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
  getTopLargeAmountWithdrawalUsers,
  completeWithdrawal,
  getAdminWallet
} = require("../controllers/walletController");
// const authMiddleware = require("../middleware/authMiddleware");
const { protect } = require("../middleware/authMiddlware");

const router = express.Router();

router.get(
  "/requests",
  protect,
  // authMiddleware,
  getWithdrawalRequests
);

router.get(
  "/withdrawal-report",
  protect,
  // authMiddleware,
  generateWithdrawalReport
);

//admin wallet get all transactions
router.get(
  "/adminwallet",
  protect,
  // authMiddleware,
  getAdminWallet
);

// Get top 5 large withdrawal users
router.get(
  "/top-large-amount-withdrawal-users",
  protect,
  // authMiddleware,
  getTopLargeAmountWithdrawalUsers
);

router.get(
  "/allwallets",
  protect,
  // authMiddleware,
  allwalletList
);
// Withdraw request
router.post(
  "/:id/withdraw-request",
  protect,
  // authMiddleware,
  requestWithdrawal
);

// Get wallet balance + transactions
router.get(
  "/:id",
  protect,
  // authMiddleware,
  getWallet
);

router.delete(
  "/delete-withdraw-request",
  protect,
  // authMiddleware,
  deleteWithdrawalRequest
);

router.put(
  "/:id/approve-withdrawal",
  protect,
  // authMiddleware,
  approveWithdrawal
);

router.put(
  '/:id/reject-withdrawal',
  protect,
  // authMiddleware,
  deleteWithdrawalRequest
)
router.put(
  '/:id/complete-withdrawal',
  protect,
  // authMiddleware,
  completeWithdrawal
);

module.exports = router;

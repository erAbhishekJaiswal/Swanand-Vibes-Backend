const Wallet = require("../models/Wallet");
const User = require("../models/User");
const Kyc = require("../models/Kyc");
const ExcelJS = require("exceljs");
const AdminWallet = require("../models/AdminWallet");

// Get wallet of a user
exports.getWallet = async (req, res) => {
  try {
    const userId = req.params.id;
    const wallet = await Wallet.findOne({ user: userId }).populate(
      "transactions.fromUser",
      "name email"
    );
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Credit commission
exports.creditWallet = async (userId, amount, level, fromUserId) => {
  try {
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = new Wallet({ user: userId, balance: 0, transactions: [] });
    }

    wallet.balance += amount;
    wallet.transactions.push({
      type: "credit",
      amount,
      level,
      fromUser: fromUserId,
    });

    await wallet.save();
    return wallet;
  } catch (error) {
    console.error("Wallet credit error:", error);
  }
};

// **********************************Running code**********************************
// // generate the request for withdrawal
// exports.requestWithdrawal = async (req, res) => {
//   try {
//     const { amount } = req.body;
//     const userid = req.params.id
//     const user = await User.findById(userid);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     let wallet = await Wallet.findOne({ user: userid });
//     if (!wallet || wallet.balance < amount) {
//       return res.status(400).json({ message: "Insufficient balance" });
//     }
//     // const kyc = await Kyc.findOne({ userId: userid });
//     // if (!kyc || kyc.status !== "approved") {
//     //   return res.status(400).json({ message: "KYC not approved" });
//     // }

//     wallet.balance -= amount;
//     wallet.transactions.push({
//       type: "debit",
//       amount,
//       status: "withdrawal-requested",
//     });

//     await wallet.save();
//     res.json({ message: "Withdrawal request submitted", wallet });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// // generate the aprove the request for withdrawal
// exports.approveWithdrawal = async (req, res) => {
//   try {
//     const { userId } = req.body;
//     const user = await Wallet.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     const kyc = await Kyc.findOne({ userId: userId });
//     if (!kyc || kyc.status !== "approved") {
//       user.status = "withdrawal-rejected";
//       await user.save();
//       return res.status(400).json({ message: "KYC not approved" });
//     }
//     user.status = "withdrawal-approved";
//     await user.save();
//     res.json({ message: "Withdrawal request approved", user });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// // generate the reject the request for withdrawal
// exports.rejectWithdrawal = async (req, res) => {
//   try {
//     const { userId } = req.body;
//     const user = await Wallet.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     user.status = "withdrawal-rejected";
//     await user.save();
//     res.json({ message: "Withdrawal request rejected", user });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

exports.allwalletList = async (req, res) => {
  try {
    // Fetch all wallets with user details
    const wallets = await Wallet.find().populate("user", "name email");

    if (!wallets || wallets.length === 0) {
      return res.status(404).json({ message: "No wallets found", wallets: [] });
    }

    // Collect all transactions
    const allTransactions = wallets.flatMap((wallet) => wallet.transactions);

    // Count withdrawal status totals
    const counts = {
      withdrawalRequested: allTransactions.filter(
        (tx) => tx.status === "withdrawal-requested"
      ).length,
      withdrawalApproved: allTransactions.filter(
        (tx) => tx.status === "withdrawal-approved"
      ).length,
      withdrawalRejected: allTransactions.filter(
        (tx) => tx.status === "withdrawal-rejected"
      ).length,
    };

    res.json({
      counts,
      wallets,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// exports.getWithdrawalRequests = async (req, res) => {
//   try {
//     // Find wallets that contain withdrawal-related transactions
//     const wallets = await Wallet.find({
//       "transactions.status": {
//         $in: [
//           "withdrawal-requested",
//           "withdrawal-approved",
//           "withdrawal-rejected",
//         ],
//       },
//     }).populate("user", "name email");

//     if (!wallets || wallets.length === 0) {
//       return res.status(404).json({
//         message: "No withdrawal requests found",
//         counts: {
//           withdrawalRequested: 0,
//           withdrawalApproved: 0,
//           withdrawalRejected: 0,
//         },
//         withdrawalRequests: [],
//       });
//     }

//     // Flatten all withdrawal transactions from all wallets
//     const withdrawalRequests = wallets.flatMap((wallet) => {
//       return wallet.transactions
//         .filter((tx) =>
//           [
//             "withdrawal-requested",
//             "withdrawal-approved",
//             "withdrawal-rejected",
//           ].includes(tx.status)
//         )
//         .map((tx) => ({
//           walletId: wallet._id,
//           user: wallet.user,
//           balance: wallet.balance,
//           transactions: {
//             _id: tx._id,
//             type: tx.type,
//             amount: tx.amount,
//             status: tx.status,
//             date: tx.date,
//             balanceAfter: tx.balanceAfter,
//             fromUser: tx.fromUser,
//           },
//         }));
//     });

//     // Count totals
//     const allTransactions = wallets.flatMap((w) => w.transactions);
//     const counts = {
//       withdrawalRequested: allTransactions.filter(
//         (tx) => tx.status === "withdrawal-requested"
//       ).length,
//       withdrawalApproved: allTransactions.filter(
//         (tx) => tx.status === "withdrawal-approved"
//       ).length,
//       withdrawalRejected: allTransactions.filter(
//         (tx) => tx.status === "withdrawal-rejected"
//       ).length,
//     };

//     res.json({
//       counts,
//       withdrawalRequests,
//     });
//   } catch (error) {
//     console.error("Error fetching withdrawal requests:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };


exports.getWithdrawalRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search?.trim() || "";
    const statusFilter = req.query.status; // Optional status filter

    const validStatuses = [
      "withdrawal-requested",
      "withdrawal-approved",
      "withdrawal-rejected",
    ];

    const statusesToFind = statusFilter && validStatuses.includes(statusFilter)
      ? [statusFilter]
      : validStatuses;

    // Find wallets with withdrawal transactions
    const wallets = await Wallet.find({
      "transactions.status": { $in: statusesToFind },
    }).populate("user", "name email");

    if (!wallets || wallets.length === 0) {
      return res.status(404).json({
        message: "No withdrawal requests found",
        counts: {
          withdrawalRequested: 0,
          withdrawalApproved: 0,
          withdrawalRejected: 0,
        },
        withdrawalRequests: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
      });
    }

    // Filter and flatten matching withdrawal transactions
    const allWithdrawalRequests = wallets.flatMap((wallet) => {
      // Apply search filter if search term is provided
      const userMatchesSearch =
        !search ||
        wallet.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        wallet.user?.email?.toLowerCase().includes(search.toLowerCase());

      if (!userMatchesSearch) return [];

      return wallet.transactions
        .filter((tx) => statusesToFind.includes(tx.status))
        .map((tx) => ({
          walletId: wallet._id,
          user: wallet.user,
          balance: wallet.balance,
          transactions: {
            _id: tx._id,
            type: tx.type,
            amount: tx.amount,
            status: tx.status,
            date: tx.date,
            balanceAfter: tx.balanceAfter,
            fromUser: tx.fromUser,
          },
        }));
    });

    const totalItems = allWithdrawalRequests.length;
    const totalPages = Math.ceil(totalItems / limit);
    const paginatedRequests = allWithdrawalRequests.slice(skip, skip + limit);

    // Count totals from all wallets (unfiltered for pagination)
    const allTransactions = wallets.flatMap((w) => w.transactions);
    const counts = {
      withdrawalRequested: allTransactions.filter(
        (tx) => tx.status === "withdrawal-requested"
      ).length,
      withdrawalApproved: allTransactions.filter(
        (tx) => tx.status === "withdrawal-approved"
      ).length,
      withdrawalRejected: allTransactions.filter(
        (tx) => tx.status === "withdrawal-rejected"
      ).length,
    };

    res.json({
      counts,
      withdrawalRequests: paginatedRequests,
      totalItems,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching withdrawal requests:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


// Request withdrawal (user action)
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.params.id;
    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }
    // if user have already requested for withdrawal and not yet approved/rejected then not to do new request till that is approved/rejected
    const existingRequest = wallet.transactions.find(
      (tx) => tx.status === "withdrawal-requested"
    );
    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "Withdrawal request already submitted" });
    }

    wallet.transactions.push({
      type: "debit",
      amount,
      status: "withdrawal-requested",
      balanceAfter: wallet.balance, // not deducted yet
    });

    await wallet.save();
    res.json({ message: "Withdrawal request submitted" });
  } catch (error) {
    console.error(error);
  }
};

exports.approveWithdrawal = async (req, res) => {
  try {
    const { walletId, txnId } = req.body;

    const wallet = await Wallet.findById(walletId);
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    const txn = wallet.transactions.id(txnId);
    if (!txn || txn.status !== "withdrawal-requested") {
      return res.status(400).json({ message: "Invalid or already processed transaction" });
    }

    if (wallet.balance < txn.amount) {
      txn.status = "withdrawal-rejected";
      await wallet.save();
      return res.status(400).json({ message: "Insufficient balance at approval" });
    }

    // Calculate service charge (5%)
    const serviceCharge = Math.floor(txn.amount * 0.15);
    const netAmount = txn.amount - serviceCharge;

    // Deduct total amount (user's full requested amount) from user's wallet
    wallet.balance -= txn.amount;

    // Update the transaction
    txn.status = "withdrawal-approved";
    txn.balanceAfter = wallet.balance;
    txn.serviceCharge = serviceCharge; // Optional: Store service charge separately
    txn.amount = netAmount;         // Optional: Store net amount separately

    // Fetch Admin Wallet (assuming single wallet)
    let adminWallet = await AdminWallet.findOne();
    if (!adminWallet) {
      // Create if not exists
      adminWallet = new AdminWallet({
        balance: 0,
        transactions: [],
      });
    }

    // Credit service charge to admin wallet
    adminWallet.balance += serviceCharge;
    adminWallet.transactions.push({
      type: "credit",
      amount: serviceCharge,
      timestamp: new Date(),
    });

    // Save both wallets
    await adminWallet.save();
    await wallet.save();

    res.json({ message: "Withdrawal approved successfully" });
  } catch (error) {
    console.error("Error approving withdrawal:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// delete the withdraw request
exports.deleteWithdrawalRequest = async (req, res) => {
  try {
    const { walletId, txnId } = req.body;
    const wallet = await Wallet.findById(walletId);
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    const txn = wallet.transactions.id(txnId);
    if (!txn || txn.status !== "withdrawal-requested") {
      return res.status(400).json({ message: "Invalid transaction" });
    }

    txn.status = "withdrawal-rejected";
    await wallet.save();
    res.json({ message: "Withdrawal request deleted successfully" });
  } catch (error) {
    console.error(error);
  }
};

// change the status to completed after the money is sent to user
exports.completeWithdrawal = async (req, res) => {
  try {
    const { walletId, txnId } = req.body;
    const wallet = await Wallet.findById(walletId);
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    const txn = wallet.transactions.id(txnId);
    if (!txn || txn.status !== "withdrawal-approved") {
      return res.status(400).json({ message: "Invalid transaction" });
    }
    txn.status = "completed";

    await wallet.save();
    res.json({ message: "Withdrawal completed successfully" });
  } catch (error) {
    console.error(error);
  }
};

// Export withdrawal report to Excel
// exports.generateWithdrawalReport = async (req, res) => {
//   try {
//     const { start, end } = req.query;

//     const startDate = start ? new Date(start) : new Date("1970-01-01");
//     const endDate = end ? new Date(end) : new Date();

//     const wallets = await Wallet.find({
//       transactions: {
//         $elemMatch: {
//           status: {
//             $in: [
//               "withdrawal-requested",
//               "withdrawal-approved",
//               "withdrawal-rejected",
//             ],
//           },
//           date: { $gte: startDate, $lte: endDate },
//         },
//       },
//     }).populate("user", "name email mobile");

//     const kycRecords = await Kyc.find().populate("userId", "name email mobile");
//     const kycMap = {};
//     kycRecords.forEach((kyc) => {
//       if (kyc.userId?._id) {
//         kycMap[kyc.userId._id.toString()] = kyc;
//       }
//     });

//     const workbook = new ExcelJS.Workbook();
//     const sheet = workbook.addWorksheet("Withdrawal Requests");

//     sheet.columns = [
//       { header: "User Name", key: "name", width: 20 },
//       { header: "Email", key: "email", width: 25 },
//       { header: "Mobile", key: "mobile", width: 20 },
//       { header: "Wallet Balance", key: "balance", width: 15 },
//       { header: "Withdrawal Amount", key: "amount", width: 15 },
//       { header: "Transaction Type", key: "type", width: 15 },
//       { header: "Status", key: "status", width: 20 },
//       { header: "Date", key: "date", width: 20 },
//       { header: "Aadhar Number", key: "adharNumber", width: 20 },
//       { header: "Aadhar Name", key: "adharName", width: 20 },
//       { header: "PAN Number", key: "panNumber", width: 20 },
//       { header: "Bank Name", key: "bankName", width: 20 },
//       { header: "Bank Account", key: "bankAccount", width: 20 },
//       { header: "IFSC Code", key: "ifscCode", width: 20 },
//       { header: "KYC Status", key: "kycStatus", width: 15 },
//     ];

//     wallets.forEach((wallet) => {
//       if (!wallet.user) {
//         console.warn("⚠️ Wallet has no user linked:", wallet._id);
//         return;
//       }

//       wallet.transactions
//         .filter(
//           (txn) =>
//             ["withdrawal-requested", "withdrawal-approved", "withdrawal-rejected"]
//               .includes(txn.status?.toLowerCase()) &&
//             txn.date >= startDate &&
//             txn.date <= endDate
//         )
//         .forEach((txn) => {
//           const userId = wallet.user?._id?.toString();
//           const kyc = userId ? kycMap[userId] : null;

//           sheet.addRow({
//             name: wallet.user?.name || "N/A",
//             email: wallet.user?.email || "N/A",
//             mobile: wallet.user?.mobile || "N/A",
//             balance: wallet.balance || 0,
//             type: txn.type || "N/A",
//             amount: txn.amount || 0,
//             status: txn.status || "N/A",
//             date: txn.date ? txn.date.toISOString().split("T")[0] : "N/A",
//             adharNumber: kyc?.adharNumber || "N/A",
//             adharName: kyc?.adharName || "N/A",
//             panNumber: kyc?.panNumber || "N/A",
//             bankName: kyc?.bankName || "N/A",
//             bankAccount: kyc?.bankAccount || "N/A",
//             ifscCode: kyc?.ifscCode || "N/A",
//             kycStatus: kyc?.status || "N/A",
//           });
//         });
//     });

//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     );
//     res.setHeader(
//       "Content-Disposition",
//       "attachment; filename=withdrawal-report.xlsx"
//     );

//     await workbook.xlsx.write(res);
//     res.end();
//   } catch (error) {
//     console.error("❌ Error exporting withdrawal report:", error);
//     res.status(500).send("Failed to generate withdrawal report");
//   }
// };

exports.generateWithdrawalReport = async (req, res) => {
  try {
    const { start, end, status } = req.query;

    // 🗓️ Date Filters
    const startDate = start ? new Date(start) : new Date("1970-01-01");
    const endDate = end ? new Date(end) : new Date();

    // 🧩 Status Filter
    const allowedStatuses = [
      "withdrawal-requested",
      "withdrawal-approved",
      "withdrawal-rejected",
    ];

    // If status query provided, split and validate; else use all allowed
    const statusFilter = status
      ? status
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter((s) => allowedStatuses.includes(s))
      : allowedStatuses;

    // 🧮 Fetch wallets containing transactions matching filter
    const wallets = await Wallet.find({
      transactions: {
        $elemMatch: {
          status: { $in: statusFilter },
          date: { $gte: startDate, $lte: endDate },
        },
      },
    }).populate("user", "name email mobile");

    // 🧾 Fetch KYC data and map by user
    const kycRecords = await Kyc.find().populate("userId", "name email mobile");
    const kycMap = {};
    kycRecords.forEach((kyc) => {
      if (kyc.userId?._id) {
        kycMap[kyc.userId._id.toString()] = kyc;
      }
    });

    // 📊 Create Excel Workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Withdrawal Requests");

    sheet.columns = [
      { header: "User Name", key: "name", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Mobile", key: "mobile", width: 20 },
      { header: "Wallet Balance", key: "balance", width: 15 },
      { header: "Withdrawal Amount", key: "amount", width: 15 },
      { header: "Transaction Type", key: "type", width: 15 },
      { header: "Status", key: "status", width: 20 },
      { header: "Date", key: "date", width: 20 },
      { header: "Aadhar Number", key: "adharNumber", width: 20 },
      { header: "Aadhar Name", key: "adharName", width: 20 },
      { header: "PAN Number", key: "panNumber", width: 20 },
      { header: "Bank Name", key: "bankName", width: 20 },
      { header: "Bank Account", key: "bankAccount", width: 20 },
      { header: "IFSC Code", key: "ifscCode", width: 20 },
      { header: "KYC Status", key: "kycStatus", width: 15 },
    ];

    // 🧠 Loop through wallets and add rows
    wallets.forEach((wallet) => {
      if (!wallet.user) {
        console.warn("⚠️ Wallet has no user linked:", wallet._id);
        return;
      }

      wallet.transactions
        .filter(
          (txn) =>
            statusFilter.includes(txn.status?.toLowerCase()) &&
            txn.date >= startDate &&
            txn.date <= endDate
        )
        .forEach((txn) => {
          const userId = wallet.user?._id?.toString();
          const kyc = userId ? kycMap[userId] : null;

          sheet.addRow({
            name: wallet.user?.name || "N/A",
            email: wallet.user?.email || "N/A",
            mobile: wallet.user?.mobile || "N/A",
            balance: wallet.balance || 0,
            type: txn.type || "N/A",
            amount: txn.amount || 0,
            status: txn.status || "N/A",
            date: txn.date ? txn.date.toISOString().split("T")[0] : "N/A",
            adharNumber: kyc?.adharNumber || "N/A",
            adharName: kyc?.adharName || "N/A",
            panNumber: kyc?.panNumber || "N/A",
            bankName: kyc?.bankName || "N/A",
            bankAccount: kyc?.bankAccount || "N/A",
            ifscCode: kyc?.ifscCode || "N/A",
            kycStatus: kyc?.status || "N/A",
          });
        });
    });

    // 📤 Set response headers for download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=withdrawal-report-${new Date().toISOString().split("T")[0]}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("❌ Error exporting withdrawal report:", error);
    res.status(500).send("Failed to generate withdrawal report");
  }
};


exports.getTopLargeAmountWithdrawalUsers = async (req, res) => {
  try {
    const { start, end } = req.query;

    const startDate = start ? new Date(start) : new Date("1970-01-01");
    const endDate = end ? new Date(end) : new Date();

    const wallets = await Wallet.find({}).populate("user", "name email mobile");

    // // console.log(`Total wallets: ${wallets}`);

    const withdrawalRequests = wallets.flatMap((wallet) =>
      wallet.transactions
        .filter(
          (txn) =>
            [
              "withdrawal-requested",
              "withdrawal-approved",
              "withdrawal-rejected",
            ].includes(txn.status?.toLowerCase()) &&
            txn.date >= startDate &&
            txn.date <= endDate &&
            wallet.user
        )
        .map((txn) => ({
          userId: wallet.user._id.toString(),
          amount: txn.amount,
        }))
    );

    const withdrawalTotals = withdrawalRequests.reduce(
      (acc, { userId, amount }) => {
        acc[userId] = (acc[userId] || 0) + amount;
        return acc;
      },
      {}
    );

    const sortedUsers = Object.entries(withdrawalTotals)
      .map(([userId, amount]) => ({ userId, amount }))
      .sort((a, b) => b.amount - a.amount);

    // user details
    const users = await User.find({
      _id: { $in: sortedUsers.map((user) => user.userId) },
    });

    sortedUsers.forEach((user) => {
      const foundUser = users.find((u) => u._id.toString() === user.userId);
      if (foundUser) {
        user.name = foundUser.name;
        user.email = foundUser.email;
        user.mobile = foundUser.mobile;
      }
    });

    res.json(sortedUsers);
  } catch (error) {
    console.error("Error fetching top withdrawal users:", error);
    res.status(500).send("Failed to fetch top withdrawal users");
  }
};

exports.getAdminWallet = async (req, res) => {
  try {
    // Extract page and limit from query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch the admin wallet (assuming one document)
    const wallet = await AdminWallet.findOne();

    if (!wallet) {
      return res.status(404).json({ message: 'Admin wallet not found' });
    }

    // Sort transactions by timestamp descending (latest first)
    const sortedTransactions = [...wallet.transactions].sort((a, b) => b.timestamp - a.timestamp);

    // Paginate transactions
    const paginatedTransactions = sortedTransactions.slice(skip, skip + limit);

    // Total transactions count
    const totalTransactions = wallet.transactions.length;

    res.json({
      balance: wallet.balance,
      transactions: paginatedTransactions,
      pagination: {
        total: totalTransactions,
        page,
        limit,
        totalPages: Math.ceil(totalTransactions / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching admin wallet:", error);
    res.status(500).send("Failed to fetch admin wallet");
  }
};

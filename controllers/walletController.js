// controllers/walletController.js
const Wallet = require("../models/Wallet");
const User = require("../models/User");
const Kyc = require("../models/Kyc");
const ExcelJS = require("exceljs");
// const User = require("../models/User"); // assuming you have User model

// Get wallet of a user
exports.getWallet = async (req, res) => {
  try {
    const userId = req.params.id
    const wallet = await Wallet.findOne({ user: userId })
    .populate("transactions.fromUser", "name email");
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
    const wallets = await Wallet.find()
      .populate("user", "name email");

    if (!wallets || wallets.length === 0) {
      return res.status(404).json({ message: "No wallets found", wallets: [] });
    }

    // Collect all transactions
    const allTransactions = wallets.flatMap(wallet => wallet.transactions);

    // Count withdrawal status totals
    const counts = {
      withdrawalRequested: allTransactions.filter(tx => tx.status === "withdrawal-requested").length,
      withdrawalApproved: allTransactions.filter(tx => tx.status === "withdrawal-approved").length,
      withdrawalRejected: allTransactions.filter(tx => tx.status === "withdrawal-rejected").length,
    };

    res.json({
      counts,
      wallets
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


// exports.allwalletList = async (req, res) => {
//   try {
//     const wallet = await Wallet.find();
//     res.json(wallet);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// }





// *************************************************






// Debit (withdrawal)
// exports.debitWallet = async (req, res) => {
//   try {
//     const { amount } = req.body;
//     let wallet = await Wallet.findOne({ user: req.user.id });

//     if (!wallet || wallet.balance < amount) {
//       return res.status(400).json({ message: "Insufficient balance" });
//     }

//     wallet.balance -= amount;
//     wallet.transactions.push({
//       type: "debit",
//       amount,
//     });

//     await wallet.save();
//     res.json({ message: "Withdrawal successful", wallet });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };








// exports.getWithdrawalRequests = async (req, res) => {
//   try {
//     const users = await Wallet.find({ "transactions.status": "withdrawal-requested" })
//       // .populate("user", "name email")   // optional: get user details
//       // .populate("transactions.fromUser", "name email"); // optional: who caused earnings

//     if (!users || users.length === 0) {
//       return res.status(404).json({ message: "No withdrawal requests found" });
//     }

//     // print only those users that transactions.status is withdrawal-requested
//     const filteredUsers = users.filter((user) => {
//       return user.transactions.map((transaction) => transaction.status === "withdrawal-requested");
//     })
//     res.json(filteredUsers);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };


// All Wallet






// exports.getWithdrawalRequests = async (req, res) => {
//   try {
//     // Find users who have at least one transaction with 'withdrawal-requested'  status
    
//     const users = await Wallet.find({ "transactions.status": "withdrawal-requested" }).populate("user", "name email");

//     if (!users || users.length === 0) {
//       return res.status(404).json({ message: "No withdrawal requests found", users });
//     }

    
    
//     // Filter and include only the withdrawal-requested transactions
//     const filteredUsers = users.map((user) => {
//       const withdrawalTransactions = user.transactions.filter(
//         (tx) => tx.status === "withdrawal-requested"
//       );
    

//       return {
//         _id: user._id,
//         user: user.user,
//         balance: user.balance,
//         transactions: withdrawalTransactions,
//       };
//     });

//     res.json(filteredUsers);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };





exports.getWithdrawalRequests = async (req, res) => {
  try {
    // Find wallets that may contain withdrawal transactions
    const users = await Wallet.find({
      "transactions.status": { $in: ["withdrawal-requested", "withdrawal-approved", "withdrawal-rejected"] }
    }).populate("user", "name email");

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No withdrawal requests found", users: [] });
    }

    // Filter users to only include withdrawal-requested transactions
    const filteredUsers = users.map((user) => {
      const withdrawalTransactions = user.transactions.filter(
        (tx) => tx.status === "withdrawal-requested"
      );

      return withdrawalTransactions.length > 0
        ? {
            _id: user._id,
            user: user.user,
            balance: user.balance,
            transactions: withdrawalTransactions,
          }
        : null;
    }).filter(Boolean);

    // If no users have withdrawal-requested txns
    if (filteredUsers.length === 0) {
      return res.status(404).json({ message: "No withdrawal requests found", users: [] });
    }

    // Count totals of all withdrawal statuses across all wallets
    const allTransactions = users.flatMap((user) => user.transactions);

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
      withdrawalRequests: filteredUsers,
    });
  } catch (error) {
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

  wallet.transactions.push({
    type: "debit",
    amount,
    status: "withdrawal-requested",
    balanceAfter: wallet.balance, // not deducted yet
  });

  await wallet.save();
  res.json({ message: "Withdrawal request submitted" });
  } catch (error) {
    console.log(error);
  }

};

// Approve withdrawal (admin action)
exports.approveWithdrawal = async (req, res) => {
  try {
      const { walletId, txnId } = req.body;
  const wallet = await Wallet.findById(walletId);
  if (!wallet) return res.status(404).json({ message: "Wallet not found" });

  const txn = wallet.transactions.id(txnId);
  if (!txn || txn.status !== "withdrawal-requested") {
    return res.status(400).json({ message: "Invalid transaction" });
  }

  if (wallet.balance < txn.amount) {
    txn.status = "withdrawal-rejected";
    await wallet.save();
    return res.status(400).json({ message: "Insufficient balance at approval" });
  }

  wallet.balance -= txn.amount;
  txn.status = "withdrawal-approved";
  txn.balanceAfter = wallet.balance;

  await wallet.save();
  res.json({ message: "Withdrawal approved successfully" });
  } catch (error) {
    console.log(error);
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
    console.log(error);
  }

};



// GET /api/reports/withdrawals?start=2025-09-01&end=2025-09-11
// exports.generateWithdrawalReport = async (req, res) => {
//   try {
//     const { start, end } = req.query;

//     console.log(start, end);
    
//     // Convert start & end to Date objects
//     const startDate = start ? new Date(start) : new Date("1970-01-01");
//     const endDate = end ? new Date(end) : new Date();

//     // ✅ Fetch wallets with withdrawal transactions in date range
//     const wallets = await Wallet.find({
//       "transactions": {
//         $elemMatch: {
//           status: { $in: ["withdrawal-requested", "withdrawal-approved", "withdrawal-rejected"] },
//           date: { $gte: startDate, $lte: endDate },
//         },
//       },
//     }).populate("user", "name email mobile"); // only pull name/email/mobile

//     // ✅ Create workbook
//     const workbook = new ExcelJS.Workbook();
//     const sheet = workbook.addWorksheet("Withdrawal Requests");

//     // ✅ Define headers
//     sheet.columns = [
//       { header: "User Name", key: "name", width: 20 },
//       { header: "Email", key: "email", width: 25 },
//       { header: "Mobile", key: "mobile", width: 20 },
//       { header: "Wallet Balance", key: "balance", width: 15 },
//       { header: "Transaction Type", key: "type", width: 15 },
//       { header: "Amount", key: "amount", width: 15 },
//       { header: "Balance After", key: "balanceAfter", width: 15 },
//       { header: "Status", key: "status", width: 20 },
//       { header: "Date", key: "date", width: 20 },
//     ];

//     // ✅ Add rows
//     wallets.forEach((wallet) => {
//       wallet.transactions
//         .filter(
//           (txn) =>
//             ["withdrawal-requested", "withdrawal-approved", "withdrawal-rejected"].includes(txn.status) &&
//             txn.date >= startDate &&
//             txn.date <= endDate
//         )
//         .forEach((txn) => {
//           sheet.addRow({
//             name: wallet.user?.name || "N/A",
//             email: wallet.user?.email || "N/A",
//             mobile: wallet.user?.mobile || "N/A",
//             balance: (wallet.balance / 100).toFixed(2), // convert paise → ₹
//             type: txn.type,
//             amount: (txn.amount / 100).toFixed(2),
//             balanceAfter: (txn.balanceAfter / 100).toFixed(2),
//             status: txn.status,
//             date: txn.date.toISOString().split("T")[0], // YYYY-MM-DD
//           });
//         });
//     });

//     // ✅ Set response headers
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
//     console.error("Error exporting withdrawal report:", error);
//     res.status(500).send("Failed to generate withdrawal report");
//   }
// };


exports.generateWithdrawalReport = async (req, res) => {
  try {
    const { start, end } = req.query;

    const startDate = start ? new Date(start) : new Date("1970-01-01");
    const endDate = end ? new Date(end) : new Date();

    // Fetch wallets with withdrawal transactions in range
    const wallets = await Wallet.find({
      "transactions": {
        $elemMatch: {
          status: { $in: ["withdrawal-requested", "withdrawal-approved", "withdrawal-rejected"] },
          date: { $gte: startDate, $lte: endDate },
        },
      },
    }).populate("user", "name email mobile");
    console.log(wallets);
    

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Withdrawal Requests");

    // Headers
    sheet.columns = [
      { header: "ID", key: "userId", width: 25 },
      { header: "User Name", key: "name", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Mobile", key: "mobile", width: 20 },
      { header: "Wallet Balance", key: "balance", width: 15 },
      { header: "Withdrawal Amount", key: "amount", width: 15 },
      { header: "Transaction Type", key: "type", width: 15 },
      { header: "Balance After", key: "balanceAfter", width: 15 },
      { header: "Status", key: "status", width: 20 },
      { header: "Date", key: "date", width: 20 },
    ];

    // Add rows
    wallets.forEach((wallet) => {
      wallet.transactions
        .filter(
          (txn) =>
            ["withdrawal-requested", "withdrawal-approved", "withdrawal-rejected"].includes(
              txn.status?.toLowerCase()
            ) &&
            txn.date >= startDate &&
            txn.date <= endDate
        )
        .forEach((txn) => {
          sheet.addRow({
            name: wallet.user?.name || "N/A",
            email: wallet.user?.email || "N/A",
            mobile: wallet.user?.mobile || "N/A",

            // ⚠️ If you store paise: keep /100
            // ⚠️ If you store rupees: remove /100
            balance: wallet.balance,
            type: txn.type,
            amount: txn.amount,
            balanceAfter: txn.balanceAfter,

            status: txn.status,
            date: txn.date.toISOString().split("T")[0],
          });
        });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=withdrawal-report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting withdrawal report:", error);
    res.status(500).send("Failed to generate withdrawal report");
  }
};


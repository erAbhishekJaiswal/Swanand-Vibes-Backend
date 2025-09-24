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
    // Find wallets that contain withdrawal-related transactions
    const wallets = await Wallet.find({
      "transactions.status": { 
        $in: ["withdrawal-requested", "withdrawal-approved", "withdrawal-rejected"] 
      }
    }).populate("user", "name email");

    if (!wallets || wallets.length === 0) {
      return res.status(404).json({ 
        message: "No withdrawal requests found", 
        counts: { withdrawalRequested: 0, withdrawalApproved: 0, withdrawalRejected: 0 },
        withdrawalRequests: [] 
      });
    }

    // Build withdrawalRequests array
    const withdrawalRequests = wallets.map(wallet => {
      const withdrawalTransactions = wallet.transactions.filter(
        (tx) => ["withdrawal-requested", "withdrawal-approved", "withdrawal-rejected"].includes(tx.status)
      );

      if (withdrawalTransactions.length === 0) return null;

      // Get the latest transaction
      const latestTransaction = withdrawalTransactions[withdrawalTransactions.length - 1];

      return {
        _id: wallet._id,
        user: wallet.user,
        balance: wallet.balance,
        transactions: [
          {
            _id: latestTransaction._id,
            type: latestTransaction.type,
            amount: latestTransaction.amount,
            status: latestTransaction.status,
            date: latestTransaction.date,
            balanceAfter: latestTransaction.balanceAfter,
            fromUser: latestTransaction.fromUser
          }
        ]
      };
    }).filter(Boolean);

    // Count totals across all transactions
    const allTransactions = wallets.flatMap(w => w.transactions);
    const counts = {
      withdrawalRequested: allTransactions.filter(tx => tx.status === "withdrawal-requested").length,
      withdrawalApproved: allTransactions.filter(tx => tx.status === "withdrawal-approved").length,
      withdrawalRejected: allTransactions.filter(tx => tx.status === "withdrawal-rejected").length,
    };

    res.json({
      counts,
      withdrawalRequests
    });

  } catch (error) {
    console.error("Error fetching withdrawal requests:", error);
    res.status(500).json({ message: "Server error", error });
  }
};



// exports.getWithdrawalRequests = async (req, res) => {
//   try {
//     // Find wallets that may contain withdrawal transactions
//     const users = await Wallet.find({
//       "transactions.status": { $in: ["withdrawal-requested", "withdrawal-approved", "withdrawal-rejected"] }
//     }).populate("user", "name email");

//     if (!users || users.length === 0) {
//       return res.status(404).json({ message: "No withdrawal requests found", users: [] });
//     }

//     // Filter users to only include withdrawal-requested transactions
//     const filteredUsers = users.map((user) => {
//       const withdrawalTransactions = user.transactions.filter(
//         (tx) => tx.status === "withdrawal-requested"
//       );

//       return withdrawalTransactions.length > 0
//         ? {
//             _id: user._id,
//             user: user.user,
//             balance: user.balance,
//             transactions: withdrawalTransactions,
//           }
//         : null;
//     }).filter(Boolean);

//     // If no users have withdrawal-requested txns
//     if (filteredUsers.length === 0) {
//       return res.status(404).json({ message: "No withdrawal requests found", users: [] });
//     }

//     // Count totals of all withdrawal statuses across all wallets
//     const allTransactions = users.flatMap((user) => user.transactions);

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
//       withdrawalRequests: filteredUsers,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };





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


// get top large amount withdrawal users
// exports.getTopLargeAmountWithdrawalUsers = async (req, res) => {
//   try {
//     const { start, end } = req.query;

//     const startDate = start ? new Date(start) : new Date("1970-01-01");
//     const endDate = end ? new Date(end) : new Date();

//     // Fetch wallets with withdrawal transactions in range
//     // const wallets = await Wallet.find({
//     //   "transactions": {
//     //     $elemMatch: {
//     //       status: { $in: ["withdrawal-requested", "withdrawal-approved", "withdrawal-rejected"] },
//     //       date: { $gte: startDate, $lte: endDate },
//     //     },
//     //   },
//     // }).populate("user", "name email mobile");

//     const wallets = await Wallet.find({
//   transactions: {
//     $elemMatch: {
//       status: { $in: ["withdrawal-requested", "withdrawal-approved", "withdrawal-rejected"] },
//       date: { $gte: startDate, $lte: endDate },
//     },
//   },
// }).populate("user", "name email mobile")
//   .populate("transactions.fromUser", "_id"); // 👈 this line
  
//     const withdrawalRequests = wallets.flatMap((wallet) =>
//       wallet.transactions.filter(
//         (txn) =>
//           ["withdrawal-requested", "withdrawal-approved", "withdrawal-rejected"].includes(
//             txn.status?.toLowerCase()
//           ) &&
//           txn.date >= startDate &&
//           txn.date <= endDate
//       )
//     );

//     // Calculate total withdrawal amount for each user
//     // const withdrawalAmounts = withdrawalRequests.reduce((acc, txn) => {
//     //   const user = txn.fromUser;
//     //   acc[user._id] = (acc[user._id] || 0) + txn.amount;
//     //   return acc;
//     // }, {});

//     const withdrawalAmounts = withdrawalRequests.reduce((acc, txn) => {
//   const user = txn.fromUser;
//   if (user && user._id) {
//     acc[user._id] = (acc[user._id] || 0) + txn.amount;
//   }
//   return acc;
// }, {});


//     // Sort users by withdrawal amount in descending order
//     const sortedUsers = Object.entries(withdrawalAmounts)
//       .map(([userId, amount]) => ({ userId, amount }))
//       .sort((a, b) => b.amount - a.amount);

//     res.json(sortedUsers);
//   } catch (error) {
//     console.error("Error fetching top withdrawal users:", error);
//     res.status(500).send("Failed to fetch top withdrawal users");
//   }
// };






// Get users with the largest withdrawal amounts in a date range
// exports.getTopLargeAmountWithdrawalUsers = async (req, res) => {
//   try {
//     const { start, end } = req.query;

//     const startDate = start ? new Date(start) : new Date("1970-01-01");
//     const endDate = end ? new Date(end) : new Date();

//     // Fetch all wallets with transactions containing withdrawal statuses in the date range
//     const wallets = await Wallet.find({
//       transactions: {
//         $elemMatch: {
//           status: { 
//             $in: ["withdrawal-requested", "withdrawal-approved", "withdrawal-rejected"] 
//           },
//           date: { $gte: startDate, $lte: endDate },
//         },
//       },
//     })
//       .populate("user", "name email mobile")                 // Populate wallet owner
//       .populate("transactions.fromUser", "_id name email");  // Populate who triggered the transaction

//     // Extract all matching withdrawal transactions
//     const withdrawalRequests = wallets.flatMap(wallet =>
//       wallet.transactions
//         .filter(txn =>
//           ["withdrawal-requested", "withdrawal-approved", "withdrawal-rejected"].includes(
//             txn.status?.toLowerCase()
//           ) &&
//           txn.date >= startDate &&
//           txn.date <= endDate &&
//           txn.fromUser // Ensure fromUser exists
//         )
//         .map(txn => ({
//           userId: txn.fromUser._id.toString(),
//           amount: txn.amount,
//         }))
//     );

//     // Sum up total withdrawal amount per user
//     const withdrawalTotals = withdrawalRequests.reduce((acc, { userId, amount }) => {
//       acc[userId] = (acc[userId] || 0) + amount;
//       return acc;
//     }, {});

//     // Sort users by total withdrawal amount (descending)
//     const sortedUsers = Object.entries(withdrawalTotals)
//       .map(([userId, amount]) => ({ userId, amount }))
//       .sort((a, b) => b.amount - a.amount);

//     res.json(sortedUsers);
//   } catch (error) {
//     console.error("Error fetching top withdrawal users:", error);
//     res.status(500).send("Failed to fetch top withdrawal users");
//   }
// };



exports.getTopLargeAmountWithdrawalUsers = async (req, res) => {
  try {
    const { start, end } = req.query;

    const startDate = start ? new Date(start) : new Date("1970-01-01");
    const endDate = end ? new Date(end) : new Date();

    const wallets = await Wallet.find({})
      .populate("user", "name email mobile");

    // console.log(`Total wallets: ${wallets}`);

    const withdrawalRequests = wallets.flatMap(wallet =>
      wallet.transactions
        .filter(txn =>
          ["withdrawal-requested", "withdrawal-approved", "withdrawal-rejected"].includes(txn.status?.toLowerCase()) &&
          txn.date >= startDate &&
          txn.date <= endDate &&
          wallet.user
        )
        .map(txn => ({
          userId: wallet.user._id.toString(),
          amount: txn.amount,
        }))
    );

    const withdrawalTotals = withdrawalRequests.reduce((acc, { userId, amount }) => {
      acc[userId] = (acc[userId] || 0) + amount;
      return acc;
    }, {});

    const sortedUsers = Object.entries(withdrawalTotals)
      .map(([userId, amount]) => ({ userId, amount }))
      .sort((a, b) => b.amount - a.amount);

    // user details
    const users = await User.find({ _id: { $in: sortedUsers.map(user => user.userId) } });

    sortedUsers.forEach(user => {
      const foundUser = users.find(u => u._id.toString() === user.userId);
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


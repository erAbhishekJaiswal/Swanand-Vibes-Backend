// utils/commissionService.js
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Order = require("../models/Order");

const COMMISSION_LEVELS = [10, 6, 5, 4, 3, 3, 2, 2, 2, 1, 1, 1]; // %

const distributeCommission = async (orderId) => {
  const order = await Order.findById(orderId).populate("user");
  if (!order || order.commissionsDistributed) return;

  const buyer = order.user;
  const orderAmount = order.itemsPrice; // or totalPrice

  const upline = buyer.sponsorPath || [];

  for (let i = 0; i < COMMISSION_LEVELS.length; i++) {
    if (!upline[i]) break; // no sponsor at this level

    const sponsorId = upline[i];
    const percent = COMMISSION_LEVELS[i];
    const commission = Math.floor(orderAmount * percent / 100); // in paise/cents

    let wallet = await Wallet.findOne({ user: sponsorId });
    if (!wallet) wallet = new Wallet({ user: sponsorId, balance: 0 });

    wallet.balance += commission;
    wallet.transactions.push({
      type: "credit",
      amount: commission,
      balanceAfter: wallet.balance,
      level: i + 1,
      fromUser: buyer._id,
      status: "completed",
    });

    await wallet.save();
  }

  order.commissionsDistributed = true;
  await order.save();
};

module.exports = { distributeCommission };

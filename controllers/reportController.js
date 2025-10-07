/**
 * controllers/reportController.js
 *
 * FIFO COGS based P&L
 */

const Purchase = require('../models/Purchase');
const Order = require('../models/Order'); // adjust path to your Order model
const InventoryLot = require('../models/InventoryLot');
const mongoose = require('mongoose');

/**
 * fifoPLReport
 * Query params:
 *  - from (ISO date)
 *  - to (ISO date)
 *
 * Logic:
 * 1. Load all purchases up to 'to' date (we need lots produced before sales to be available).
 * 2. Build lots per product/variant sorted by receivedAt ascending.
 * 3. Load orders in [from, to], for each order item consume lots FIFO to calculate COGS.
 * 4. Sum revenue (salePrice * qty) and cogs (unitCost * consumedQty).
 *
 * Returns: { revenue, cogs, grossProfit, details: [ per-product summary ] }
 */
exports.fifoPLReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : new Date('1970-01-01');
    const toDate = to ? new Date(to) : new Date();

    // 1. Build the lot pool: all lots with receivedAt <= toDate
    // We'll only consider lots with remainingQty > 0 in DB; however for pure reporting we need the original lot qty,
    // so instead create virtual lots by reading purchases in chronological order (safe approach)
    // Fetch purchases <= toDate
    const purchases = await Purchase.find({ createdAt: { $lte: toDate } })
      .sort({ createdAt: 1 })
      .lean();

    // Create in-memory lots structure [ { productId, variantSize, qty, unitCost, purchaseId, receivedAt } ]
    const lotsMap = new Map(); // key = productId|variantSize -> array of lots (FIFO queue)
    for (const p of purchases) {
      for (const it of p.items) {
        const key = `${it.product.toString()}|${(it.variantSize || '')}`;
        const lot = {
          purchaseId: p._id.toString(),
          product: it.product.toString(),
          variantSize: it.variantSize || null,
          remainingQty: Number(it.quantity),
          unitCost: Number(it.purchasePrice),
          receivedAt: p.createdAt
        };
        if (!lotsMap.has(key)) lotsMap.set(key, []);
        lotsMap.get(key).push(lot);
      }
    }

    // 2. Fetch orders within [fromDate, toDate]
    const orders = await Order.find({ createdAt: { $gte: fromDate, $lte: toDate } }).sort({ createdAt: 1 }).lean();

    let totalRevenue = 0;
    let totalCOGS = 0;
    const productSummary = {}; // productKey -> { revenue, cogs, qtySold }

    // helper to consume qty from lotsMap for a productKey
    function consumeFromLots(productKey, qtyToConsume) {
      let remaining = qtyToConsume;
      let costAccum = 0;

      const queue = lotsMap.get(productKey) || [];
      while (remaining > 0 && queue.length > 0) {
        const head = queue[0];
        const take = Math.min(remaining, head.remainingQty);
        costAccum += take * head.unitCost;
        head.remainingQty -= take;
        remaining -= take;
        if (head.remainingQty <= 0) queue.shift();
      }

      if (remaining > 0) {
        // Not enough stock in historical purchases up to 'to' date. This means sale consumed inventory that wasn't purchased in dataset.
        // We can treat remaining as zero-cost or mark as missing. For accounting accuracy, it's common to mark COGS for missing lots as 0 or estimated.
        // We'll record costAccum as-is and leave discrepancy note.
        // Alternatively, throw an error if you want strict enforcement.
      }

      return { consumedQty: qtyToConsume - remaining, cost: costAccum, shortage: remaining };
    }

    // iterate orders and compute
    for (const ord of orders) {
      for (const it of ord.items) {
        const productId = it.product.toString();
        const variantSize = it.variantSize || '';
        const key = `${productId}|${variantSize}`;
        const qty = Number(it.quantity);
        const salePrice = Number(it.salePrice || it.price || 0); // adapt if field name differs

        const revenueForLine = qty * salePrice;
        totalRevenue += revenueForLine;

        const { consumedQty, cost, shortage } = consumeFromLots(key, qty);
        totalCOGS += cost;

        if (!productSummary[key]) {
          productSummary[key] = { product: productId, variantSize: variantSize || null, revenue: 0, cogs: 0, qtySold: 0, shortage: 0 };
        }
        productSummary[key].revenue += revenueForLine;
        productSummary[key].cogs += cost;
        productSummary[key].qtySold += consumedQty;
        productSummary[key].shortage += shortage;
      }
    }

    const grossProfit = totalRevenue - totalCOGS;

    // convert productSummary map to array
    const details = Object.values(productSummary);

    res.json({
      period: { from: fromDate, to: toDate },
      revenue: totalRevenue,
      cogs: totalCOGS,
      grossProfit,
      details
    });

  } catch (err) {
    console.error('fifoPLReport error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.profitLossReport = async (req, res) => {
try {
     const { from, to } = req.query; // ISO dates, optional
  const matchSales = {};
  const matchPurchases = {};
  if (from) matchSales.createdAt = { $gte: new Date(from) };
  if (to) {
    matchSales.createdAt = Object.assign(matchSales.createdAt || {}, { $lte: new Date(to) });
    matchPurchases.createdAt = Object.assign(matchPurchases.createdAt || {}, { $lte: new Date(to) });
  }
  // Revenue
  const revenueAgg = await Order.aggregate([
    { $match: matchSales },
    { $unwind: "$items" },
    { $group: {
        _id: null,
        revenue: { $sum: { $multiply: ["$items.salePrice", "$items.quantity"] } },
        quantitySold: { $sum: "$items.quantity" }
      }}
  ]);
  // COGS (approx): match sold items to purchases to find average cost. If you keep inventory valuation (FIFO/LIFO), implement accordingly.
  // Simple approach: sum purchase amounts within period
  const purchaseAgg = await Purchase.aggregate([
    { $match: matchPurchases },
    { $unwind: "$items" },
    { $group: {
        _id: null,
        purchaseCost: { $sum: { $multiply: ["$items.purchasePrice", "$items.quantity"] } },
        purchaseQty: { $sum: "$items.quantity" }
      }}
  ]);

  const revenue = (revenueAgg[0] && revenueAgg[0].revenue) || 0;
  const cogs = (purchaseAgg[0] && purchaseAgg[0].purchaseCost) || 0;
  const grossProfit = revenue - cogs;

  res.json({ revenue, cogs, grossProfit });
} catch (error) {
  console.error(error);
  res.status(500).json({ message: error.message || 'Server error' });
}
};
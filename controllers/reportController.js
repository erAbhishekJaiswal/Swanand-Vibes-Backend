/**
 * controllers/reportController.js
 *
 * FIFO COGS based P&L
 */

const Purchase = require('../models/Purchase');
const Order = require('../models/Order'); // adjust path to your Order model
const InventoryLot = require('../models/InventoryLot');
const mongoose = require('mongoose');
const Vendor = require("../models/Vendor");
const Product = require("../models/Product");
const PDFDocument = require("pdfkit");
const path = require("path");

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
// exports.fifoPLReport = async (req, res) => {
//   try {
//     const { from, to } = req.query;
//     const fromDate = from ? new Date(from) : new Date('1970-01-01');
//     const toDate = to ? new Date(to) : new Date();

//     // 1. Build the lot pool: all lots with receivedAt <= toDate
//     // We'll only consider lots with remainingQty > 0 in DB; however for pure reporting we need the original lot qty,
//     // so instead create virtual lots by reading purchases in chronological order (safe approach)
//     // Fetch purchases <= toDate
//     const purchases = await Purchase.find({ createdAt: { $lte: toDate } })
//       .sort({ createdAt: 1 })
//       .lean();

//     // Create in-memory lots structure [ { productId, variantSize, qty, unitCost, purchaseId, receivedAt } ]
//     const lotsMap = new Map(); // key = productId|variantSize -> array of lots (FIFO queue)
//     for (const p of purchases) {
//       for (const it of p.items) {
//         const key = `${it.product.toString()}|${(it.variantSize || '')}`;
//         const lot = {
//           purchaseId: p._id.toString(),
//           product: it.product.toString(),
//           variantSize: it.variantSize || null,
//           remainingQty: Number(it.quantity),
//           unitCost: Number(it.purchasePrice),
//           receivedAt: p.createdAt
//         };
//         if (!lotsMap.has(key)) lotsMap.set(key, []);
//         lotsMap.get(key).push(lot);
//       }
//     }

//     // 2. Fetch orders within [fromDate, toDate]
//     const orders = await Order.find({ createdAt: { $gte: fromDate, $lte: toDate } }).sort({ createdAt: 1 }).lean();

//     let totalRevenue = 0;
//     let totalCOGS = 0;
//     const productSummary = {}; // productKey -> { revenue, cogs, qtySold }

//     // helper to consume qty from lotsMap for a productKey
//     function consumeFromLots(productKey, qtyToConsume) {
//       let remaining = qtyToConsume;
//       let costAccum = 0;

//       const queue = lotsMap.get(productKey) || [];
//       while (remaining > 0 && queue.length > 0) {
//         const head = queue[0];
//         const take = Math.min(remaining, head.remainingQty);
//         costAccum += take * head.unitCost;
//         head.remainingQty -= take;
//         remaining -= take;
//         if (head.remainingQty <= 0) queue.shift();
//       }

//       if (remaining > 0) {
//         // Not enough stock in historical purchases up to 'to' date. This means sale consumed inventory that wasn't purchased in dataset.
//         // We can treat remaining as zero-cost or mark as missing. For accounting accuracy, it's common to mark COGS for missing lots as 0 or estimated.
//         // We'll record costAccum as-is and leave discrepancy note.
//         // Alternatively, throw an error if you want strict enforcement.
//       }

//       return { consumedQty: qtyToConsume - remaining, cost: costAccum, shortage: remaining };
//     }

//     // iterate orders and compute
//     for (const ord of orders) {
//       console.log(ord);
      
//       // for (const it of ord.items) {
//       //   const productId = it.product.toString();
//       //   const variantSize = it.variantSize || '';
//       //   const key = `${productId}|${variantSize}`;
//       //   const qty = Number(it.quantity);
//       //   const salePrice = Number(it.salePrice || it.price || 0); // adapt if field name differs

//       //   const revenueForLine = qty * salePrice;
//       //   totalRevenue += revenueForLine;

//       //   const { consumedQty, cost, shortage } = consumeFromLots(key, qty);
//       //   totalCOGS += cost;

//       //   if (!productSummary[key]) {
//       //     productSummary[key] = { product: productId, variantSize: variantSize || null, revenue: 0, cogs: 0, qtySold: 0, shortage: 0 };
//       //   }
//       //   productSummary[key].revenue += revenueForLine;
//       //   productSummary[key].cogs += cost;
//       //   productSummary[key].qtySold += consumedQty;
//       //   productSummary[key].shortage += shortage;
//       // }
//     }

//     const grossProfit = totalRevenue - totalCOGS;

//     // convert productSummary map to array
//     const details = Object.values(productSummary);

//     res.json({
//       period: { from: fromDate, to: toDate },
//       revenue: totalRevenue,
//       cogs: totalCOGS,
//       grossProfit,
//       details
//     });

//   } catch (err) {
//     console.error('fifoPLReport error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

exports.fifoPLReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : new Date('1970-01-01');
    const toDate = to ? new Date(to) : new Date();

    // 1. Build the lot pool from purchases (up to `toDate`)
    const purchases = await Purchase.find({ createdAt: { $lte: toDate } })
      .sort({ createdAt: 1 })
      .lean();

    // Prepare in-memory lots map: key = productId|size -> FIFO array
    const lotsMap = new Map();
    for (const p of purchases) {
      for (const it of p.items) {
        const key = `${it.product.toString()}|${it.variantSize || ''}`;
        const lot = {
          purchaseId: p._id.toString(),
          product: it.product.toString(),
          variantSize: it.variantSize || '',
          remainingQty: Number(it.quantity),
          unitCost: Number(it.purchasePrice),
          receivedAt: p.createdAt
        };
        if (!lotsMap.has(key)) lotsMap.set(key, []);
        lotsMap.get(key).push(lot);
      }
    }

    // 2. Fetch orders between fromDate and toDate
    const orders = await Order.find({
      createdAt: { $gte: fromDate, $lte: toDate }
    }).sort({ createdAt: 1 }).lean();

    let totalRevenue = 0;
    let totalCOGS = 0;
    const productSummary = {}; // key -> summary

    // Helper function to consume lots using FIFO
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

      return {
        consumedQty: qtyToConsume - remaining,
        cost: costAccum,
        shortage: remaining
      };
    }

    // 3. Iterate over orders and compute financials
    for (const ord of orders) {
      for (const it of ord.orderItems || []) {
        const productId = it.product.toString();
        const size = it.size || '';
        const key = `${productId}|${size}`;
        const qty = Number(it.qty);
        const price = Number(it.price || 0);

        const revenueForLine = qty * price;
        totalRevenue += revenueForLine;

        const { consumedQty, cost, shortage } = consumeFromLots(key, qty);
        totalCOGS += cost;

        if (!productSummary[key]) {
          productSummary[key] = {
            product: productId,
            size,
            revenue: 0,
            cogs: 0,
            qtySold: 0,
            shortage: 0
          };
        }

        productSummary[key].revenue += revenueForLine;
        productSummary[key].cogs += cost;
        productSummary[key].qtySold += consumedQty;
        productSummary[key].shortage += shortage;
      }
    }

    const grossProfit = totalRevenue - totalCOGS;
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
    const fromDate = from ? new Date(from) : new Date('1970-01-01');
    const toDate = to ? new Date(to) : new Date();

  const matchSales = {};
  const matchPurchases = {};
  if (from) matchSales.createdAt = { $gte: new Date(fromDate) };
  if (to) {
    matchSales.createdAt = Object.assign(matchSales.createdAt || {}, { $lte: new Date(toDate) });
    matchPurchases.createdAt = Object.assign(matchPurchases.createdAt || {}, { $lte: new Date(toDate
    ) });
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

// controller for purchase invoice in pdf format
exports.generatePurchaseInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await Purchase.findById(id)
      .populate("vendor", "name email phone address gstNumber")
      .populate("createdBy", "name email")
      .populate("items.product", "name sku");

    const formatCurrency = (value) => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(value);
    };

        if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Create new PDF document
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    doc.font(path.resolve(__dirname, "../fonts/Roboto-Regular.ttf"));

    // Set headers for download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${purchase.invoiceNumber}.pdf`
    );

    // Pipe output to response
    doc.pipe(res);

    // === HEADER SECTION ===
    doc
      .rect(0, 0, 595, 100)
      .fill("#1e3a8a"); // navy blue header background

    doc
      .fontSize(22)
      .fillColor("white")
      // .font("Helvetica-Bold")
      .text("PURCHASE INVOICE", 40, 40);

    doc
      .fontSize(10)
      .fillColor("white")
      // .font("Helvetica")
      .text(`Invoice #: ${purchase.invoiceNumber}`, 400, 45, { align: "right" })
      .text(
        `Date: ${new Date(purchase.createdAt).toLocaleDateString()}`,
        400,
        60,
        { align: "right" }
      );

    // === COMPANY INFO ===
    doc.moveDown(3);
    doc
      .fillColor("#111")
      .fontSize(14)
      // .font("Helvetica-Bold")
      .text("SWANAND VIBES", 40)
      // .font("Helvetica")
      .fontSize(10)
      .fillColor("#555")
      .text("123 Market Road, City, State - 400001")
      .text("Email: contact@grocerystore.in")
      .text("Phone: +91-9876543210");

    // === VENDOR DETAILS ===
    doc.moveDown(2);
    doc
      .fillColor("#111")
      .fontSize(12)
      // .font("Helvetica-Bold")
      .text("Vendor Details", 40);
    doc
      // .font("Helvetica")
      .fillColor("#333")
      .fontSize(10)
      .text(`Name: ${purchase.vendor?.name || "-"}`)
      .text(`Email: ${purchase.vendor?.email || "-"}`)
      .text(`Phone: ${purchase.vendor?.phone || "-"}`)
      .text(`Address: ${purchase.vendor?.address || "-"}`)
      .text(`GST No: ${purchase.vendor?.gstNumber || "-"}`);

    // === TABLE HEADER ===
    const tableTop = 300;
    const colWidths = [30, 170, 70, 80, 80, 80];

    doc
      .moveTo(40, tableTop)
      .lineTo(555, tableTop)
      .stroke("#1e3a8a");

    const headers = ["#", "Product", "Qty", "Price", "Tax", "Total"];
    let x = 40;
    headers.forEach((h, i) => {
      doc
        // .font("Helvetica-Bold")
        .fillColor("white")
        .fontSize(10)
        .rect(x, tableTop, colWidths[i], 20)
        .fill("#1e40af") // Indigo shade
        .stroke()
        .fillColor("white")
        .text(h, x + 5, tableTop + 5);
      x += colWidths[i];
    });

    // === TABLE ROWS ===
    let y = tableTop + 25;
    purchase.items.forEach((item, idx) => {
      const rowColor = idx % 2 === 0 ? "#f9fafb" : "#ffffff";
      x = 40;
      doc.rect(x, y - 3, 515, 20).fill(rowColor);

      const row = [
        idx + 1,
        item.product?.name || "-",
        item.quantity,
        ` ${item.purchasePrice.toFixed(2)}`,
        ` ${item.tax.toFixed(2)}`,
        ` ${item.subtotal.toFixed(2)}`,
      ];

      row.forEach((col, i) => {
        doc
          // .font("Helvetica")
          .fillColor("#111")
          .fontSize(10)
          .text(col.toString(), x + 5, y);
        x += colWidths[i];
      });

      y += 22;
    });

    // === TOTAL SECTION ===
    doc.moveDown(2);
    doc
      // .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#111")
      .text("Sub Total:", 400, y + 20)
      .text("Tax:", 400, y + 40)
      .text("Total Amount:", 400, y + 60);

    doc
      // .font("Helvetica")
      .fillColor("#1e40af")
      .fontSize(12)
      .text( formatCurrency(purchase.subTotal), 480, y + 20)
      .text(formatCurrency(purchase.totalTax), 480, y + 40)
      // .font("Helvetica-Bold")
      .text(`₹ ${purchase.totalAmount.toFixed(2)}`, 480, y + 60);

    // === FOOTER ===
    doc
      .fontSize(10)
      .fillColor("#666")
      .text(
        "Thank you for your purchase! This is a system-generated invoice.",
        40,
        780,
        { align: "center" }
      );

    doc.end();
  } catch (err) {
    console.error("generatePurchaseInvoice error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

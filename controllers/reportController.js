const Purchase = require('../models/Purchase');
const Order = require('../models/Order'); // adjust path to your Order model
const PDFDocument = require("pdfkit");
const path = require("path");


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
    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : new Date('1970-01-01');
    const toDate = to ? new Date(to) : new Date();

    // Match for orders
    const matchOrders = {
      createdAt: { $gte: fromDate, $lte: toDate }
    };
    // Match for purchase
    const matchPurchases = {
      createdAt: { $gte: fromDate, $lte: toDate }
    };

    // 1. Aggregate sales / revenue & tax collected
    const salesAgg = await Order.aggregate([
      { $match: matchOrders },
      { $unwind: "$orderItems" },
      { $group: {
          _id: null,
          totalSales: { $sum: { $multiply: ["$orderItems.price", "$orderItems.qty"] } }, 
          totalTaxCollected: { $sum: "$taxPrice" },
          totalQtySold: { $sum: "$orderItems.qty" }
        }}
    ]);

    const totalSales = (salesAgg[0] && salesAgg[0].totalSales) || 0;
    const totalTaxCollected = (salesAgg[0] && salesAgg[0].totalTaxCollected) || 0;
    const netSales = totalSales - totalTaxCollected;

    // 2. Compute COGS
    // Option A: If you have lotsUsed data in orderItems
    const cogsAgg = await Order.aggregate([
      { $match: matchOrders },
      { $unwind: "$orderItems" },
      { $unwind: "$orderItems.lotsUsed" },  // requires you stored this
      { $group: {
          _id: null,
          totalCOGS: {
            $sum: { $multiply: ["$orderItems.lotsUsed.unitCost", "$orderItems.lotsUsed.qtyFromLot"] }
          }
        }}
    ]);

    let cogs = (cogsAgg[0] && cogsAgg[0].totalCOGS);
    if (cogs == null) {
      // fallback: approximate COGS by summing purchase amounts (less ideal)
      const purchaseAgg = await Purchase.aggregate([
        { $match: matchPurchases },
        { $unwind: "$items" },
        { $group: {
            _id: null,
            totalPurchaseCost: { $sum: "$items.subtotal" },
            totalPurchaseQty: { $sum: "$items.quantity" }
          }}
      ]);
      cogs = (purchaseAgg[0] && purchaseAgg[0].totalPurchaseCost) || 0;
    }

    // 3. Gross Profit
    const grossProfit = netSales - cogs;

    // 4. Operating / Other Expenses: If you track such, you should aggregate them similarly
    // For simplicity, assume none or you fetch “expenses” collection.
    const operatingExpenses = 0;

    const profitBeforeTax = grossProfit - operatingExpenses;

    // 5. Tax Expense: you may have a tax rate or use collected tax vs paid tax
    // Option: tax expense = profitBeforeTax * someTaxRate
    const taxRate = 0.15;  // e.g. 15%
    const taxExpense = profitBeforeTax > 0 ? profitBeforeTax * taxRate : 0;

    const netProfit = profitBeforeTax - taxExpense;

    return res.json({
      totalSales,
      totalTaxCollected,
      netSales,
      cogs,
      grossProfit,
      operatingExpenses,
      profitBeforeTax,
      taxExpense,
      netProfit,
    });

  } catch (err) {
    console.error("ProfitLossReport error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

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

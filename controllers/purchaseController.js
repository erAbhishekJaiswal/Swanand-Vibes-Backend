const mongoose = require("mongoose");
const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const Vendor = require("../models/Vendor");
const InventoryTransaction = require("../models/InventoryTransaction");
const Order = require("../models/Order");
const InventoryLot = require("../models/InventoryLot");

// helper to generate invoice number (simple)
function genInvoiceNumber() {
  const dt = new Date();
  return `PI-${dt.getFullYear()}${(dt.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${dt.getDate().toString().padStart(2, "0")}-${Date.now()
    .toString()
    .slice(-6)}`;
}

// exports.createPurchase = async (req, res) => {
//   const session = await mongoose.startSession();
//   try {
//     const userId = req.user._id; // assume auth middleware sets req.user
//     const { vendorId, items, paymentMethod, notes, invoiceFiles } = req.body;
//     // items: [{ productId, variantSize, variantIndex, quantity, purchasePrice, tax }]
//     if (!vendorId || !items || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({ message: 'Vendor and items required' });
//     }

//     const vendor = await Vendor.findById(vendorId);
//     if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

//     // compute totals and validate
//     let subTotal = 0;
//     let totalTax = 0;
//     let totalQuantity = 0;
//     const itemDocs = [];

//     // start transaction
//     await session.withTransaction(async () => {
//       for (const it of items) {
//         const {
//           productId,
//           variantSize,
//           variantIndex,
//           quantity,
//           purchasePrice,
//           tax = 0
//         } = it;
//         if (!productId || !quantity || !purchasePrice) {
//           throw new Error('Invalid item fields');
//         }

//         const product = await Product.findById(productId).session(session);
//         if (!product) throw new Error(`Product ${productId} not found`);

//         // find variant if specified
//         let matchedVariant = null;
//         let variantPos = null;
//         if (Array.isArray(product.variants) && product.variants.length > 0) {
//           if (typeof variantIndex === 'number') {
//             matchedVariant = product.variants[variantIndex];
//             variantPos = variantIndex;
//           } else if (variantSize) {
//             variantPos = product.variants.findIndex(v => v.size === variantSize);
//             if (variantPos !== -1) matchedVariant = product.variants[variantPos];
//           }
//         }

//         // update variant stock if present else update product.stock
//         if (matchedVariant) {
//           product.variants[variantPos].stock = (product.variants[variantPos].stock || 0) + Number(quantity);
//         } else {
//           product.stock = (product.stock || 0) + Number(quantity);
//         }

//         // Save product
//         await product.save({ session });

//         // record inventory transaction
//         await InventoryTransaction.create([{
//           product: product._id,
//           variantSize: matchedVariant ? matchedVariant.size : null,
//           change: Number(quantity),
//           reason: 'purchase',
//           referenceModel: 'Purchase',
//           // reference will be set after creating Purchase doc; we can set it by updating later or include local ref - we'll update after purchase created
//           createdBy: userId
//         }], { session });

//         const itemSubtotal = (Number(purchasePrice) * Number(quantity));
//         const itemTaxAmount = Number(tax) || 0;
//         subTotal += itemSubtotal;
//         totalTax += itemTaxAmount;
//         totalQuantity += Number(quantity);

//         itemDocs.push({
//           product: product._id,
//           variantSize: matchedVariant ? matchedVariant.size : undefined,
//           variantIndex: variantPos,
//           quantity: Number(quantity),
//           purchasePrice: Number(purchasePrice),
//           tax: Number(itemTaxAmount),
//           subtotal: itemSubtotal + itemTaxAmount
//         });
//       } // end for items

//       const totalAmount = subTotal + totalTax;
//       const purchaseDoc = await Purchase.create([{
//         invoiceNumber: genInvoiceNumber(),
//         vendor: vendor._id,
//         items: itemDocs,
//         totalQuantity,
//         subTotal,
//         totalTax,
//         totalAmount,
//         paymentMethod,
//         notes,
//         invoiceFiles,
//         createdBy: userId
//       }], { session });

//       // get created purchase id and update related inventory transactions reference fields
//       const createdPurchase = purchaseDoc[0];
//       await InventoryTransaction.updateMany(
//         { referenceModel: 'Purchase', createdBy: userId, reason: 'purchase' },
//         { $set: { reference: createdPurchase._id } },
//         { session }
//       );

//       // commit is automatic when the withTransaction callback finishes without error
//       res.status(201).json({ message: 'Purchase created', purchase: createdPurchase });
//     }); // end transaction
//   } catch (err) {
//     console.error(err);
//     // session abort is automatic if an error is thrown
//     res.status(500).json({ message: err.message || 'Server error' });
//   } finally {
//     session.endSession();
//   }
// };

/**
 * createPurchase
 * - Creates a purchase, updates stock (variants or product.stock)
 * - Creates InventoryTransaction logs
 * - Creates InventoryLot entries (for FIFO accounting)
 * - ALL within a MongoDB transaction/session
 *
 * Expected req.body:
 * {
 *   vendorId,
 *   items: [{ productId, variantSize, variantIndex, quantity, purchasePrice, tax }],
 *   paymentMethod, notes, invoiceFiles
 * }
 */

exports.createPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const userId = "68afebc726009740870c1b01";
    const { vendorId, items, paymentMethod, notes, invoiceFiles } = req.body;

    // console.log("Received body:", JSON.stringify(req.body, null, 2));

    const cleanItems = (items || []).filter(
      (item) =>
        item.productId &&
        Number(item.quantity) > 0 &&
        Number(item.purchasePrice) >= 0
    );

    // console.log("cleanItems:", JSON.stringify(cleanItems, null, 2));

    if (!vendorId || cleanItems.length === 0) {
      return res.status(400).json({
        message: "vendorId and at least one valid item are required",
      });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    let subTotal = 0;
    let totalTax = 0;
    let totalQuantity = 0;
    const itemDocs = [];

    await session.withTransaction(async () => {
      for (const it of cleanItems) {
        // console.log("Processing item it:", JSON.stringify(it, null, 2));

        const {
          productId,
          variantSize,
          variantIndex,
          quantity,
          purchasePrice,
          tax = 0,
        } = it;

        const product = await Product.findById(productId).session(session);
        if (!product) throw new Error(`Product ${productId} not found`);

        let matchedVariant = null;
        let variantPos = -1;
        if (Array.isArray(product.variants) && product.variants.length > 0) {
          if (typeof variantIndex === "number") {
            variantPos = variantIndex;
            matchedVariant = product.variants[variantIndex];
          } else if (variantSize) {
            variantPos = product.variants.findIndex((v) => v.size === variantSize);
            if (variantPos !== -1) {
              matchedVariant = product.variants[variantPos];
            }
          }
        }

        if (matchedVariant) {
          product.variants[variantPos].stock =
            (product.variants[variantPos].stock || 0) + Number(quantity);
          product.stock = product.variants.reduce(
            (s, v) => s + (v.stock || 0),
            0
          );
        } else {
          product.stock = (product.stock || 0) + Number(quantity);
        }

        await product.save({ session });

        await InventoryTransaction.create(
          [
            {
              product: product._id,
              variantSize: matchedVariant ? matchedVariant.size : null,
              change: Number(quantity),
              reason: "purchase",
              referenceModel: "Purchase",
              createdBy: userId,
            },
          ],
          { session }
        );

        const lot = new InventoryLot({
          purchase: null,
          product: product._id,
          variantSize: matchedVariant ? matchedVariant.size : null,
          remainingQty: Number(quantity),
          unitCost: Number(purchasePrice),
          receivedAt: new Date(),
        });
        await lot.save({ session });

        const itemSubtotal = Number(purchasePrice) * Number(quantity);
        const itemTaxAmount = Number(tax) || 0;
        subTotal += itemSubtotal;
        totalTax += itemTaxAmount;
        totalQuantity += Number(quantity);

        const itemDoc = {
          product: product._id,
          variantSize: matchedVariant ? matchedVariant.size : undefined,
          variantIndex: variantPos,
          quantity: Number(quantity),
          purchasePrice: Number(purchasePrice),
          tax: Number(itemTaxAmount),
          subtotal: itemSubtotal + itemTaxAmount,
        };

        itemDocs.push(itemDoc);
        // console.log("Added itemDoc:", JSON.stringify(itemDoc, null, 2));
      }

      const totalAmount = subTotal + totalTax;
      const createdArr = await Purchase.create(
        [
          {
            invoiceNumber: genInvoiceNumber(),
            vendor: vendor._id,
            items: itemDocs,
            totalQuantity,
            subTotal,
            totalTax,
            totalAmount,
            paymentMethod,
            notes,
            invoiceFiles,
            createdBy: userId,
          },
        ],
        { session }
      );

      const purchaseDoc = createdArr[0];
      // console.log("Purchase doc saved:", JSON.stringify(purchaseDoc, null, 2));

      await InventoryLot.updateMany(
        { purchase: null, product: { $in: itemDocs.map((i) => i.product) } },
        { $set: { purchase: purchaseDoc._id } },
        { session }
      );

      await InventoryTransaction.updateMany(
        {
          referenceModel: "Purchase",
          reference: { $exists: false },
          createdBy: userId,
          reason: "purchase",
        },
        { $set: { reference: purchaseDoc._id } },
        { session }
      );

      res.status(201).json({ message: "Purchase created", purchase: purchaseDoc });
    });
  } catch (err) {
    console.error("createPurchase error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  } finally {
    session.endSession();
  }
};

// exports.createPurchase = async (req, res) => {
//   const session = await mongoose.startSession();
//   try {
//     const userId = "68afebc726009740870c1b01";
//     const { vendorId, items, paymentMethod, notes, invoiceFiles } = req.body;

//       const cleanItems = (items || []).filter(
//         (item) =>
//           item.productId &&
//           Number(item.quantity) > 0 &&
//           Number(item.purchasePrice) >= 0
//       );

//       if (!vendorId || cleanItems.length === 0) {
//         return res
//           .status(400)
//           .json({
//             message: "vendorId and at least one valid item are required",
//           });
//       }

//     if (!vendorId || !items || !Array.isArray(items) || items.length === 0) {
//       return res
//         .status(400)
//         .json({ message: "vendorId and items are required" });
//     }

//     const vendor = await Vendor.findById(vendorId);
//     if (!vendor) return res.status(404).json({ message: "Vendor not found" });

//     let subTotal = 0;
//     let totalTax = 0;
//     let totalQuantity = 0;
//     const itemDocs = [];

//     await session.withTransaction(async () => {
//       for (const it of cleanItems) {
//         const {
//           productId,
//           variantSize,
//           variantIndex,
//           quantity,
//           purchasePrice,
//           tax = 0,
//         } = it;
//         if (!productId || !quantity || !purchasePrice)
//           throw new Error("Item missing required fields");

//         const product = await Product.findById(productId).session(session);
//         if (!product) throw new Error(`Product ${productId} not found`);

//         // find variant
//         let matchedVariant = null;
//         let variantPos = -1;
//         if (Array.isArray(product.variants) && product.variants.length > 0) {
//           if (typeof variantIndex === "number") {
//             variantPos = variantIndex;
//             matchedVariant = product.variants[variantIndex];
//           } else if (variantSize) {
//             variantPos = product.variants.findIndex(
//               (v) => v.size === variantSize
//             );
//             if (variantPos !== -1)
//               matchedVariant = product.variants[variantPos];
//           }
//         }

//         // update stock
//         if (matchedVariant) {
//           product.variants[variantPos].stock =
//             (product.variants[variantPos].stock || 0) + Number(quantity);
//           // ensure top-level product.stock equals sum of variant stocks (recommended)
//           product.stock = product.variants.reduce(
//             (s, v) => s + (v.stock || 0),
//             0
//           );
//         } else {
//           product.stock = (product.stock || 0) + Number(quantity);
//         }

//         await product.save({ session });

//         // create inventory transaction
//         await InventoryTransaction.create(
//           [
//             {
//               product: product._id,
//               variantSize: matchedVariant ? matchedVariant.size : null,
//               change: Number(quantity),
//               reason: "purchase",
//               referenceModel: "Purchase",
//               createdBy: userId,
//             },
//           ],
//           { session }
//         );

//         // create inventory lot for FIFO accounting
//         // InventoryLot fields: purchase: purchaseId (set later), product, variantSize, remainingQty, unitCost, receivedAt
//         // We'll create a temporary lot with reference to null purchase; we'll set purchase id after Purchase creation
//         const lot = new InventoryLot({
//           purchase: null, // will update after purchase created
//           product: product._id,
//           variantSize: matchedVariant ? matchedVariant.size : null,
//           remainingQty: Number(quantity),
//           unitCost: Number(purchasePrice),
//           receivedAt: new Date(),
//         });
//         await lot.save({ session });

//         const itemSubtotal = Number(purchasePrice) * Number(quantity);
//         const itemTaxAmount = Number(tax) || 0;
//         subTotal += itemSubtotal;
//         totalTax += itemTaxAmount;
//         totalQuantity += Number(quantity);

//         itemDocs.push({
//           product: product._id,
//           variantSize: matchedVariant ? matchedVariant.size : undefined,
//           variantIndex: variantPos,
//           quantity: Number(quantity),
//           purchasePrice: Number(purchasePrice),
//           tax: Number(itemTaxAmount),
//           subtotal: itemSubtotal + itemTaxAmount,
//         });
//       } // for each item

//       const totalAmount = subTotal + totalTax;
//       const created = await Purchase.create(
//         [
//           {
//             invoiceNumber: genInvoiceNumber(),
//             vendor: vendor._id,
//             items: itemDocs,
//             totalQuantity,
//             subTotal,
//             totalTax,
//             totalAmount,
//             paymentMethod,
//             notes,
//             invoiceFiles,
//             createdBy: userId,
//           },
//         ],
//         { session }
//       );

//       const purchaseDoc = created[0];

//       // update lots to reference the created purchase id
//       await InventoryLot.updateMany(
//         { purchase: null, product: { $in: itemDocs.map((i) => i.product) } },
//         { $set: { purchase: purchaseDoc._id } },
//         { session }
//       );

//       // update inventory transactions to reference this purchase
//       await InventoryTransaction.updateMany(
//         {
//           referenceModel: "Purchase",
//           reference: { $exists: false },
//           createdBy: userId,
//           reason: "purchase",
//         },
//         { $set: { reference: purchaseDoc._id } },
//         { session }
//       );

//       res
//         .status(201)
//         .json({ message: "Purchase created", purchase: purchaseDoc });
//     });
//   } catch (err) {
//     console.error("createPurchase error:", err);
//     res.status(500).json({ message: err.message || "Server error" });
//   } finally {
//     session.endSession();
//   }
// };

/**
 * getPurchases
 * - supports pagination, filtering (vendor, date range, status)
 * - query params: page, limit, vendorId, status, from, to, search (invoiceNumber or vendor name)
 */
// exports.getPurchases = async (req, res) => {
//   try {
//     let {
//       page = 1,
//       limit = 20,
//       vendorId,
//       status,
//       from,
//       to,
//       search,
//     } = req.query;
//     page = Number(page);
//     limit = Number(limit);

//     const match = {};
//     if (vendorId) match.vendor = vendorId;
//     if (status) match.status = status;
//     if (from || to) match.createdAt = {};
//     if (from) match.createdAt.$gte = new Date(from);
//     if (to) match.createdAt.$lte = new Date(to);

//     // basic search on invoiceNumber
//     // if (search) match.invoiceNumber = { $regex: search, $options: "i" };

//     // search on vendor name
//     if (search) {
//       match.$or = [
//         { invoiceNumber: { $regex: search, $options: "i" } },
//         { "vendor.name": { $regex: search, $options: "i" } },
//       ];
//     }

//     console.log("match:", match);

//     const query = Purchase.find(match)
//       .populate("vendor", "name")
//       .populate("createdBy", "name email")
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(limit);

//     const [purchases, total] = await Promise.all([
//       query.exec(),
//       Purchase.countDocuments(match),
//     ]);

//     res.json({
//       data: purchases,
//       meta: {
//         page,
//         limit,
//         total,
//         pages: Math.ceil(total / limit),
//       },
//     });
//   } catch (err) {
//     console.error("getPurchases error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

exports.getPurchases = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 20,
      vendorId,
      status,
      from,
      to,
      search,
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const match = {};

    if (vendorId) match.vendor = new mongoose.Types.ObjectId(vendorId);
    if (status) match.status = status;
    if (from || to) match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);

    const pipeline = [
      { $match: match },
      // Lookup vendor
      {
        $lookup: {
          from: 'vendors',
          localField: 'vendor',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      { $unwind: "$vendor" },
      // Lookup items.product
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'products'
        }
      },
      // Optional: search
      ...(search
        ? [{
            $match: {
              $or: [
                { invoiceNumber: { $regex: search, $options: "i" } },
                { "vendor.name": { $regex: search, $options: "i" } },
                { "products.name": { $regex: search, $options: "i" } }
              ]
            }
          }]
        : []),

      // Add pagination and total count
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
          ],
          total: [
            { $count: "count" }
          ]
        }
      }
    ];

    const result = await Purchase.aggregate(pipeline);

    const purchases = result[0]?.data || [];
    const total = result[0]?.total?.[0]?.count || 0;

    res.json({
      data: purchases,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    });

  } catch (err) {
    console.error("getPurchases error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * getPurchaseById
 */
exports.getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const purchase = await Purchase.findById(id)
      .populate("vendor")
      .populate("items.product")
      .populate("createdBy", "name email");

    if (!purchase)
      return res.status(404).json({ message: "Purchase not found" });

    // also fetch inventory lots for this purchase (useful for FIFO debugging)
    const lots = await InventoryLot.find({ purchase: purchase._id });

    res.json({ purchase, lots });
  } catch (err) {
    console.error("getPurchaseById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * updatePurchaseStatus
 * - Allows changing status: received, processing, completed, cancelled
 * - If cancelled: attempt to reverse stock by creating negative InventoryTransaction and adjusting product/variant stock AND reduce InventoryLot.remainingQty
 * - Request body: { status: 'cancelled'|'received'|'completed' , cancelReason? }
 */
exports.updatePurchaseStatus = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;
    const { status, cancelReason } = req.body;
    const allowed = ["received", "processing", "completed", "cancelled"];
    if (!allowed.includes(status))
      return res.status(400).json({ message: "Invalid status" });

    await session.withTransaction(async () => {
      const purchase = await Purchase.findById(id).session(session);
      if (!purchase) throw new Error("Purchase not found");

      // handle cancellation: reverse stock and lots
      if (status === "cancelled" && purchase.status !== "cancelled") {
        // revert stock: for each item subtract quantity
        for (const it of purchase.items) {
          const product = await Product.findById(it.product).session(session);
          if (!product) continue;

          // adjust variant or product.stock
          if (
            Array.isArray(product.variants) &&
            product.variants.length > 0 &&
            typeof it.variantIndex === "number" &&
            it.variantIndex >= 0
          ) {
            const idx = it.variantIndex;
            product.variants[idx].stock = Math.max(
              0,
              (product.variants[idx].stock || 0) - it.quantity
            );
            // recalc product.stock
            product.stock = product.variants.reduce(
              (s, v) => s + (v.stock || 0),
              0
            );
          } else if (it.variantSize) {
            const idx = product.variants.findIndex(
              (v) => v.size === it.variantSize
            );
            if (idx !== -1) {
              product.variants[idx].stock = Math.max(
                0,
                (product.variants[idx].stock || 0) - it.quantity
              );
              product.stock = product.variants.reduce(
                (s, v) => s + (v.stock || 0),
                0
              );
            } else {
              product.stock = Math.max(0, (product.stock || 0) - it.quantity);
            }
          } else {
            product.stock = Math.max(0, (product.stock || 0) - it.quantity);
          }

          await product.save({ session });

          // create negative inventory transaction
          await InventoryTransaction.create(
            [
              {
                product: product._id,
                variantSize: it.variantSize || null,
                change: -Math.abs(it.quantity),
                reason: "purchase_cancel",
                referenceModel: "Purchase",
                reference: purchase._id,
                createdBy: req.user._id,
              },
            ],
            { session }
          );

          // adjust inventory lots remainingQty for lots belonging to this purchase:
          // reduce the remainingQty by the quantity (if remainingQty >= qty serve, else set to 0)
          await InventoryLot.updateMany(
            {
              purchase: purchase._id,
              product: product._id,
              variantSize: it.variantSize || null,
            },
            { $inc: { remainingQty: -it.quantity } },
            { session }
          );
          // ensure no negative remainingQty
          await InventoryLot.updateMany(
            {
              purchase: purchase._id,
              product: product._id,
              variantSize: it.variantSize || null,
              remainingQty: { $lt: 0 },
            },
            { $set: { remainingQty: 0 } },
            { session }
          );
        }
      }

      purchase.status = status;
      if (status === "cancelled" && cancelReason)
        purchase.notes =
          (purchase.notes || "") + `\nCancel reason: ${cancelReason}`;
      await purchase.save({ session });

      res.json({ message: "Purchase updated", purchase });
    });
  } catch (err) {
    console.error("updatePurchaseStatus error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  } finally {
    session.endSession();
  }
};


// DELETE Purchase (only if recently created)
exports.deletePurchase = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;
    const userId = "68afebc726009740870c1b01";

    const purchase = await Purchase.findById(id).populate("items.product").session(session);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Business rule: Allow delete only if created within last 24 hours
    const timeDiffHours = (Date.now() - new Date(purchase.createdAt)) / (1000 * 60 * 60);
    if (timeDiffHours > 24) {
      return res
        .status(400)
        .json({ message: "Cannot delete purchase older than 24 hours" });
    }

    await session.withTransaction(async () => {
      // 1️⃣ Reverse stock & remove related transactions/lots
      for (const item of purchase.items) {
        const product = await Product.findById(item.product._id).session(session);
        if (!product) continue;

        // Find variant position
        let variantPos = -1;
        if (Array.isArray(product.variants) && product.variants.length > 0 && item.variantSize) {
          variantPos = product.variants.findIndex((v) => v.size === item.variantSize);
        }

        if (variantPos !== -1) {
          // Subtract stock from variant
          product.variants[variantPos].stock = Math.max(
            (product.variants[variantPos].stock || 0) - Number(item.quantity),
            0
          );
          product.stock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
        } else {
          // Subtract from general stock
          product.stock = Math.max((product.stock || 0) - Number(item.quantity), 0);
        }

        await product.save({ session });

        // Delete related inventory transactions
        await InventoryTransaction.deleteMany(
          {
            referenceModel: "Purchase",
            reference: purchase._id,
            product: product._id,
            createdBy: userId,
          },
          { session }
        );

        // Delete related inventory lots
        await InventoryLot.deleteMany(
          {
            purchase: purchase._id,
            product: product._id,
          },
          { session }
        );
      }

      // 2️⃣ Delete the purchase record
      await Purchase.findByIdAndDelete(purchase._id, { session });

      res.json({ message: "Purchase and related data deleted successfully" });
    });
  } catch (err) {
    console.error("deletePurchase error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  } finally {
    session.endSession();
  }
};


exports.profitLossReport = async (req, res) => {
  try {
    const { from, to } = req.query; // ISO dates, optional
    const matchSales = {};
    const matchPurchases = {};
    if (from) matchSales.createdAt = { $gte: new Date(from) };
    if (to) {
      matchSales.createdAt = Object.assign(matchSales.createdAt || {}, {
        $lte: new Date(to),
      });
      matchPurchases.createdAt = Object.assign(matchPurchases.createdAt || {}, {
        $lte: new Date(to),
      });
    }
    // Revenue
    const revenueAgg = await Order.aggregate([
      { $match: matchSales },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          revenue: {
            $sum: { $multiply: ["$items.salePrice", "$items.quantity"] },
          },
          quantitySold: { $sum: "$items.quantity" },
        },
      },
    ]);
    // COGS (approx): match sold items to purchases to find average cost. If you keep inventory valuation (FIFO/LIFO), implement accordingly.
    // Simple approach: sum purchase amounts within period
    const purchaseAgg = await Purchase.aggregate([
      { $match: matchPurchases },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          purchaseCost: {
            $sum: { $multiply: ["$items.purchasePrice", "$items.quantity"] },
          },
          purchaseQty: { $sum: "$items.quantity" },
        },
      },
    ]);

    const revenue = (revenueAgg[0] && revenueAgg[0].revenue) || 0;
    const cogs = (purchaseAgg[0] && purchaseAgg[0].purchaseCost) || 0;
    const grossProfit = revenue - cogs;

    res.json({ revenue, cogs, grossProfit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

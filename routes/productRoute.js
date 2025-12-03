const express = require("express");
const router = express.Router();

const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    rateingonProduct
} = require("../controllers/productController");
const { protect } = require("../middleware/authMiddlware");

router.post("/", protect, createProduct);
router.get("/stock", protect, require("../controllers/productController").exportStockReport);
router.get('/filters', require("../controllers/productController").getFilters);

router.get("/signature", require("../controllers/productController").generateUploadSignature);
router.get("/", protect, getAllProducts);
router.get("/common", require("../controllers/productController").getCommonProducts);
router.get("/search", require("../controllers/productController").searchProductforPurchase);
router.get('/common/:id', require("../controllers/productController").getCommonProductById);
router.get("/:id", protect, getProductById);
router.put("/:id", protect, updateProduct);
router.put("/rate/:id", protect, rateingonProduct);
router.delete("/:id", protect, deleteProduct);

module.exports = router;

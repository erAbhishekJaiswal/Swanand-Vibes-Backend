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

router.post("/", createProduct);
router.get("/stock", require("../controllers/productController").exportStockReport);
router.get('/filters', require("../controllers/productController").getFilters);

router.get("/signature", require("../controllers/productController").generateUploadSignature);
router.get("/", getAllProducts);
router.get("/common", require("../controllers/productController").getCommonProducts);
router.get("/search", require("../controllers/productController").searchProductforPurchase);
router.get('/common/:id', require("../controllers/productController").getCommonProductById);
router.get("/:id", getProductById);
router.put("/:id", updateProduct);
router.put("/rate/:id", rateingonProduct);
router.delete("/:id", deleteProduct);

module.exports = router;

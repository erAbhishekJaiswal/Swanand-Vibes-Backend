const express = require("express");
const router = express.Router();

const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");

router.post("/", createProduct);
router.get('/filters', require("../controllers/productController").getFilters);

router.get("/signature", require("../controllers/productController").generateUploadSignature);
router.get("/", getAllProducts);
router.get("/common", require("../controllers/productController").getCommonProducts);
router.get('/common/:id', require("../controllers/productController").getCommonProductById);
router.get("/:id", getProductById);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;

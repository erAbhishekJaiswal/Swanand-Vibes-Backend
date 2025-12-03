 const express = require("express");
const router = express.Router();
const {addCategory, deleteCategory, getAllCategories} = require("../controllers/categoryController");
// const authMiddleware = require("../middleware/authMiddleware");
const { protect } = require("../middleware/authMiddlware");

router.post("/", 
    //authMiddleware, 
    protect
    ,
    addCategory);
router.get("/", 
    protect,
    // authMiddleware,
    getAllCategories);

router.delete("/:id", 
    protect,
    // authMiddleware, 
    deleteCategory);

module.exports = router;
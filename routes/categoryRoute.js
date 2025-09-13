 const express = require("express");
const router = express.Router();
const {addCategory, deleteCategory, getAllCategories} = require("../controllers/categoryController");
// const authMiddleware = require("../middleware/authMiddleware");

router.post("/", 
    //authMiddleware, 
    addCategory);
router.get("/", 
    // authMiddleware,
    getAllCategories);

router.delete("/:id", 
    // authMiddleware, 
    deleteCategory);

module.exports = router;
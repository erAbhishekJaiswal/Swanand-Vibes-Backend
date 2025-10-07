// routes/vendorRoutes.js
const express = require("express");
const router = express.Router();
// const Vendor = require("../models/Vendor");
const {createVendor, getVendors, getVendorById, updateVendor, deleteVendor} = require("../controllers/vendorController");


router.post("/", 
    // authMiddleware,
    createVendor
)

router.get("/", 
    // authMiddleware,
    getVendors
)

router.get("/:id", 
    // authMiddleware,
    getVendorById
)

router.put("/:id", 
    // authMiddleware,
    updateVendor
)

router.delete("/:id", 
    // authMiddleware,
    deleteVendor
)




module.exports = router;
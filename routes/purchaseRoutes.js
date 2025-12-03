const express = require('express');
const router = express.Router();
const {createPurchase, getPurchases, getPurchaseById, updatePurchaseStatus,updatePaymentStatus, deletePurchase} = require('../controllers/purchaseController');
// const { isAdmin, protect } = require('../middleware/auth'); // assume these exist
const { protect } = require("../middleware/authMiddlware");
router.post('/', 
    protect,
    // protect, isAdmin, 
    createPurchase);
router.get('/',
    protect,
    //  protect, isAdmin, 
     getPurchases); // implement simple list
router.get('/:id',
    protect,
    //  protect, isAdmin, 
     getPurchaseById);
router.put('/:id/status',
    protect,
    //  protect, isAdmin, 
     updatePurchaseStatus);

router.put('/:id/payment-status',protect, updatePaymentStatus);

router.delete('/:id',
//     //  protect, isAdmin, 
        protect,
     deletePurchase);

module.exports = router;

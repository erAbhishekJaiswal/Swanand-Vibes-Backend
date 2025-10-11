const express = require('express');
const router = express.Router();
const {createPurchase, getPurchases, getPurchaseById, updatePurchaseStatus,updatePaymentStatus, deletePurchase} = require('../controllers/purchaseController');
// const { isAdmin, protect } = require('../middleware/auth'); // assume these exist

router.post('/', 
    // protect, isAdmin, 
    createPurchase);
router.get('/',
    //  protect, isAdmin, 
     getPurchases); // implement simple list
router.get('/:id',
    //  protect, isAdmin, 
     getPurchaseById);
router.put('/:id/status',
    //  protect, isAdmin, 
     updatePurchaseStatus);

router.put('/:id/payment-status', updatePaymentStatus);

router.delete('/:id',
//     //  protect, isAdmin, 
     deletePurchase);

module.exports = router;

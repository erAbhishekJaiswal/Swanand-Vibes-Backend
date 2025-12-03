const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');
const { protect } = require('../middleware/authMiddlware');
// Admin or user routes
router.get('/', protect, kycController.getAllKycs);
// User routes
router.post('/submit', protect, kycController.submitKyc);

router.put('/:id/approve', protect, kycController.approveKyc);
router.put('/:id/reject', protect, kycController.rejectKyc);
router.get('/:id', protect, kycController.getKycById);
router.get('/user/:userId', protect, kycController.getKycByUserId);
router.post('/', protect, kycController.createKyc);
router.put('/status/:id', protect, kycController.updateKycStatus);
router.delete('/:id', protect, kycController.deleteKyc);

module.exports = router;

const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');

// Admin or user routes
router.get('/', kycController.getAllKycs);
router.post('/submit', kycController.submitKyc);
router.put('/:id/approve', kycController.approveKyc);
router.put('/:id/reject', kycController.rejectKyc);
router.get('/:id', kycController.getKycById);
router.get('/user/:userId', kycController.getKycByUserId);
router.post('/', kycController.createKyc);
router.put('/status/:id', kycController.updateKycStatus);
router.delete('/:id', kycController.deleteKyc);

module.exports = router;

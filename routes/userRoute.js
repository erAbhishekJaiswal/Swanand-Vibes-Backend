const express = require('express')

const router = express.Router()

// Import user controller functions
const {
    getAllUsers,
    getUserById,
    getUserProfile,
    updateUser,
    deleteUser,
    getUserAddress,
    updateUserAddress,getUpline, getDownline,adminDashboard, userDashboard
} = require('../controllers/userController')
const { protect } = require('../middleware/authMiddlware')

// Define routes
router.get('/', protect , getAllUsers)
router.get('/:id', protect , getUserById)
router.put('/:id/profile', protect, updateUser)
router.put('/:id/address', protect, updateUserAddress)
router.delete('/:id', protect, deleteUser)
router.get('/:id/profile', protect, getUserProfile)
router.get('/address/:id', protect, getUserAddress)
router.get("/upline/:userId", protect, getUpline);
router.get("/downline/:userId", protect, getDownline);
router.get("/dashboard/:id", protect, adminDashboard);
router.get("/dashboard/user/:id", protect, userDashboard);


module.exports = router
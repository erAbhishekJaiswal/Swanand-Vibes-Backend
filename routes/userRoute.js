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
    updateUserAddress,getUpline, getDownline
} = require('../controllers/userController')

// Define routes
router.get('/', getAllUsers)
router.get('/:id', getUserById)
router.put('/:id/profile', updateUser)
router.put('/:id/address', updateUserAddress)
router.delete('/:id', deleteUser)
router.get('/:id/profile', getUserProfile)
router.get('/address/:id', getUserAddress)
router.get("/upline/:userId", getUpline);
router.get("/downline/:userId", getDownline);


module.exports = router
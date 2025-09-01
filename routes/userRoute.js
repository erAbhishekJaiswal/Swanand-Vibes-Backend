const express = require('express')

const router = express.Router()

// Import user controller functions
const {
    getAllUsers,
    getUserById,
    getUserProfile,
    updateUser,
    deleteUser,
    getUserAddress
} = require('../controllers/userController')

// Define routes
router.get('/', getAllUsers)
router.get('/:id', getUserById)
router.put('/:id', updateUser)
router.delete('/:id', deleteUser)
router.get('/:id/profile', getUserProfile)
router.get('/address/:id', getUserAddress)

module.exports = router
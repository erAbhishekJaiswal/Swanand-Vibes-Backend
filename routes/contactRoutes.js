const express = require("express");
const {
    createContact,
    getContacts,
    getContactById,
    updateContactStatus,
    deleteContact,
} = require("../controllers/contactController.js");
const router = express.Router();
const { protect } = require("../middleware/authMiddlware");
// Public route → anyone can submit a contact form
router.post("/",  createContact);

// Admin routes → require authentication & admin check (middleware can be added later)
router.get("/", protect, getContacts);
router.get("/:id", protect, getContactById);
router.put("/:id", protect, updateContactStatus);
router.delete("/:id", protect, deleteContact);

module.exports = router;

const express = require("express");
const {
    createContact,
    getContacts,
    getContactById,
    updateContactStatus,
    deleteContact,
} = require("../controllers/contactController.js");


const router = express.Router();

// Public route → anyone can submit a contact form
router.post("/", createContact);

// Admin routes → require authentication & admin check (middleware can be added later)
router.get("/", getContacts);
router.get("/:id", getContactById);
router.put("/:id", updateContactStatus);
router.delete("/:id", deleteContact);

module.exports = router;

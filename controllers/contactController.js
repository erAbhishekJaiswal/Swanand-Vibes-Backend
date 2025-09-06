// controllers/contactController.js
// import Contact from "../models/Contact.js";
const Contact = require("../models/Contact");

/**
 * @desc    Create a new contact form entry
 * @route   POST /api/contact
 * @access  Public
 */
const createContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, Email and Message are required" });
    }

    const contact = new Contact({
      name,
      email,
      phone,
      subject,
      message,
    });

    await contact.save();
    res.status(201).json({ message: "Contact form submitted successfully", contact });
  } catch (error) {
    res.status(500).json({ error: "Server error while submitting form", details: error.message });
  }
};

/**
 * @desc    Get all contact form submissions (Admin only)
 * @route   GET /api/contact
 * @access  Private/Admin
 */
const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ error: "Server error while fetching contacts", details: error.message });
  }
};

/**
 * @desc    Get a single contact form submission by ID
 * @route   GET /api/contact/:id
 * @access  Private/Admin
 */
const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }
    res.status(200).json(contact);
  } catch (error) {
    res.status(500).json({ error: "Server error while fetching contact", details: error.message });
  }
};

/**
 * @desc    Update contact status (e.g., in-progress, resolved)
 * @route   PUT /api/contact/:id
 * @access  Private/Admin
 */
const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    if (status) contact.status = status;

    await contact.save();
    res.status(200).json({ message: "Contact status updated", contact });
  } catch (error) {
    res.status(500).json({ error: "Server error while updating contact", details: error.message });
  }
};

/**
 * @desc    Delete a contact form submission
 * @route   DELETE /api/contact/:id
 * @access  Private/Admin
 */
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    await contact.deleteOne();
    res.status(200).json({ message: "Contact deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error while deleting contact", details: error.message });
  }
};

module.exports = {
  createContact,
  getContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
};
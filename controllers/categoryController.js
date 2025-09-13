const Category = require('../models/Category');

const addCategory = async (req, res) => {
  try {
    const { name } = req.body;

    const category = await Category.create({ name });
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    await Category.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { addCategory, deleteCategory,getAllCategories };
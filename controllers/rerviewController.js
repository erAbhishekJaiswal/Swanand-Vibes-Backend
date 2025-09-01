const Product = require("../models/Product");

const createReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;

        // Validate product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        // Create review
        const review = await Review.create({
            product: productId,
            user: req.user.id,
            rating,
            comment
        });

        res.status(201).json({ success: true, data: review });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

const getReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId });
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};


const getReviewById = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }
        res.status(200).json({ success: true, data: review });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};


const updateReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }

        review.rating = req.body.rating;
        review.comment = req.body.comment;
        await review.save();

        res.status(200).json({ success: true, data: review });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }

        await review.remove();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};


module.exports = {
    createReview,
    getReviews,
    getReviewById,
    updateReview,
    deleteReview
};

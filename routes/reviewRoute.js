const express = require("express");
const router = express.Router();

const {
    createReview,
    getReviews,
    getReviewById,
    updateReview,
    deleteReview
} = require("../controllers/rerviewController");

router.post("/", createReview);
router.get("/", getReviews);
router.get("/:id", getReviewById);
router.put("/:id", updateReview);
router.delete("/:id", deleteReview);

module.exports = router;

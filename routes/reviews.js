const express = require('express');
const catchAsync = require('../utils/catchAsync');
const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware');
const reviews = require('../controllers/reviews');

const router = express.Router({ mergeParams: true });

// Route to add a review to a campground by a user
router.post('/', isLoggedIn, validateReview, catchAsync(reviews.createReview));

// Route to delete a review and its reference from the campground document
router.delete('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(reviews.deleteReview));

module.exports = router;
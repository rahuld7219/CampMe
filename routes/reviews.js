const express = require('express');
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/expressError');
const Review = require('../models/review');
const Campground = require('../models/campground');
const { reviewSchema } = require('../schemas');

// creating a router object
const router = express.Router({ mergeParams: true });
// routers have their own separate params, so to access params of passed path by app.use, we pass mergeParams set to true to the express.Router()

// middleware to validate the review data
const validateReview = (req, res, next) => {
    // validating the req.body data using the joi schema
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

router.post('/', validateReview, catchAsync( async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review); // as the form data passed as grouped in "review" object
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash('success', "sucessfully created the review!");
    res.redirect(`/campgrounds/${campground._id}`);
}));

// Route to delete a review and its reference from the campground document
router.delete('/:reviewId', catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;

    // delete the review document from the reviews collection
    await Review.findByIdAndDelete(reviewId);

    // delete the reference of the deleted review from the campground document (i.e., update the campground document)
    // it first finds the campground document where _id=id then from the reviews array of that document remove those embedded documents having reviewId as an eleemnt.
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    req.flash('success', "Successfully deleted the review!");
    res.redirect(`/campgrounds/${id}`);
}));

module.exports = router;
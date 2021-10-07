const Review = require('../models/review');
const Campground = require('../models/campground');


module.exports.createReview = async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review); // as the form data grouped in "review" object
    review.author = req.user._id;
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash('success', "sucessfully created the review!");
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;

    await Review.findByIdAndDelete(reviewId);

    // delete the reference of the deleted review from the campground document (i.e., update the campground document)
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    req.flash('success', "Successfully deleted the review!");
    res.redirect(`/campgrounds/${id}`);
};
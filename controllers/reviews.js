const Review = require('../models/Review');
const Campground = require('../models/Campground');


module.exports.createReview = async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review); // as the form data passed as grouped in "review" object
    review.author = req.user._id;
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash('success', "sucessfully created the review!");
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;

    // delete the review document from the reviews collection
    await Review.findByIdAndDelete(reviewId);

    // delete the reference of the deleted review from the campground document (i.e., update the campground document)
    // it first finds the campground document where _id=id then from the reviews array of that document remove those embedded documents having reviewId as an eleemnt.
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    req.flash('success', "Successfully deleted the review!");
    res.redirect(`/campgrounds/${id}`);
};
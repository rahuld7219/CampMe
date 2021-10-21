/* ___________________________________________HELPER MIDDLEWARES_____________________________________________ */


const Campground = require('./models/Campground');
const Review = require('./models/Review');
const ExpressError = require('./utils/expressError');
const { campgroundSchema, reviewSchema } = require('./schemas');


// middleware to validate the campground data
module.exports.validateCampground = (req, res, next) => {
    // validating the req.body data using the joi schema
    const { error } = campgroundSchema.validate(req.body);

    // throwing error in express if there is data validation error
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

// middleware to validate the review data
module.exports.validateReview = (req, res, next) => {
    // validating the req.body data using the joi schema
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
};

// to check if a user logged in
// we use isAuthenticated() method provided by passport in req object,
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) { // if user not logged in
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
};

// middleware to check for Authorization to modify a campground
module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground.author.equals(req.user._id)) {
        req.flash('error', "You are not authorized to do that!");
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
};

// middleware to check for Authorization to modify a review
module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    // if current logged in user is the author of the review he/she wants too modify, (req.user added by passport)
    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'You are not authorized to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
};
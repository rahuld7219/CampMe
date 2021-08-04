/* ___________________________________________HELPER MIDDLEWARES_____________________________________________ */


const Campground = require('./models/campground');
const Review = require('./models/review');
const ExpressError = require('./utils/expressError');
const { campgroundSchema, reviewSchema } = require('./schemas');


// middleware to validate the campground data
module.exports.validateCampground = (req, res, next) => {
    // validating the req.body data using the joi schema
    // joi schema have provided validate() method (it is not the validate() method in the joi extension)
    // validate returns an object with value and error (iff there is error) fields
    // eg: { value: { birth_year: 1994 }, error: '"username" is required' }
    const { error } = campgroundSchema.validate(req.body);

    // throwing error in express if there is data validation error
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next(); // call next apllication middleware
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

// to check if a user logged in (i.e.,  to check if the request is authenticated or not )
// we use isAuthenticated() method provided by passport in req object,
// which eventually uses the static authenticate() method provided by passport-local-mangoose to the user schema,
// as we have specified to use it in our app.js file as `passport.use(new LocalStrategy(User.authenticate()));`
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
    // if current logged in user is the author of the review he/she wants too modify, req.user added by passport
    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'You are not authorized to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
};
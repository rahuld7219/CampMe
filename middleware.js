/* ______________________________________________________HELPER MIDDLEWARES___________________________________________________ */


const Campground = require('./models/campground');
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
// we use isAuthenticated() method provided by passport in req object
module.exports.isLoggedIn = (req, res, next) => {       // must require using destructuring like { isLoggedIn } otherwise get error, as it is added as a property to exports object
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
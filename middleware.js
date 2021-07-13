// to check if a user logged in (i.e.,  to check if the request is authenticated or not )
// we use isAuthenticated() method provided by passport in req object
module.exports.isLoggedIn = (req, res, next) => {       // must require using destructuring like { isLoggedIn } otherwise get error, as it is added as a property to exports object
    if (!req.isAuthenticated()) {
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}
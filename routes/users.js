const express = require('express');
const passport = require('passport');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');


const router = express.Router();

// serve registration form
router.get('/register', (req, res) => {
    res.render('users/register');
})

// Register a user
router.post('/register', catchAsync(async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = new User({ username, email});
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, (err) => { // to establish a login session
            if(err) return next(err);
            req.flash('success', 'Welcome to Yelp Camp!');
            res.redirect('/campgrounds');
        });
    } catch (err) { // to flash any error message like if a username already registered
        req.flash('error', err.message);
        res.redirect('/register');
    }
}));

// serve login form
router.get('/login', (req, res) => {
    res.render('users/login');
});

// authenticate(login) a user, using passport.authenticate() middleware
router.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => { // on success passport.authenticate() calls next() by default
    req.flash('success', 'Welcome Back!');
    const redirectTo = req.session.returnTo || '/campgrounds';
    // delete req.session.returnTo;
    res.redirect(redirectTo);
});

// logout a user
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'Goodbye!');
    res.redirect('/campgrounds');
});


module.exports = router;
const express = require('express');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();


router.get('/register', (req, res) => {
    res.render('users/register');
})

// Register a user
router.post('/register', catchAsync(async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = new User({ username, email});
        const registeredUser = await User.register(user, password);
        req.flash('success', 'Welcome to Yelp Camp!');
        res.redirect('campgrounds');
    } catch (err) { // to flash errors like if a username already registered
        req.flash('error', err.message);
        res.redirect('/register');
    }
}));


module.exports = router;
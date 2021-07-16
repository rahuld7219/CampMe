const express = require('express');
const passport = require('passport');
const catchAsync = require('../utils/catchAsync');
const users = require('../controllers/users')


const router = express.Router();

router.route('/register')
    // serve registration form
    .get(users.renderRegister)
    // Register a user
    .post(catchAsync(users.register));

router.route('/login')
    // serve login form
    .get(users.renderLogin)
    // authenticate(login) a user, using passport.authenticate() middleware
    .post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), users.login);
    /* on success passport.authenticate() calls next() by default */

// logout a user
router.get('/logout', users.logout);


module.exports = router;
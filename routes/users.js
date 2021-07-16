const express = require('express');
const passport = require('passport');
const catchAsync = require('../utils/catchAsync');
const users = require('../controllers/users')


const router = express.Router();

// serve registration form
router.get('/register', users.renderRegister);

// Register a user
router.post('/register', catchAsync(users.register));

// serve login form
router.get('/login', users.renderLogin);

// authenticate(login) a user, using passport.authenticate() middleware
router.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), users.login); // on success passport.authenticate() calls next() by default

// logout a user
router.get('/logout', users.logout);


module.exports = router;
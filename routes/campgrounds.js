const express = require('express');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware');
const campgrounds = require('../controllers/campgrounds');

// creating a router object
const router = express.Router();

// index route, to list all campgrounds
router.get('/', catchAsync(campgrounds.index));

// new route, to serve a form for creating a campground
router.get('/new', isLoggedIn, campgrounds.renderNewForm);

// Create route, to handle the submitted form data by adding it to the campgrounds collection in database (new->create)
router.post('/', isLoggedIn, validateCampground, catchAsync(campgrounds.createCampground));

// show route, to show details of a particular campground
// it should be below new route otherwise new taken as :id
router.get('/:id', catchAsync(campgrounds.showCampground));

// edit route, to serve the form to edit a particular campground
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm));

// update route, to update the campground submitted by edit form  (edit->update)
router.put('/:id', isLoggedIn, isAuthor, validateCampground, catchAsync(campgrounds.updateCampground));

// destroy route, to delete a particular campground
router.delete('/:id', isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

module.exports = router;
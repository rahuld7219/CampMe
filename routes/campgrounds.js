const express = require('express');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware');
const campgrounds = require('../controllers/campgrounds');

// creating a router object
const router = express.Router();

router.route('/')
    // index route, to list all campgrounds
    .get(catchAsync(campgrounds.index))
    // Create route, to handle the submitted form data by adding it to the campgrounds collection in database (new->create)
    .post(isLoggedIn, validateCampground, catchAsync(campgrounds.createCampground));

// new route, to serve a form for creating a campground
router.get('/new', isLoggedIn, campgrounds.renderNewForm);

// edit route, to serve the form to edit a particular campground
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm));

router.route('/:id')
    // show route, to show details of a particular campground
    // it should be below new route otherwise new taken as :id
    .get(catchAsync(campgrounds.showCampground))
    // update route, to update the campground submitted by edit form  (edit->update)
    .put(isLoggedIn, isAuthor, validateCampground, catchAsync(campgrounds.updateCampground))
    // destroy route, to delete a particular campground
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

module.exports = router;
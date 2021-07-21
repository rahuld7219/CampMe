const express = require('express');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware');
const campgrounds = require('../controllers/campgrounds');
const { storage } = require('../cloudinary') // if no file specified, node automatically look and import index.js file from a folder
const multer = require('multer'); // multer package to parse received data from the form having enctype=multipart/form-data

const upload = multer({ storage }); // {storage:storage} set storage to configured cloudinary storage

// creating a router object
const router = express.Router();

router.route('/')
    // index route, to list all campgrounds
    .get(catchAsync(campgrounds.index))
    // Create route, to handle the submitted form data by adding it to the campgrounds collection in database (new->create)
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground)); // upload.array is a multer middleware to parse multipart form data

// new route, to serve a form for creating a campground
router.get('/new', isLoggedIn, campgrounds.renderNewForm);

// edit route, to serve the form to edit a particular campground
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm));

router.route('/:id')
    // show route, to show details of a particular campground
    // it should be below new route otherwise new taken as :id
    .get(catchAsync(campgrounds.showCampground))
    // update route, to update the campground submitted by edit form  (edit->update)
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground))
    // destroy route, to delete a particular campground
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

module.exports = router;
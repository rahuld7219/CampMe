const express = require('express');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware');
const campgrounds = require('../controllers/campgrounds');

const { storage } = require('../cloudinary')
// multer package to parse received data from the form having enctype=multipart/form-data
// it adds the uploaded file/files in req.file/req.files
const multer = require('multer');

const upload = multer({ storage }); // set storage to configured cloudinary storage

const router = express.Router();

router.route('/')
    // index route, to list all campgrounds
    .get(catchAsync(campgrounds.index))
    // Create route, to create a campground (new->create)
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground));
    // upload.array() is a multer middleware to parse multipart form data
    // `image` is the name attribute's value in the file input of the form
    // use upload.array(fileInputfieldname[, maxCount]) to error out if more than maxCount files are uploaded.
    // when the multer middleware upload.single()/upload.array() called, the received image files from the client
    // will be uploaded to the Cloudinary according to the Cloudinary configuration and
    // then req.file/req.files and req.body will be created, with the `filename`, `path` and `size` properties
    // of req.file/req.files mapped from the Cloudinary API

// new route, to serve a form for creating a campground
router.get('/new', isLoggedIn, campgrounds.renderNewForm);

// edit route, to serve the form to edit a particular campground
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm));

router.route('/:id')
    // show route, to show details of a particular campground
    .get(catchAsync(campgrounds.showCampground))
    // update route, to update the campground submitted by edit form (edit->update)
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground))
    // destroy route, to delete a particular campground
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

module.exports = router;
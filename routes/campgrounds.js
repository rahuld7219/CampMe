const express = require('express');
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/expressError');
const Campground = require('../models/campground');
const { campgroundSchema } = require('../schemas');

// creating a router object
const router = express.Router();

// middleware to validate the campground data
const validateCampground = (req, res, next) => {
    // validating the req.body data using the joi schema
    const { error } = campgroundSchema.validate(req.body);

    // throwing error in express if there is data validation error
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next(); // call next apllication middleware
    }
}

// index route, to list all campgrounds
router.get('/', catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds });
}));

// new route, to serve a form for creating a campground
router.get('/new', (req, res) =>{
    res.render('campgrounds/new');
});

// Create route, to handle the submitted form data by adding it to the campgrounds collection in database (new->create)
router.post('/', validateCampground, catchAsync(async (req, res, next) => {
    // if (!req.body.campground) throw new ExpressError("Inavlid Campground data", 400);

    const campground = new Campground(req.body.campground);
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
}));

// show route, to show details of a particular campground
// it should be below new route otherwise new taken as :id
router.get('/:id', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate('reviews');
    res.render('campgrounds/show', { campground });
}));

// edit route, to serve the form to edit a particular campground
router.get('/:id/edit', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    res.render('campgrounds/edit', { campground });
}));

// update route, to update the campground submitted by edit form  (edit->update)
router.put('/:id', validateCampground, catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    res.redirect(`/campgrounds/${campground._id}`);
}));

// destroy route, to delete a particular campground
router.delete('/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    
    await Campground.findByIdAndDelete(id);
    // after deleting, our mongoose middleware findOneAndDelete(a query middleware) for the campgroundSchema runs passing the deleted campground document as the parameter to its callback

    res.redirect('/campgrounds');
}));

module.exports = router;
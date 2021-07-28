const Campground = require('../models/campground');
const { cloudinary } = require('../cloudinary'); // node automatically imports index.js from a folder
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding'); // import geocoding.js, 


const mapboxToken = process.env.MAPBOX_TOKEN;

// instantiating/initializing a new mapbox geocoding instance (create a geocoding client)
// geocoder exposes forwardGeocode() and reverseGeocode()
const geocoder = mbxGeocoding({ accessToken: mapboxToken });

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds });
};

module.exports.renderNewForm = (req, res) =>{
    res.render('campgrounds/new');
};

module.exports.createCampground = async (req, res, next) => {

    // forward-geocoding the location
    const geoData = await geocoder.forwardGeocode({ // create a MapiRequest object
        query: req.body.campground.location, // give location string
        limit: 1 //  Limit the number of results returned. (optional, default 5)
    })
    .send(); // send MapiRequest object, geoData stores MapiResponse or MapiError object

    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry; // adding geospatial data of the location
    campground.images = req.files.map( f => ({ url: f.path, filename: f.filename }) ); // add images to the campground
    campground.author = req.user._id;
    await campground.save();
    req.flash('success', "Successfully made a new campground!"); // set a flash message
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.showCampground = async (req, res) => {
    const campground = await Campground.findById(req.params.id)
        .populate({
        path: 'reviews', // populate reviews array of the campground
        populate: { path: 'author' } // populate author field for each review of the campground
        })
        .populate('author'); // populate author field of the campground

        /* above we populated with every fields of the models but
         if data is big then only populate with required fields, like only with username...
        */

    if (!campground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground });
};

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground });
};

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
    const { deleteImages } = req.body;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    if (deleteImages) { // if there is an array of images to delete
        for (let filename of deleteImages) {
            await cloudinary.uploader.destroy(filename); // delete images from the cloudinary
        }
        // delete images, which has the 'filename' in 'deleteImages' array, from the 'images' array of the current campground, from the mongo database
        await campground.updateOne({ $pull: { images: { filename: { $in: deleteImages }}}});
    }
    const images = req.files.map( f => ({ url: f.path, filename: f.filename}) );
    campground.images.push(...images); // add images to the campground
    await campground.save();
    req.flash('success', "Successfully updated the campground!");
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    // after deleting, our mongoose middleware findOneAndDelete(a query middleware) for the campgroundSchema runs passing the deleted campground document as the parameter to its callback
    req.flash('success', "Successfully deleted the campground!");
    res.redirect('/campgrounds');
};
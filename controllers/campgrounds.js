const Campground = require('../models/campground');


module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds });
};

module.exports.renderNewForm = (req, res) =>{
    res.render('campgrounds/new');
};

module.exports.createCampground = async (req, res, next) => {
    // if (!req.body.campground) throw new ExpressError("Inavlid Campground data", 400);

    const campground = new Campground(req.body.campground);
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
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
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
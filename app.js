const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Campground = require('./models/campground');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.engine('ejs', ejsMate); // tells to use ejs-mate engine for all ejs templates
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useFindAndModify:false,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Database connection error:")); // we could instead use .then() .catch() after mongoose.connect()
db.once("open", () => {
    console.log("Database connected!!");
});

app.get('/', (req, res) => {
    res.render('home');
});

// index route, to list all campgrounds
app.get('/campgrounds', async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds });
});

// new route, to serve a form for creating a campground
app.get('/campgrounds/new', (req, res) =>{
    res.render('campgrounds/new');
});

// Create route, to handle the submitted form data by adding it to the campgrounds collection in database
app.post('/campgrounds', async (req, res) =>{
    const campground = new Campground(req.body.campground);
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
});

// show route, to show details of a particular campground
// it should be below new route otherwise new taken as :id
app.get('/campgrounds/:id', async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    res.render('campgrounds/show', { campground });
});

// edit route, to serve the form to edit a particular campground
app.get('/campgrounds/:id/edit', async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    res.render('campgrounds/edit', { campground });
});

// update route, to update the campground submitted by edit form
app.put('/campgrounds/:id', async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    res.redirect(`/campgrounds/${campground._id}`);
});

// destroy route, to delete a particular campground
app.delete('/campgrounds/:id', async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
});

app.listen(8080, () => {
    console.log("SERVING ON PORT 8080!!!");
});
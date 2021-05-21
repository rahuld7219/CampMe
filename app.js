const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Campground = require('./models/campground');
const { urlencoded } = require('express');

const app = express();

app.use(express.urlencoded({ extended: true }));

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

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

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
    console.log(req.body);
    const campground = new Campground(req.body.campground);
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
});

// show route, to show details of a particular campground
app.get('/campgrounds/:id', async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    res.render('campgrounds/show', { campground });
});

app.listen(8080, () => {
    console.log("SERVING ON PORT 8080!!!");
});
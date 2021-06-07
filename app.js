const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Campground = require('./models/campground');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/expressError');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');

const app = express();

app.use(express.urlencoded({ extended: true })); // using body-parsing middleware, to tell express how to parse the received POST/PUT,etc data(payload) to JS object, to that in req.body
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
app.get('/campgrounds', catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds });
}));

// new route, to serve a form for creating a campground
app.get('/campgrounds/new', (req, res) =>{
    res.render('campgrounds/new');
});

// Create route, to handle the submitted form data by adding it to the campgrounds collection in database (new->create)
app.post('/campgrounds', catchAsync(async (req, res, next) => {
    // below line throw error if campground object(from new.ejs) is undefined, catched by catchAsync to pass it to next to handle.
    // needed, if client side form validation not run, in case of request made from somewhere else like from Postman or Ajax requests.
    if (!req.body.campground) throw new ExpressError("Inavlid Campground data", 400); 
    const campground = new Campground(req.body.campground); // it still gives a different error if campground is not an object, can get by requesting by Postman->body->x-www-form-urlencoded->key=campground, value="Rahul" (a string not an object)
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
}));

// show route, to show details of a particular campground
// it should be below new route otherwise new taken as :id
app.get('/campgrounds/:id', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    res.render('campgrounds/show', { campground });
}));

// edit route, to serve the form to edit a particular campground
app.get('/campgrounds/:id/edit', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    res.render('campgrounds/edit', { campground });
}));

// update route, to update the campground submitted by edit form  (edit->update)
app.put('/campgrounds/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    res.redirect(`/campgrounds/${campground._id}`);
}));

// destroy route, to delete a particular campground
app.delete('/campgrounds/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
}));

// To throw an Error if request path is unknown, this should be below all the above routes
app.all('*', (req, res, next) => {                  // * means any path
    next(new ExpressError("Page Not Found!", 404));
});

// generic Error Handler
app.use((err, req, res, next) => {
    const { message = "Something Went Wrong!", statusCode = 400 } = err;
    res.status(statusCode).send(message);
});

app.listen(8080, () => {
    console.log("SERVING ON PORT 8080!!!");
});
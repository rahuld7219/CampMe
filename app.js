const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/expressError');
const campgrounds = require('./routes/campgrounds');
const reviews = require('./routes/reviews');
const session = require('express-session');

const app = express();

app.use(express.urlencoded({ extended: true })); // using body-parsing middleware, to tell express how to parse the received POST/PUT,etc data(payload) to JS object, to that in req.body
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public'))); // to serve static files like javascripts, css, audio, images, logo, etc.

app.engine('ejs', ejsMate); // tells to use ejs-mate engine for all ejs templates
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useFindAndModify:false,
    useNewUrlParser: true,
    useUnifiedTopology: true
});
// .then(() => {
//     console.log("MONGO CONNECTION OPEN!!!")
// })
// .catch(err => {
//     console.log("OH NO MONGO CONNECTION ERROR!!!!")
//     console.log(err)
// })

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Database connection error:")); // we could instead use .then() .catch() after mongoose.connect()
db.once("open", () => {
    console.log("Database connected!!");
});

// setting options object to setup a session
const sessionConfig = {
    secret: "this_should_be_a_better_secret_key!", // setting a secret key to sign the session id cookie
    resave: false,
    saveUninitialized: true,
    // setup some parameters for session id cookie sent
    cookie: {
        httpOnly: true, //  helps mitigate the risk of client side script accessing the protected cookie, it is also by default true even if we don't specify
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // expiration date for cookie in ms, counted from when sent
        maxAge: 7 * 24 * 60 * 60 * 1000 // time duration for the cookie before expiring
    }
}

// mounting/executing session middleware
app.use(session(sessionConfig));

app.get('/', (req, res) => {
    res.render('home');
});

// mounting routes like middlewares
app.use('/campgrounds', campgrounds); // every campgrounds routes path will be prefixed with /campgrounds
app.use('/campgrounds/:id/reviews', reviews); // must set { mergeParams: true } in express.Router() of reviews router to access id param


// To throw an Error if request path is unknown, this should be below all the above routes
app.all('*', (req, res, next) => {                  // * means any path
    next(new ExpressError("Page Not Found!", 404));
});

// generic Error Handler
app.use((err, req, res, next) => {
    const { statusCode = 400 } = err;
    if (!err.message) err.message = "Ohh No, Something went wrong!";
    res.status(statusCode).render('error', { err });
});

app.listen(8080, () => {
    console.log("SERVING ON PORT 8080!!!");
});
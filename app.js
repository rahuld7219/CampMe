// require and configure dotenv package in development mode,
// to use environment variables defined in .env file.
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');

// an inbuilt node module, provides utilities for working with file and directory paths
const path = require('path');
const mongoose = require('mongoose');

// HTML forms only support GET or POST requests, so to support PUT, PATCH, etc,
// we use method-override npm package,
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate'); // for the layout for ejs
const session = require('express-session'); // to implement session
const MongoStore = require('connect-mongo'); // To store session data in mongo database
const flash = require('connect-flash'); // for flash messages
const mongoSanitize = require('express-mongo-sanitize'); // To prevent from some mongo injection attacks

// To set various http headers in order to provide security to our app from some attacks
// (helps mitigate some XSS attacks, among other things)
const helmet = require('helmet');
const ExpressError = require('./utils/expressError');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const passport = require('passport'); // an authentication middleware for Node.
const LocalStrategy = require('passport-local'); // to authenticate using a username and password
const User = require('./models/user');

const app = express();

// using all 11 default middlewares of helmet
app.use(helmet());

// allowed javascripts sources
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
// allowed stylesheets sources
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net"
];
// allowed sources that you can connect to (via XHR, etc.)
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
// allowed font sources
const fontSrcUrls = [];

// To allow/restrict the domains/sources from which the content of certain types can be loaded on a webpage/website,
// contentSecurityPolicy(CSP) configurations using Helmet
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dkrwyznvg/", //SHOULD MATCH CLOUDINARY ACCOUNT NAME!
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

// parses the default form data
// using a body-parsing middleware, to tell express how to parse the received data(payload) to JS object.
// it adds a body object populated with the data in the request object(i.e., req.body)
// (urlencoded data means normal default form data
// i.e., data of form having enctype of application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// override with POST having ?_method=DELETE
app.use(methodOverride('_method'));

// to serve static files like javascripts, css, audio, images, logo, etc.,
// only the contents inside the static asset folder(here 'public') are served, not the public folder itself,
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize()); //remove the keys containing '$' or '.' from req.body, req.query or req.params

app.engine('ejs', ejsMate); // tells to use ejs-mate engine for all ejs templates(used for boilerplate layout)

// specify the template/views folder path w.r.t path of current file, 
// __dirname represents the path of current file, path.join() joins all given path 
app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'ejs'); // tell the express to use the EJS as templating/view engine

// use production cloud database(if specified), otherwie local development database
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/campdb';
mongoose.connect(dbUrl, {
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
})
    .then(() => {
        console.log("MONGO CONNECTION OPEN!!!")
    })
    .catch(err => {
        console.log("OH NO MONGO CONNECTION ERROR!!!!")
        console.log(err)
    })

const mongoStoreSecret = process.env.MONGO_STORE_SECRET || "not_a_good_secret_key!";
const sessionSignSecret = process.env.SESSION_SIGN_SECRET || "this_should_be_a_better_secret_key!";

// configuring mongodb store
const store = MongoStore.create({
    mongoUrl: dbUrl,

    // in sec, update the session once in every 24hrs, does not matter how many request's are made
    // (with the exception of those that change something on the session data)
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: mongoStoreSecret // for encryption/decryption of session data
    }
});

store.on("error", function (err) {
    console.log("SESSION STORE ERROR!", err);
});

// setting options object to setup a session
const sessionConfig = {

    // specfying where to store the session
    store,

    // change the session cookie name (the default name is connect.sid),
    name: 'si',

    secret: sessionSignSecret, // setting a secret key to sign the session id cookie
    resave: false, //don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored

    // setup some parameters for session id cookie
    cookie: {

        // specify that session cookies will only be accessible over http,
        // this helps mitigate the risk of client side script accessing the protected cookie using document.cookie,
        httpOnly: true,

        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // expiration date for cookie in ms, counted from when sent
        maxAge: 7 * 24 * 60 * 60 * 1000 // time duration for the cookie before expiring
    }
};

// In production mode
if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy, so that secure option works correctly in production on heroku, etc
    sessionConfig.cookie.secure = true // serve secure cookies(i.e., over HTTPS only)
}

// mounting/executing session middleware(provides req.session to store and access session)
// also required for flash messages and session implemented by passport
app.use(session(sessionConfig));

app.use(flash());

// initialize Passport (i.e., assigns _passport object to request object and do other stuffs)
app.use(passport.initialize());

// for persistent login
app.use(passport.session());

// tell to use static authenticate() method (provided by passport-local-mongoose)
passport.use(new LocalStrategy(User.authenticate()));

// specify how to add a user info to the session using static serializeUser() method of User model
// (provided by passport-local-mongoose)
passport.serializeUser(User.serializeUser());

// specify how to retrive a user info from the session using static deserializeUser() method of User model
// (provided by passport-local-mongoose)
passport.deserializeUser(User.deserializeUser());


// adds some extra data in the session which would be needed for various features
app.use((req, res, next) => {
    // To remember the path from which the request is coming
    // used in login route to redirect the user back to previous page, after login, if not logged in before
    if (req.originalUrl !== '/login' && req.originalUrl !== '/register' && req.method === 'GET') {

        // store the full request path in returnTo variable in req.session
        req.session.returnTo = req.originalUrl;
    }
    next();
});

// adds some data to res.locals, so that these will be available to every template
// without needing to pass these to each template separately.
app.use((req, res, next) => {
    // adding currently logged in user info(provided by passport as req.user) to res.locals
    // req.user have undefined if no user logged in currently
    res.locals.currentUser = req.user;

    res.locals.success = req.flash('success'); // adding success flash messages
    res.locals.error = req.flash('error'); // adding error flash messages
    next();
});

app.get('/', (req, res) => {
    res.render('home');
});

app.use(userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);


// To throw an Error if request path is unknown
app.all('*', (req, res, next) => {
    next(new ExpressError("Page Not Found!", 404));
});

// generic Error Handler
app.use((err, req, res, next) => {
    const { statusCode = 400 } = err;
    if (!err.message) err.message = "Ohh No, Something went wrong!";
    res.status(statusCode).render('error', { err });
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`SERVING ON PORT ${port}!!!`);
});
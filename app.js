// require and configure dotenv package in development mode
if (process.env.NODE_ENV !== "production") {
	require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const mongoSanitize = require('express-mongo-sanitize'); // To prevent from some mongo injection attacks
const helmet = require('helmet'); // To set various http headers in order to provide security to our app from some attacks(helps mitigate some XSS attacks, among other things)
const ExpressError = require('./utils/expressError');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const passport = require('passport'); // an authentication middleware for Node.
const LocalStrategy = require('passport-local'); // to authenticate using a username and password
const User = require('./models/user');

const app = express();

app.use(helmet()); // using all 11 default middlewares of helmet (remember to configure contentSecurityPolicy rules if using some third party content like CDNs, APIs, etc)

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

//contentSecurityPolicy(CSP) configurations using Helmet
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

app.use(express.urlencoded({ extended: true }));
// using a body-parsing middleware, to tell express how to parse the received urlencoded data(payload) to JS object.
// it adds a body object populated with the form data in the request object(i.e., req.body)
//(urlencoded data means normal default form data i.e., data of form having enctype of application/x-www-form-urlencoded)
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public'))); // to serve static files like javascripts, css, audio, images, logo, etc.
app.use(mongoSanitize()); //remove the keys containing '$' or '.' from req.body, req.query or req.params

app.engine('ejs', ejsMate); // tells to use ejs-mate engine for all ejs templates
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useFindAndModify:false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
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

    // change the session cookie name from the default name(connect.sid), so that any attacker just can't find it extremely easily
    name: 'session',

    secret: "this_should_be_a_better_secret_key!", // setting a secret key to sign the session id cookie
    resave: false,
    saveUninitialized: true,

    // setup some parameters for session id cookie sent
    cookie: {

        // specify that session cookies will only be accessible over http not by javascript,
        // this helps mitigate the risk of client side script accessing the protected cookie using document.cookie,
        // it is also by default true even if we don't specify
        httpOnly: true,

        // specify that session cookie only work over https,
        // by setting the secure attribute, the browser will prevent the transmission of a cookie over an unencrypted channel.
    /*  secure: true, */ // comment this when over localhost

        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // expiration date for cookie in ms, counted from when sent
        maxAge: 7 * 24 * 60 * 60 * 1000 // time duration for the cookie before expiring
    }
}

// mounting/executing session middleware
app.use(session(sessionConfig));
// mounting/executing flash middleware
app.use(flash());

app.use(passport.initialize()); // initialize Passport (i.e., assigns _passport object to request object and do other stuffs)
app.use(passport.session()); // for persistent login, be sure to use it only after session()
passport.use(new LocalStrategy(User.authenticate())); // tell to use static authenticate method (provided by passport-local-mongoose) of User model in LocalStrategy(i.e., in authentication using a username and password)
passport.serializeUser(User.serializeUser()); // specify how to add a user info to the session using static serialize method of User model (provided by passport-local-mongoose)
passport.deserializeUser(User.deserializeUser()); // specify how to retrive a user info from the session using static deserialize method of User model (provided by passport-local-mongoose)
/*
serializer adds user data into the session 
deserializer assign user data from the session to req.user(salt and password not included), so that it can be accessed when required
*/


// adds some extra data in the session which would be needed for various fetures
app.use((req, res, next) => {
    // To remember the path from which the request is coming
    // used in login route to redirect the user back to previous page, after login, if not logged in before
    if (req.originalUrl !== '/login' && req.method === 'GET') { // '/login' excluded, as if request is for '/login' then it creates a loop if redirected back to /login after logged in
        // ![ '/login', '/'].includes(req.originalUrl) ---> condition can be this also in if
        req.session.returnTo = req.originalUrl; // store the full request path in returnTo variable in req.session
    }
    next();
});

// adds some data to res.locals, so that these will be available to every template without needing to pass these to each template separately.
app.use((req, res, next) => {
    res.locals.currentUser = req.user // adding currently logged in user info(provided by passport as req.user) to res.locals 
    // req.user have undefined if no user logged in currently
    res.locals.success = req.flash('success'); // adding success flash messages
    res.locals.error = req.flash('error'); // adding error flash messages
    next();
});
/* 
can use a single variable as res.locals.messages instead of separate res.locals.success and res.locals.error,
and messages can be [{success: "it worked!", danger: "Problem!"}] and then iterate over it accordingly in flash.ejs
*/


app.get('/', (req, res) => {
    res.render('home');
});  

// mounting routes like middlewares
app.use(userRoutes); // by default the path is '/'
app.use('/campgrounds', campgroundRoutes); // every campgrounds routes path will be prefixed with /campgrounds
app.use('/campgrounds/:id/reviews', reviewRoutes); // must set { mergeParams: true } in express.Router() of reviews router to access id param


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
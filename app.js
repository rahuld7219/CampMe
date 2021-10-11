// require and configure dotenv package in development mode,
// to use environment variables defined in .env file.
// (In production, we use environment variables configured on deployed platform like Heroku, etc)
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');

// a inbuilt node module, provides utilities for working with file and directory paths
const path = require('path');
const mongoose = require('mongoose');

// HTML forms only support GET or POST requests, so to support PUT, PATCH, etc,
// we use method-override npm package,
// It Creates a new middleware function methodOverride(getter, options) to override the req.method property with a new value.
// This value will be pulled from the provided getter(we provided __method) ,
// options used to specify original method (default: ['POST']),
// use POST only(not GET) for PUT?PATCH?DELETE as these have req.body like post
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
// (remember to configure contentSecurityPolicy rules if using some third party content like CDNs, APIs, etc)
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

// To allow/restrict the domains/sources from which the content of certain types can be loaded on a webpage/website
// involves adding the Content-Security-Policy HTTP header to a web page and
// giving it values to control what resources the user(client) agent is allowed to load for that page.
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

// override with POST having ?_method=DELETE, we can give any name instead of _method
app.use(methodOverride('_method'));

// to serve static files like javascripts, css, audio, images, logo, etc.,
// specifies the root directory from which to serve static assets,
// only the contents inside the static asset folder(here 'public') are served, not the public folder itself,
// eg: to serve (say) a css file we link it in the HTML as href="/app.css" (must use /),
// you can load the files that are in the public directory as: http://localhost:3000/images/kitten.jpg
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize()); //remove the keys containing '$' or '.' from req.body, req.query or req.params

app.engine('ejs', ejsMate); // tells to use ejs-mate engine for all ejs templates(used for boilerplate layout)

// By default, express assumes the templating folder as process.cwd()+'/views',
// this creates problem if we run our app.js(server) file from a location different than our project directory
// specify the template/views folder path w.r.t path of current file,
// so that it can access templates/views from anywhere
// __dirname represents the path of current file, path.join() joins all given path 
app.set('views', path.join(__dirname, 'views')); //can give different name instead of 'views', for views folder

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

// // we could use below code instead of .then() .catch() after mongoose.connect()
// const db = mongoose.connection;
// db.on("error", console.error.bind(console, "Database connection error:"));
// db.once("open", () => {
//     console.log("Database connected!!");
// });

const mongoStoreSecret = process.env.MONGO_STORE_SECRET || "not_a_good_secret_key!";
const sessionSignSecret = process.env.SESSION_SIGN_SECRET || "this_should_be_a_better_secret_key!";

// configuring mongodb store
const store = MongoStore.create({
    // database url, can use different mongo database for the session than the application, but we used the same
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

    // specfying where to store the session (by default, store in memory store)
    store, // store session in mongodb

    // change the session cookie name from the default name(connect.sid),
    // so that any attacker just can't find it extremely easily
    name: 'si',

    secret: sessionSignSecret, // setting a secret key to sign the session id cookie
    resave: false, //don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored

    // setup some parameters for session id cookie sent
    cookie: {

        // specify that session cookies will only be accessible over http not by javascript,
        // this helps mitigate the risk of client side script accessing the protected cookie using document.cookie,
        // it is also by default true even if we don't specify
        httpOnly: true,

        // // specify that session cookie only work over https,
        // // by setting the secure attribute, the browser will prevent
        // // the transmission of a cookie over an unencrypted channel.
        // secure: true, // By default, the secure attribute is not set(i.e. false).

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
// mounting/executing flash middleware
app.use(flash());

// initialize Passport (i.e., assigns _passport object to request object and do other stuffs)
app.use(passport.initialize());

// for persistent login, be sure to use it only after session()
app.use(passport.session());

// tell to use static authenticate() method (provided by passport-local-mongoose)
// of User model in LocalStrategy(i.e., in authentication using a username and password)
passport.use(new LocalStrategy(User.authenticate()));

// specify how to add a user info to the session using static serializeUser() method of User model
// (provided by passport-local-mongoose)
passport.serializeUser(User.serializeUser());

// specify how to retrive a user info from the session using static deserializeUser() method of User model
// (provided by passport-local-mongoose)
passport.deserializeUser(User.deserializeUser());
/*
serializer adds user data into the session 
deserializer assigns user data from the session to req.user(salt and password not included), so that it can be accessed when required
*/


// adds some extra data in the session which would be needed for various fetures
app.use((req, res, next) => {
    // To remember the path from which the request is coming
    // used in login route to redirect the user back to previous page, after login, if not logged in before
    if (req.originalUrl !== '/login' && req.originalUrl !== '/register' && req.method === 'GET') {
        // '/login' excluded, as if request is for '/login'
        // then it creates a loop if redirected back to /login after logged in,
        // and user must not redirect back to /register also after it has been logged in
        // (if 1st user go to register and then go to login without registering)
        // ![ '/login', '/register', '/'].includes(req.originalUrl) ---> condition can be this also in if

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
// must set { mergeParams: true } in express.Router() of reviews router to access `id` param
app.use('/campgrounds/:id/reviews', reviewRoutes);


// To throw an Error if request path is unknown, this should be below all the above routes
// * means any path
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

// Binds and listens for connections on the specified host and port.
// If port is omitted or is 0, the operating system will assign an arbitrary unused port,
// useful for cases like automated tasks (tests, etc.).
app.listen(port, () => {
    console.log(`SERVING ON PORT ${port}!!!`);
});
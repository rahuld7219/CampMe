const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/expressError');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const passport = require('passport'); // an authentication middleware for Node.
const LocalStrategy = require('passport-local'); // to authenticate using a username and password
const User = require('./models/user');

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


app.get('/', (req, res) => {
    res.render('home');
});

// adding data to res.locals, so that these will be available to every template without needing to pass these to each template separately.
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

// hardcoded user registration demo
app.get('/registerfakeuser', async (req, res) => {
    const user = new User({email: "rd@gmail.com", username: "rd"});
    const registeredUser = await User.register(user, 'patanahi');
    res.send(registeredUser);
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
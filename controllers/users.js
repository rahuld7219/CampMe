const User = require('../models/User');


module.exports.renderRegister = (req, res) => {
    res.render('users/register');
};

module.exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = new User({ username, email});
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, (err) => { // to establish a login session
            if(err) return next(err);
            req.flash('success', 'Welcome to CampMe!');
            res.redirect('/campgrounds');
        });
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('/register');
    }
};

module.exports.renderLogin = (req, res) => {
    res.render('users/login');
};

module.exports.login = (req, res) => {
    req.flash('success', 'Welcome Back!');
    const redirectTo = req.session.returnTo || '/campgrounds';
    res.redirect(redirectTo);
};

module.exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'Goodbye!');
    res.redirect('/campgrounds');
};
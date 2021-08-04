// wrapper function to catch async errors and pass that to the next to handle it

module.exports = func => {
    // as next(err) has to be called in the middleware so we return a function which acts as middleware,
    // and in this we execute the original middleware(func) and on error in it we catch that and pass to the next
    return (req, res, next) => {
        func(req, res, next).catch(next); // catch(next) same as catch(e => next(e))
    }
};
// wrapper function to catch async errors and pass that to the next to handle it

module.exports = func => {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    }
};
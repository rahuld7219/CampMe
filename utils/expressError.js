// define our own custom error class
// define a status or statusCode property in our custom error class which Express
// will see and respond with

class ExpressError extends Error {
    constructor(message, statusCode) {
        super();
        this.message = message;
        this.statusCode = statusCode;
    }
}

module.exports = ExpressError;
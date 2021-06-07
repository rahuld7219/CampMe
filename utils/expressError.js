// owr own custom error class

class ExpressError extends Error {
    constructor(message, statusCode) {
        super(); //calls constructor of parent (i.e., Error) class
        this.message = message;
        this.statusCode = statusCode;
    }
}

module.exports = ExpressError;
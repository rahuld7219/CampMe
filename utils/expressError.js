// define our own custom error class

// the inbuilt Error Object has a messsage property,
// whose value will be the text that we pass while throwing error
// (i.e., throw new Error("this text will be the message") ) or it will be according to the error.
// the default Error object doesn't have status property inbuilt,
// so generally, we define a status or statusCode property in our custom error class which Express
// will see and respond with

class ExpressError extends Error {
    constructor(message, statusCode) {
        super(); //calls constructor of parent (i.e., Error) class
        this.message = message;
        this.statusCode = statusCode;
    }
}

module.exports = ExpressError;
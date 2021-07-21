// describe schemas for data validation using joi (it has nothing to do with express, mongoose or mongo)
// used to validate the data at server side, i.e., validate the data such as  req.body, etc. at server
const Joi = require('joi');

// Defining Joi validations for campground model(for req.body)
module.exports.campgroundSchema = Joi.object({
    campground: Joi.object({
        title: Joi.string().required(),
        price: Joi.number().required().min(0),
        // image: Joi.string().required(), // as images get in req.files due to using multer package
        location: Joi.string().required(),
        description: Joi.string()
    }).required(),
    deleteImages: Joi.array()
});

// Defining Joi validations for review model(for req.body)
module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        body: Joi.string().required(),
        rating: Joi.number().required().min(1).max(5) // the rating should be a number in [1,5]
    }).required()
});
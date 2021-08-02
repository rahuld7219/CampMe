// describe schemas for data validation using joi (it has nothing to do with express, mongoose or mongo)
// used to validate the data at server side, i.e., validate the data such as  req.body, etc. at server
const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html'); // to escape HTML tags

// defining a custom joi validator extension to validate if there is any HTML tags, so we can escape HTML tags in our input fields to prevent some common XSS attacks
const extension = (joi) => ({
    type: 'string', // type of this custom schema, it can be anything in string form
    base: joi.string(), // the base schema to extend from
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!' // error message
    },
    // validation rules
    rules: {
        // name of the extension
        escapeHTML: {
            validate(value, helpers) {
                // sanitize the value, i.e., remove HTML tags, doesn't modify the original value
                const clean = sanitizeHtml(value, {
                    allowedTags: [], // no tags allowed
                    allowedAttributes: {}, // no attributes allowed of the allowed tags
                });
                // check if the value contains any HTML tag, if contains then give error
                if (clean !== value) return helpers.error('string.escapeHTML', { value });
                return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension); // adding the custom extension to the joi

// Defining Joi validations for campground model(for req.body)
module.exports.campgroundSchema = Joi.object({
    campground: Joi.object({
        title: Joi.string().required().escapeHTML(), // invoking escapeHTML to validate
        price: Joi.number().required().min(0),
        // image: Joi.string().required(), // as images get in req.files due to using multer package
        location: Joi.string().required().escapeHTML(),
        description: Joi.string().escapeHTML()
    }).required(),
    deleteImages: Joi.array()
});

// Defining Joi validations for review model(for req.body)
module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        body: Joi.string().required().escapeHTML(),
        rating: Joi.number().required().min(1).max(5) // the rating should be a number in [1,5]
    }).required()
});
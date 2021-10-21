const mongoose = require('mongoose');
const Review = require('./Review');

const Schema = mongoose.Schema; // for shorthand, can also do as -> const { Schema } = mongoose

// we don't create model for this, we just define this outside of campgroundSchema so that we can assign
// a virtual property on it, as virtual property can only be defined on a schema
const imageSchema = new Schema({
    url: String,
    filename: String
});

// defining a virtual property(thumbnail) on imageSchema to get smaller image from cloudinary
// this property not stored in the database, but calculated from the stored url property
// of the imageSchema and returned on the go whenever on an image document we call the thumbnail
imageSchema.virtual('thumbnail').get(function () {
    // `this` refers to the document for which the virtual has been called
    return this.url.replace('/upload', '/upload/w_200,h_200');
    // https://res.cloudinary.com.../upload/v162/CampMe/river.jpg  =>
    // https://res.cloudinary.com.../upload/w_200/v162/CampMe/river.jpg
});

// to include virtuals also, whenever a document converted to JSON and to include createdAt and updatedAt fields
const opts = { toJSON: { virtuals: true }, timestamps: true };

// creates a schema for a collection(represented by Model in mongoose)
const campgroundSchema = new Schema({
    title: String,
    location: String,
    // to store geographical data of the location in geoJSON format
    geometry: {
        type: {
            type: String,
            enum: ['Point'], // as location type must be 'Point' to represent a point location on the map
            required: true
        },
        coordinates: {
            type: [Number], // it will be [longitude, latitude] in geoJSON, to store point coordinates
            required: true
        }
    },
    images: [imageSchema], // array of image documents
    price: Number,
    description: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
}, opts);

// setting a virtual on campground
// (it is used as a popup when an unclustered campgoround point clicked on the cluster map, as mapbox expect the geoJSON object with a properties field)
// In campgroundSchema it can be visualized like below
// properties: {
//                 popupMarkup: ...
//             }
campgroundSchema.virtual('properties.popupMarkup').get(function () {
    return `
    <strong><a href="/campgrounds/${this._id}">${this.title}</a>
    <p>${this.description.substring(0, 30)}...</p></strong>`;
    // this refers to the document for which the virtual has been called
});

// defines mongoose post middleware (function).
// (runs after findOneAndDelete()/findByIdAndDelete() on the campground)
// to remove reviews associated with the deleted campground.
// as below is a query middleware hence 'this' keyword refers to the query here,
// if it was a document middleware then 'this' would refer the deleted campground document.
campgroundSchema.post('findOneAndDelete', async function (campground) {
    if (campground) { // if the campground was deleted
        await Review.deleteMany({ // delete reviews where review._id is in campground.reviews array
            _id: {
                $in: campground.reviews
            }
        });
    }
});

// creates a model (a model subclass) 'Campground' with the above schema
// it creates a collection named 'campgrounds' in mongodb database (but only after we save() )
module.exports = mongoose.model('Campground', campgroundSchema);
const mongoose = require('mongoose');
const Review = require('./review');

const Schema = mongoose.Schema;

// we don't create model for this, we just define this outside of campgroundSchema so that we can assign
// a virtual property on it, as virtual property can only be defined on a schema
const imageSchema = new Schema({
    url: String,
    filename: String
});

// defining a virtual property(thumbnail) on imageSchema to get smaller image from cloudinary
imageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200,h_200');
});

// to include virtuals also, whenever a document converted to JSON and to include createdAt and updatedAt fields
const opts = { toJSON: { virtuals: true }, timestamps: true };

const campgroundSchema = new Schema({
    title: String,
    location: String,
    // to store geographical data of the location in geoJSON format
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // it will be [longitude, latitude] to store point coordinates
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
// (it is used as a popup when an unclustered campground point clicked on the cluster map, as mapbox expect the geoJSON object with a properties field)
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
campgroundSchema.post('findOneAndDelete', async function (campground) {
    if (campground) { // if the campground was deleted
        await Review.deleteMany({
            _id: {
                $in: campground.reviews
            }
        });
    }
});

module.exports = mongoose.model('Campground', campgroundSchema);
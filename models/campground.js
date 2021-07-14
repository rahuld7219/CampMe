const mongoose = require('mongoose');
const Review = require('./review');

const Schema = mongoose.Schema; // for shorthand, can also do as -> const { Schema } = mongoose

const campgroundSchema = new Schema({
    title: String,
    location: String,
    image: String,
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
});

// defines mongoose post middleware (function).
// (runs after findOneAndDelete()/findByIdAndDelete() on the campground) to remove reviews associated with the deleted campground.
// as below is a query middleware hence 'this' keyword refers to the query here, if it was a document middleware then 'this' would refer the deleted campground document.
campgroundSchema.post('findOneAndDelete', async function (campground) {
    if(campground) { // if the campground was deleted
        await Review.deleteMany({ // delete reviews where review._id is in campground.reviews array
            _id: {
                 $in: campground.reviews
            }
        });
    }
});

module.exports = mongoose.model('Campground', campgroundSchema);
const mongoose = require('mongoose');

const Schema = mongoose.Schema; // for shorthand, can also do as -> const { Schema } = mongoose

const campgroundSchema = new Schema({
    title: String,
    price: Number,
    description: String,
    location: String,
    image: String
});

module.exports = mongoose.model('Campground', campgroundSchema);
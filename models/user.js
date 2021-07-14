const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true // so that no duplicate email id inserted in user model(collection)
    }
});



// below line adds a username field(to store the username) also set it to be unique,
// a hash field(to store the hashed password) and a salt field( to store the salt value)
// Additionally, it also adds some methods to our Schema.
userSchema.plugin(passportLocalMongoose);


module.exports = mongoose.model('User', userSchema);
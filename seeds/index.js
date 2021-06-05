// run this file to seed the database with some initial campgrounds

const mongoose = require('mongoose');
const Campground = require('../models/campground');
const cities = require('./cities');
const { descriptors, places } = require('./seedHelpers');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Database connection error: "));
db.once("open", () => {
    console.log("Database connected!!");
});


// returns a random element from the given array
const pickRandom = (array) => array[Math.floor(Math.random() * array.length)];

// 1st deletes the collection data then insert 50 Campground documents with random title, location, image and price
const seedDB = async () => {
    await Campground.deleteMany({});  //deletes everything in the 'campgrounds' collection
    for (let i = 0; i < 50; i++) {
        const rand1000 = Math.floor(Math.random() * 1000); // generates a random integer in [0, 999]
        const price = Math.floor(Math.random() * 30) + 20;
        const camp = new Campground({
            title: `${pickRandom(descriptors)} ${pickRandom(places)}`,
            location: `${cities[rand1000].city}, ${cities[rand1000].state}`,
            image: "https://source.unsplash.com/collection/483251",
            description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui quaerat debitis cum expedita. Repellat cum tenetur est ipsam dolores, voluptate delectus nesciunt aut architecto vitae. Molestias ut necessitatibus magnam. Dolores?",
            price
        });
        await camp.save();
    }
};

seedDB().then(() => {               // as seedDB is async function it returns promise
    mongoose.connection.close();
});
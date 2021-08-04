// run this file to seed the database with some initial campgrounds

const mongoose = require('mongoose');
const Campground = require('../models/campground');
const cities = require('./cities');
const { descriptors, places } = require('./seedHelpers');

mongoose.connect('mongodb://localhost:27017/campdb', {
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
    for (let i = 0; i < 500; i++) {
        const rand1000 = Math.floor(Math.random() * 1000); // generates a random integer in [0, 999]
        const price = Math.floor(Math.random() * 30) + 20;
        const camp = new Campground({
            author: "615ece71592c1360d499a4f2",
            title: `${pickRandom(descriptors)} ${pickRandom(places)}`,
            location: `${cities[rand1000].city}, ${cities[rand1000].state}`,
            geometry: {
                type: 'Point',
                coordinates: [ cities[rand1000].longitude, cities[rand1000].latitude ] // as our cities.js have lat-long also
            },
            description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui quaerat debitis cum expedita. Repellat cum tenetur est ipsam dolores, voluptate delectus nesciunt aut architecto vitae. Molestias ut necessitatibus magnam. Dolores?",
            price,
            images: [
                {
                    url: 'https://res.cloudinary.com/dkrwyznvg/image/upload/v1632751890/seeder/autumn_cqyggb.jpg',
                    filename: 'seeder/autumn_cqyggb'
                },
                {
                    url: 'https://res.cloudinary.com/dkrwyznvg/image/upload/v1632751889/seeder/mountains_e6mznu.jpg',
                    filename: 'seeder/mountains_e6mznu'
                }
            ]
        });
        await camp.save();
    }
};

seedDB().then(() => {               // as seedDB is async function it returns promise
    mongoose.connection.close();
});
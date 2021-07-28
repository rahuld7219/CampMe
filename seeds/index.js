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
            author: "60ee9110e5635043a4e5d159",
            title: `${pickRandom(descriptors)} ${pickRandom(places)}`,
            location: `${cities[rand1000].city}, ${cities[rand1000].state}`,
            geometry: { type: 'Point', coordinates: [ 72.8777, 19.0760, ] },
            description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui quaerat debitis cum expedita. Repellat cum tenetur est ipsam dolores, voluptate delectus nesciunt aut architecto vitae. Molestias ut necessitatibus magnam. Dolores?",
            price,
            images: [
                {
                    url: 'https://res.cloudinary.com/dkrwyznvg/image/upload/v1626849189/YelpCamp/bubbftbptpxw9gse36in.jpg',
                    filename: 'YelpCamp/bubbftbptpxw9gse36in'
                },
                {
                    url: 'https://res.cloudinary.com/dkrwyznvg/image/upload/v1626849420/YelpCamp/awqnhvhzbor9d1uhuhrd.jpg',
                    filename: 'YelpCamp/awqnhvhzbor9d1uhuhrd'
                }
            ]
        });
        await camp.save();
    }
};

seedDB().then(() => {               // as seedDB is async function it returns promise
    mongoose.connection.close();
});
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Campground = require('./models/campground');

const app = express();

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useFindAndModify:false,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Database connection error:"));
db.once("open", () => {
    console.log("Database connected!!");
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/makecampground', async (req, res) => {
    const camp = new Campground({title: "My Backyard", description: "cheap camping!"});
    await camp.save();
    res.send(camp);
});

app.listen(8080, () => {
    console.log("SERVING ON PORT 8080!!!");
});
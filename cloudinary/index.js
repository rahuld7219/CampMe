const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// configuring cloudinary API credentials
cloudinary.config({
    // right-side name can be anything according to our .env file
    // but left-side keys i.e., cloud_name, api_key and api_secret should be as it is.
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

// configuring cloudinary file storage
const storage = new CloudinaryStorage({
    cloudinary, // cloudinary configured with API credentials
    params: {
        folder: 'YelpCamp',  // folder name at cloudinary in which files will be stored
        allowedFormats: ['jpeg', 'png', 'jpg']
    }
});

module.exports = {
    cloudinary,
    storage
};
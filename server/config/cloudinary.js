const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: 'ddqojav6v',
    api_key: '161752728787321',
    api_secret: 'h6q3gIgjH97FmM988xg5gTbI9G4'
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'fic_resources',
        allowed_formats: ['jpg', 'png', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'],
        resource_type: 'auto'
    }
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };

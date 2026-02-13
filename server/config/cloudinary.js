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
    params: async (req, file) => {
        let resource_type = 'auto'; // Default to auto

        // Force 'raw' for non-image files to ensure they are downloadable and not treated as images
        if (!file.mimetype.startsWith('image/')) {
            resource_type = 'raw';
        }

        let public_id = file.originalname.split('.')[0] + '_' + Date.now();

        // For 'raw' files, we must include the extension in public_id so Cloudinary serves it with the correct extension
        if (resource_type === 'raw') {
            const ext = file.originalname.split('.').pop();
            public_id += '.' + ext;
        }

        return {
            folder: 'fic_resources',
            resource_type: resource_type,
            public_id: public_id,
        };
    },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };

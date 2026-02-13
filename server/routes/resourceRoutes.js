const express = require('express');
const Resource = require('../models/Resource');
const { auth, authorize } = require('../middleware/auth');
const { upload, cloudinary } = require('../config/cloudinary');

const router = express.Router();

// Get all resources
router.get('/', auth, async (req, res) => {
    try {
        let query = {};
        // If user belongs to a specific client (Bank Support or Candidate), show Global + Client specific resources
        if (req.user.clientId) {
            query = {
                $or: [
                    { clientId: req.user.clientId }, // Specific to their bank
                    { clientId: null }, // Global resources
                    { clientId: { $exists: false } } // Legacy global resources
                ]
            };
        }
        // Admin and Support FIC see all resources by default

        const resources = await Resource.find(query).sort({ createdAt: -1 }).populate('postedBy', 'name');

        // Generate Signed URLs for secure access (bypassing strict PDF security)
        const resourcesWithSignedUrls = resources.map(r => {
            const resourceObj = r.toObject();
            if (resourceObj.publicId) {
                // Determine resource type based on fileUrl or default to image
                // If fileUrl contains '/raw/', it's raw.
                // Or we can check extension if available in originalName, but URL path is safer.
                const isRaw = resourceObj.fileUrl && resourceObj.fileUrl.includes('/raw/');

                // Generate Signed URL
                resourceObj.fileUrl = cloudinary.url(resourceObj.publicId, {
                    resource_type: isRaw ? 'raw' : 'image',
                    type: 'upload',
                    sign_url: true,
                    secure: true
                });
            }
            return resourceObj;
        });

        res.send(resourcesWithSignedUrls);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Create a resource
router.post('/', auth, authorize('ADMIN', 'SUPPORT_FIC', 'CLIENT_SUPPORT'), upload.single('file'), async (req, res) => {
    try {
        const resourceData = {
            ...req.body,
            postedBy: req.user._id
        };

        if (req.file) {
            resourceData.fileUrl = req.file.path;
            resourceData.publicId = req.file.filename;
            resourceData.originalName = req.file.originalname;
            resourceData.type = 'Document'; // Force type if file exists
        }

        // If posted by Bank Support, link to their Client ID
        if (req.user.role === 'CLIENT_SUPPORT') {
            resourceData.clientId = req.user.clientId;
        }

        const resource = new Resource(resourceData);
        await resource.save();
        res.status(201).send(resource);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Delete a resource
router.delete('/:id', auth, authorize('ADMIN', 'SUPPORT_FIC', 'CLIENT_SUPPORT'), async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) return res.status(404).send();

        // Check permission: Client Support can only delete their own bank's resources
        if (req.user.role === 'CLIENT_SUPPORT') {
            if (!resource.clientId || resource.clientId.toString() !== req.user.clientId.toString()) {
                return res.status(403).json({ error: 'Unauthorized to delete this resource' });
            }
        }

        if (resource.publicId) {
            await cloudinary.uploader.destroy(resource.publicId);
        }

        await Resource.findByIdAndDelete(req.params.id);
        res.send(resource);
    } catch (e) {
        res.status(500).send(e);
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { uploadExternalImageToCloudinary } = require('../controllers/imageProxyController');

// POST /api/images/proxy - Upload external image to Cloudinary
router.post('/proxy', uploadExternalImageToCloudinary);

module.exports = router;


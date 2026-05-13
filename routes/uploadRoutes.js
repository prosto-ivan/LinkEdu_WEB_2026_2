const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Дозволені тільки файли JPG, PNG або PDF'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024
    }
});

router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            message: 'Файл не було завантажено'
        });
    }

    return res.json({
        message: 'Файл успішно завантажено',
        file: {
            originalName: req.file.originalname,
            fileName: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype
        }
    });
});

router.post('/upload-multiple', upload.array('files', 5), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            message: 'Файли не було завантажено'
        });
    }

    return res.json({
        message: 'Файли успішно завантажено',
        files: req.files.map(file => ({
            originalName: file.originalname,
            fileName: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
        }))
    });
});

module.exports = router;
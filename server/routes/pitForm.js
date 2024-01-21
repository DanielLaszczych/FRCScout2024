const express = require('express');
const router = express.Router();
const PitForm = require('../models/PitForm');
const cloudinary = require('cloudinary').v2;

router.get('/getPitForm', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    try {
        const pitForm = await PitForm.findOne(JSON.parse(req.headers.filters)).exec();
        res.status(200).json(pitForm);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

router.post('/postPitForm', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    try {
        let pitFormInput = req.body;
        let imageUrl;
        if (req.headers.imagetype === 'Same Image') {
            imageUrl = pitFormInput.image;
        } else {
            await cloudinary.uploader.upload(pitFormInput.image, (error, result) => {
                if (error) {
                    throw new Error('Could not upload image');
                }
                imageUrl = result.secure_url;
            });
        }
        pitFormInput.image = imageUrl;
        pitFormInput.scouter = req.user.displayName;

        await PitForm.findOneAndUpdate({ eventKey: pitFormInput.eventKey, teamNumber: pitFormInput.teamNumber }, pitFormInput, { new: true, upsert: true }).exec();
        res.sendStatus(200);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

module.exports = router;

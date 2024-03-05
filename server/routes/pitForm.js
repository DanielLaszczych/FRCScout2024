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
        const pitForm = await PitForm.findOne(JSON.parse(req.headers.filters || '{}')).exec();
        res.status(200).json(pitForm);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

router.get('/getPitFormsSimple', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    try {
        const pitForms = await PitForm.find(JSON.parse(req.headers.filters || '{}'))
            .select(
                [
                    'eventKey',
                    'eventName',
                    'teamNumber',
                    'teamName',
                    'followUp',
                    'followUpComment',
                    'scouter',
                    'robotImage',
                    'wiringImage'
                ].join(' ')
            )
            .exec();
        res.status(200).json(pitForms);
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
        let robotImageUrl;
        if (req.headers.robotimagetype === 'Same Image') {
            robotImageUrl = pitFormInput.robotImage;
        } else {
            await cloudinary.uploader.upload(pitFormInput.robotImage, (error, result) => {
                if (error) {
                    throw new Error('Could not upload image');
                }
                robotImageUrl = result.secure_url;
            });
        }
        let wiringImageUrl;
        if (req.headers.wiringimagetype === 'Same Image') {
            wiringImageUrl = pitFormInput.wiringImage;
        } else {
            await cloudinary.uploader.upload(pitFormInput.wiringImage, (error, result) => {
                if (error) {
                    throw new Error('Could not upload image');
                }
                wiringImageUrl = result.secure_url;
            });
        }
        pitFormInput.robotImage = robotImageUrl;
        pitFormInput.wiringImage = wiringImageUrl;
        pitFormInput.scouter = req.user.displayName;
        await PitForm.findOneAndUpdate(
            { eventKey: pitFormInput.eventKey, teamNumber: pitFormInput.teamNumber },
            pitFormInput,
            { new: true, upsert: true }
        ).exec();
        res.sendStatus(200);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

module.exports = router;

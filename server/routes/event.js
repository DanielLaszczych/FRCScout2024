const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const cloudinary = require('cloudinary').v2;
const { ocrSpace } = require('ocr-space-api-wrapper');

router.get('/getEvents', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    try {
        const events = await Event.find(JSON.parse(req.headers.filters || '{}')).exec();
        res.status(200).json(events);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

router.get('/getEvent', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    try {
        const event = await Event.findOne(JSON.parse(req.headers.filters || '{}')).exec();
        res.status(200).json(event);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

router.get('/getEventsSimple', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    try {
        const events = await Event.find(JSON.parse(req.headers.filters || '{}'))
            .select(
                [
                    'key',
                    'name',
                    'currentEvent',
                    'startDate',
                    'endDate',
                    'custom',
                    'pitMapImage',
                    'pitImageOCRInfo'
                ].join(' ')
            )
            .exec();
        res.status(200).send(events);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

router.get('/getCurrentEvent', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    try {
        const event = await Event.findOne({ currentEvent: true }).exec();
        res.status(200).json(event);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

router.post('/addEvent', async (req, res) => {
    if (req.isUnauthenticated() || !req.user.admin) {
        res.sendStatus(401);
        return;
    }
    try {
        let eventInput = req.body;
        const event = await Event.findOneAndUpdate({ key: eventInput.key }, eventInput, {
            new: true,
            upsert: true
        }).exec();
        res.status(200).send(event);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

router.post('/removeEvent', async (req, res) => {
    if (req.isUnauthenticated() || !req.user.admin) {
        res.sendStatus(401);
        return;
    }
    try {
        const event = await Event.findOneAndDelete({ key: req.headers.key }).exec();
        if (!event) {
            res.sendStatus(404);
        } else {
            res.status(200).send(event);
        }
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

router.post('/setCurrentEvent', async (req, res) => {
    if (req.isUnauthenticated() || !req.user.admin) {
        res.sendStatus(401);
        return;
    }
    try {
        let key = req.headers.key;
        const prevEvent = await Event.findOne({ currentEvent: true }).exec();
        if (prevEvent) {
            if (prevEvent.key === key) {
                res.status(200).send(prevEvent);
                return;
            } else {
                prevEvent.currentEvent = false;
                await prevEvent.save();
            }
        }

        if (key === 'None') {
            res.status(200).json(null);
            return;
        }

        const newEvent = await Event.findOne({ key: key }).exec();
        if (!newEvent) {
            res.sendStatus(404);
        } else {
            newEvent.currentEvent = true;
            await newEvent.save();
            res.status(200).send(newEvent);
        }
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

router.post('/setEventPitMap', async (req, res) => {
    if (req.isUnauthenticated() || !req.user.admin) {
        res.sendStatus(401);
        return;
    }
    try {
        const event = await Event.findOne({ key: req.headers.key }).exec();
        if (!event) {
            throw new Error('This event is not registered inside the databse');
        } else {
            let imageUrl = '';
            await cloudinary.uploader.upload(req.body.image, (error, result) => {
                if (error) {
                    throw new Error('Could not upload image');
                }
                imageUrl = result.secure_url;
            });

            if (imageUrl !== '') {
                event.pitMapImage = imageUrl;

                let ocrInfo = await ocrSpace(imageUrl, {
                    isOverlayRequired: true,
                    detectOrientation: true,
                    scale: true,
                    OCREngine: 2
                });

                let pitImageOCRInfo = [];
                for (let info of ocrInfo.ParsedResults[0].TextOverlay.Lines) {
                    for (let wordInfo of info.Words) {
                        if (!isNaN(wordInfo.WordText)) {
                            pitImageOCRInfo.push({
                                teamNumber: parseInt(wordInfo.WordText),
                                left: wordInfo.Left,
                                top: wordInfo.Top,
                                height: wordInfo.Height,
                                width: wordInfo.Width
                            });
                        }
                    }
                }
                event.pitImageOCRInfo = pitImageOCRInfo;
            }
            await event.save();
            res.status(200).send(event);
        }
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

module.exports = router;

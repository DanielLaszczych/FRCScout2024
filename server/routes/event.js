const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

router.get('/getCurrentEvent', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    try {
        const event = await Event.findOne({ currentEvent: true }).exec();
        res.status(200).json(event);
    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;

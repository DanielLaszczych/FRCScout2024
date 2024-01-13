const express = require('express');
const router = express.Router();
const MatchForm = require('../models/MatchForm');

router.get('/getStandForm', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.send('Not signed in');
        return;
    }
    try {
        const matchForm = await MatchForm.findOne(JSON.parse(req.headers.filters)).exec();
        res.status(200).send(matchForm);
    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;

const express = require('express');
const PickList = require('../util/pickList');
const router = express.Router();

router.use('/getPickList', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.send('Not signed in');
        return;
    }
    res.send({ pickList: PickList.pickList, teams: PickList.teams, name: PickList.eventName, key: PickList.eventKey });
});

router.use('/moveTeam/:team/:container/:index/:socketId', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.send('Not signed in');
        return;
    } else if (!req.user.admin) {
        res.send('Not an admin');
        return;
    }
    let team = req.params.team;
    let container = req.params.container;
    let index = req.params.index;
    let socketId = req.params.socketId;

    PickList.moveQueue(team, container, index, socketId, req.app.get('socketio'));
    res.sendStatus(200);
});

router.use('/selectTeam/:team/:socketId', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.send('Not signed in');
        return;
    } else if (!req.user.admin) {
        res.send('Not an admin');
        return;
    }
    let team = req.params.team;
    let socketId = req.params.socketId;
    if (PickList.teams.includes(team)) {
        PickList.selectQueue(team, socketId, req.app.get('socketio'));
    }
    res.sendStatus(200);
});

module.exports = router;

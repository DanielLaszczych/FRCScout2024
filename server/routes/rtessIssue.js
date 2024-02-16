const express = require('express');
const router = express.Router();
const RTESSIssue = require('../models/RTESSIssue');
const { weekday, rtessIssuesStatus, timeZone } = require('../util/helperConstants');
const { internalBlueCall, isFutureAlly } = require('./blueAlliance');
const { internalSendMessage } = require('./groupMeBot');
const { convertMatchKeyToString } = require('../util/helperFunctions');

router.get('/getRTESSIssues', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    try {
        const rtessIssues = await RTESSIssue.find(JSON.parse(req.headers.filters || '{}')).exec();
        res.status(200).json(rtessIssues);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

router.get('/getRTESSIssue', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    try {
        const rtessIssue = await RTESSIssue.findOne(JSON.parse(req.headers.filters || '{}')).exec();
        res.status(200).json(rtessIssue);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

router.post('/postRTESSIssue', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    try {
        let rtessIssueInput = req.body;
        rtessIssueInput.submitter = req.user.displayName;
        if (rtessIssueInput.status === rtessIssuesStatus.resolved) {
            rtessIssueInput.rtessMember = req.user.displayName;
        }
        await RTESSIssue.create(rtessIssueInput);

        if (rtessIssueInput.status === rtessIssuesStatus.unresolved) {
            let futureMatchNumber = await isFutureAlly(
                rtessIssueInput.eventKey,
                rtessIssueInput.teamNumber,
                false,
                false
            );
            if (futureMatchNumber) {
                internalBlueCall(`/match/${rtessIssueInput.eventKey}_${futureMatchNumber}/simple`)
                    .then((data) => {
                        let time = data.time;
                        if (data.predicted_time) {
                            time = data.predicted_time;
                        }
                        let convertedTime = time
                            ? ` (${weekday[new Date(time * 1000).getDay()]} ${new Date(time * 1000).toLocaleString(
                                  'en-US',
                                  {
                                      hour: 'numeric',
                                      minute: 'numeric',
                                      hour12: true,
                                      timeZone: timeZone
                                  }
                              )})`
                            : '';
                        internalSendMessage(
                            `*SSA*\nTeam: ${rtessIssueInput.teamNumber}\nIssue: ${
                                rtessIssueInput.issue
                            }\nPlaying together in: ${convertMatchKeyToString(futureMatchNumber)}${convertedTime}`
                        );
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }
        }
        res.sendStatus(200);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

module.exports = router;

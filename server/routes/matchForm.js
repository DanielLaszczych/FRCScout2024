const express = require('express');
const router = express.Router();
const MatchForm = require('../models/MatchForm');
const { internalBlueCall, isFutureAlly } = require('./blueAlliance');
const { internalSendMessage } = require('./groupMeBot');
const { convertMatchKeyToString } = require('../util/helperFunctions');
const RTESSIssue = require('../models/RTESSIssue');
const { matchFormStatus, weekday, rtessIssuesStatus, timeZone } = require('../util/helperConstants');

router.get('/getStandForm', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    try {
        const matchForm = await MatchForm.findOne(JSON.parse(req.headers.filters)).exec();
        res.status(200).json(matchForm);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

router.post('/postStandForm', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    try {
        let matchFormInput = req.body;
        matchFormInput.standScouter = req.user.displayName;

        await MatchForm.findOneAndUpdate({ eventKey: matchFormInput.eventKey, matchNumber: matchFormInput.matchNumber, station: matchFormInput.station }, matchFormInput, {
            new: true,
            upsert: true
        }).exec();

        if (matchFormInput.loseCommunication || matchFormInput.robotBreak || matchFormInput.standStatus === matchFormStatus.noShow) {
            let futureMatchNumber = await isFutureAlly(matchFormInput.eventKey, matchFormInput.teamNumber, matchFormInput.matchNumber, false);
            let prevRTESSIssue = await RTESSIssue.findOne({ eventKey: matchFormInput.eventKey, matchNumber: matchFormInput.matchNumber, teamNumber: matchFormInput.teamNumber });

            if (futureMatchNumber || prevRTESSIssue) {
                let issues = [];
                if (matchFormInput.loseCommunication) issues.push('Lost Communication');
                if (matchFormInput.robotBreak) issues.push('Robot Broke');
                if (matchFormInput.standStatus === matchFormStatus.noShow) issues.push('No show');

                let rtessIssueInput = {
                    eventKey: matchFormInput.eventKey,
                    matchNumber: matchFormInput.matchNumber,
                    teamNumber: matchFormInput.teamNumber,
                    submitter: context.req.user.displayName,
                    issue: issues.join(', '),
                    problemComment: matchFormInput.standStatus === matchFormStatus.noShow ? matchFormInput.standStatusComment : matchFormInput.standEndComment,
                    status: rtessIssuesStatus.unresolved
                };

                if (prevRTESSIssue) {
                    rtessIssueInput.status = prevRTESSIssue.status;
                    rtessIssueInput.rtessMember = prevRTESSIssue.rtessMember;
                    rtessIssueInput.solutionComment = prevRTESSIssue.solutionComment;
                }

                await RTESSIssue.findOneAndUpdate({ eventKey: rtessIssueInput.eventKey, matchNumber: rtessIssueInput.matchNumber, teamNumber: rtessIssueInput.teamNumber }, rtessIssueInput, {
                    new: true,
                    upsert: true
                }).exec();

                //Service Squad Anncoument
                if (futureMatchNumber && !prevRTESSIssue) {
                    internalBlueCall(`/match/${rtessIssueInput.eventKey}_${futureMatchNumber}/simple`)
                        .then((data) => {
                            let time = data.time;
                            if (data.predicted_time) {
                                time = data.predicted_time;
                            }
                            let convertedTime = time
                                ? ` (${weekday[new Date(time * 1000).getDay()]} ${new Date(time * 1000).toLocaleString('en-US', {
                                      hour: 'numeric',
                                      minute: 'numeric',
                                      hour12: true,
                                      timeZone: timeZone
                                  })})`
                                : '';
                            internalSendMessage(
                                `*SSA*\nTeam: ${rtessIssueInput.teamNumber}\nIssue: ${rtessIssueInput.issue}\nPlaying together in: ${convertMatchKeyToString(futureMatchNumber)}${convertedTime}`
                            );
                        })
                        .catch((err) => {
                            throw new Error(err);
                        });
                }
            }
        }
        res.sendStatus(200);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const MatchForm = require('../models/MatchForm');
const { internalBlueCall, isFutureAlly } = require('./blueAlliance');
const { internalSendMessage } = require('./groupMeBot');
const { convertMatchKeyToString } = require('../util/helperFunctions');
const RTESSIssue = require('../models/RTESSIssue');
const {
    matchFormStatus,
    weekday,
    rtessIssuesStatus,
    timeZone,
    gamePieceFields,
    climbFields
} = require('../util/helperConstants');
const { updateTEDStandForm, updateTEDSuperForms } = require('./ted').HelperFunctions;

router.get('/getMatchForms', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    try {
        const matchForms = await MatchForm.find(JSON.parse(req.headers.filters)).exec();
        res.status(200).json(matchForms);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

router.get('/getMatchForm', async (req, res) => {
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
        matchFormInput.autoGP = {};
        matchFormInput.autoPoints = 0;
        matchFormInput.teleopPoints = 0;
        matchFormInput.stagePoints = 0;

        for (const element of matchFormInput.autoTimeline) {
            // To ignore _id field
            if (Object.hasOwn(gamePieceFields, element.scored)) {
                if (Object.hasOwn(matchFormInput.autoGP, element.scored)) {
                    matchFormInput.autoGP[element.scored] += 1;
                } else {
                    matchFormInput.autoGP[element.scored] = 1;
                }
                matchFormInput.autoPoints += gamePieceFields[element.scored].autoValue || 0;
            }
        }
        matchFormInput.autoPoints += matchFormInput.leftStart ? 2 : 0;

        for (const element in matchFormInput.teleopGP) {
            // To ignore _id field
            if (Object.hasOwn(gamePieceFields, element)) {
                if (element === 'trap') {
                    matchFormInput.stagePoints +=
                        matchFormInput.teleopGP[element] * (gamePieceFields[element].teleopValue || 0);
                } else {
                    matchFormInput.teleopPoints +=
                        matchFormInput.teleopGP[element] * (gamePieceFields[element].teleopValue || 0);
                }
            }
        }
        // ?. in case climb is null;
        matchFormInput.stagePoints += climbFields[matchFormInput.climb]?.teleopValue || 0;

        matchFormInput.offensivePoints =
            matchFormInput.autoPoints + matchFormInput.teleopPoints + matchFormInput.stagePoints;

        const prevMatchForm = await MatchForm.findOneAndUpdate(
            {
                eventKey: matchFormInput.eventKey,
                matchNumber: matchFormInput.matchNumber,
                station: matchFormInput.station
            },
            matchFormInput,
            {
                upsert: true
            }
        ).exec();

        await updateTEDStandForm(prevMatchForm, matchFormInput);

        if (
            matchFormInput.lostCommunication ||
            matchFormInput.robotBroke ||
            matchFormInput.standStatus === matchFormStatus.noShow
        ) {
            let futureMatchNumber = await isFutureAlly(
                matchFormInput.eventKey,
                matchFormInput.teamNumber,
                matchFormInput.matchNumber,
                false
            );
            let prevRTESSIssue = await RTESSIssue.findOne({
                eventKey: matchFormInput.eventKey,
                matchNumber: matchFormInput.matchNumber,
                teamNumber: matchFormInput.teamNumber
            });

            if (futureMatchNumber || prevRTESSIssue) {
                let issues = [];
                if (matchFormInput.lostCommunication) issues.push('Lost Communication');
                if (matchFormInput.robotBroke) issues.push('Robot Broke');
                if (matchFormInput.standStatus === matchFormStatus.noShow) issues.push('No show');

                let rtessIssueInput = {
                    eventKey: matchFormInput.eventKey,
                    matchNumber: matchFormInput.matchNumber,
                    teamNumber: matchFormInput.teamNumber,
                    submitter: context.req.user.displayName,
                    issue: issues.join(', '),
                    problemComment:
                        matchFormInput.standStatus === matchFormStatus.noShow
                            ? matchFormInput.standStatusComment
                            : matchFormInput.standEndComment,
                    status: rtessIssuesStatus.unresolved
                };

                if (prevRTESSIssue) {
                    rtessIssueInput.status = prevRTESSIssue.status;
                    rtessIssueInput.rtessMember = prevRTESSIssue.rtessMember;
                    rtessIssueInput.solutionComment = prevRTESSIssue.solutionComment;
                }

                await RTESSIssue.findOneAndUpdate(
                    {
                        eventKey: rtessIssueInput.eventKey,
                        matchNumber: rtessIssueInput.matchNumber,
                        teamNumber: rtessIssueInput.teamNumber
                    },
                    rtessIssueInput,
                    {
                        new: true,
                        upsert: true
                    }
                ).exec();

                //Service Squad Anncoument
                if (futureMatchNumber && !prevRTESSIssue) {
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
                            throw new Error(err);
                        });
                }
            }
        }

        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

router.post('/postSuperForm', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    try {
        let matchFormInputs = req.body;
        matchFormInputs.forEach((matchFormInput) => (matchFormInput.superScouter = req.user.displayName));

        const updates = matchFormInputs.map((matchFormInput) =>
            MatchForm.findOneAndUpdate(
                {
                    eventKey: matchFormInput.eventKey,
                    matchNumber: matchFormInput.matchNumber,
                    station: matchFormInput.station
                },
                matchFormInput,
                {
                    upsert: true
                }
            ).exec()
        );

        Promise.all(updates)
            .then((prevMatchForms) => updateTEDSuperForms(prevMatchForms, matchFormInputs))
            .then(() => res.sendStatus(200))
            .catch((err) => {
                res.statusMessage = err.message;
                res.sendStatus(500);
            });
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

module.exports = router;

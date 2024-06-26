const express = require('express');
const router = express.Router();
const { MatchForm } = require('../models/MatchForm');
const { internalBlueCall, isFutureAlly } = require('./blueAlliance');
const { internalSendMessage } = require('./groupMeBot');
const { convertMatchKeyToString } = require('../util/helperFunctions');
const RTESSIssue = require('../models/RTESSIssue');
const {
    matchFormStatus,
    weekday,
    rtessIssuesStatus,
    gamePieceFields,
    climbFields
} = require('../util/helperConstants');
const { updateTEDStandForm, updateTEDSuperForm } = require('./ted').HelperFunctions;

router.get('/getMatchForms', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    try {
        const matchForms = await MatchForm.find(JSON.parse(req.headers.filters || '{}')).exec();
        res.status(200).json(matchForms);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

router.get('/getMatchFormsSimple', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    try {
        const matchForms = await MatchForm.find(JSON.parse(req.headers.filters || '{}'))
            .select(
                [
                    'eventKey',
                    'eventName',
                    'matchNumber',
                    'teamNumber',
                    'teamName',
                    'station',
                    'standScouter',
                    'standStatus',
                    'standStatusComment',
                    'superScouter',
                    'allianceNumbers',
                    'superStatus',
                    'superStatusComment'
                ].join(' ')
            )
            .exec();
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
        const matchForm = await MatchForm.findOne(JSON.parse(req.headers.filters || '{}')).exec();
        res.status(200).json(matchForm);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

router.post('/postStandForm/:isQR?/:apiKey?', async (req, res) => {
    if (req.isUnauthenticated() && req.params.apiKey !== process.env.API_KEY) {
        res.sendStatus(401);
        return;
    }

    try {
        let matchFormInputs;
        if (req.params.isQR === 'true') {
            matchFormInputs = req.body.map((QRString) => HelperFunctions.convertQRToStandFormInput(QRString));
        } else {
            if (req.body.standScouter === undefined) {
                req.body.standScouter = req.user.displayName;
            }
            matchFormInputs = [req.body];
        }

        await Promise.all(
            matchFormInputs.map(async (matchFormInput) => {
                matchFormInput.autoGP = {};
                matchFormInput.autoPoints = 0;
                matchFormInput.teleopPoints = 0;
                matchFormInput.stagePoints = 0;

                for (const element of matchFormInput.autoTimeline) {
                    if (element.scored !== null) {
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
                    if (gamePieceFields[element].teleop) {
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
                matchFormInput.stagePoints += climbFields[matchFormInput.climb.attempt]?.teleopValue || 0;
                matchFormInput.stagePoints += 2 * matchFormInput.climb.harmony;
                matchFormInput.stagePoints += matchFormInput.climb.park ? 1 : 0;

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
                )
                    .lean()
                    .exec();

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
                            submitter: req.user.displayName,
                            issue: issues.join(', '),
                            problemComment:
                                matchFormInput.standStatus === matchFormStatus.noShow
                                    ? matchFormInput.standStatusComment
                                    : matchFormInput.standComment,
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
                                        ? ` (${weekday[new Date(time * 1000).getDay()]} ${new Date(
                                              time * 1000
                                          ).toLocaleString('en-US', {
                                              hour: 'numeric',
                                              minute: 'numeric',
                                              hour12: true
                                          })})`
                                        : '';
                                    internalSendMessage(
                                        `*SSA*\nTeam: ${rtessIssueInput.teamNumber}\nIssue: ${
                                            rtessIssueInput.issue
                                        }\nPlaying together in: ${convertMatchKeyToString(
                                            futureMatchNumber
                                        )}${convertedTime}`
                                    );
                                })
                                .catch((err) => {
                                    console.log(err);
                                });
                        }
                    }
                }
            })
        );
        res.sendStatus(200);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

router.post('/postSuperForm/:isQR?/:apiKey?', async (req, res) => {
    if (req.isUnauthenticated() && req.params.apiKey !== process.env.API_KEY) {
        res.sendStatus(401);
        return;
    }

    let matchFormInputs;
    try {
        if (req.params.isQR === 'true') {
            matchFormInputs = req.body.flatMap((QRString) => HelperFunctions.convertQRToSuperFormInputs(QRString));
        } else {
            req.body.forEach((matchFormInput) => (matchFormInput.superScouter = req.user.displayName));
            matchFormInputs = req.body;
        }

        await Promise.all(
            matchFormInputs.map(async (matchFormInput) => {
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
                )
                    .lean()
                    .exec();
                await updateTEDSuperForm(prevMatchForm, matchFormInput);
            })
        );
        res.sendStatus(200);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

class HelperFunctions {
    static convertQRToStandFormInput(QRString) {
        let map = {
            n: null,
            t: true,
            f: false,
            na: 'No Attempt',
            sc: 'Success',
            fl: 'Fail',
            c: 'Center',
            s: 'Side',
            cp: 'Complete',
            fu: 'Follow Up',
            ns: 'No Show',
            ms: 'Missing'
        };
        let data = QRString.split('$');
        let i = 0;
        let standFormInput = {
            eventKey: data[i++],
            matchNumber: data[i++],
            station: data[i++],
            teamNumber: parseInt(data[i++]),
            standScouter: data[i++],
            startingPosition: data[i++] === 'n' ? null : parseInt(data[i - 1]),
            preloadedPiece: data[i++] === 'n' ? null : data[i - 1] === 't' ? 'Note' : 'None',
            leftStart: map[data[i++]],
            autoTimeline: data[i++] === 'n' ? [] : HelperFunctions.extractAutoTimeline(data[i - 1]),
            teleopGP: {
                intakeSource: parseInt(data[i++]),
                intakeGround: parseInt(data[i++]),
                intakePreloaded: parseInt(data[i++]),
                ampScore: parseInt(data[i++]),
                speakerScore: parseInt(data[i++]),
                ampMiss: parseInt(data[i++]),
                speakerMiss: parseInt(data[i++]),
                ferry: parseInt(data[i++]),
                centerFerry: parseInt(data[i++]),
                trap: parseInt(data[i++]),
                subwooferScore: parseInt(data[i++]),
                subwooferMiss: parseInt(data[i++]),
                otherScore: parseInt(data[i++]),
                otherMiss: parseInt(data[i++])
            },
            wasDefended: map[data[i++]],
            defenseRating: parseInt(data[i++]),
            defenseAllocation: parseFloat(data[i++]),
            climb: {
                attempt: map[data[i++]],
                location: map[data[i++]],
                harmony: data[i++] === 'n' ? null : parseInt(data[i - 1]),
                park: map[data[i++]]
            },
            lostCommunication: map[data[i++]],
            robotBroke: map[data[i++]],
            yellowCard: map[data[i++]],
            redCard: map[data[i++]],
            standComment: data[i++] === 'n' ? '' : data[i - 1],
            standStatus: map[data[i++]],
            standStatusComment: data[i++] === 'n' ? '' : data[i - 1],
            history: {
                auto:
                    data[i++] === 'n'
                        ? { data: [], position: data[i++] }
                        : HelperFunctions.extractHistory(data[i - 1], data[i++]),
                teleop:
                    data[i++] === 'n'
                        ? { data: [], position: data[i++] }
                        : HelperFunctions.extractHistory(data[i - 1], data[i++]),
                endGame:
                    data[i++] === 'n'
                        ? { data: [], position: data[i++] }
                        : HelperFunctions.extractHistory(data[i - 1], data[i++])
            }
        };
        return standFormInput;
    }

    static extractAutoTimeline(timeline) {
        let data = timeline.split('#');
        let newTimeline = [];
        for (let i = 0; i < data.length; i += 2) {
            let scored = null;
            if (data[i + 1] != 'n') {
                for (const key in gamePieceFields) {
                    if (gamePieceFields[key].short === data[i + 1]) {
                        scored = gamePieceFields[key].field;
                    }
                }
            }
            newTimeline.push({ piece: data[i], scored: scored });
        }
        return newTimeline;
    }

    static extractHistory(history, position) {
        let data = history.split('#');
        let newHistory = { data: [], position: position };
        for (const element of data) {
            let newElement = element;
            if (isNaN(element)) {
                for (const key in gamePieceFields) {
                    if (gamePieceFields[key].short === element) {
                        newElement = gamePieceFields[key].field;
                    }
                }
            }
            newHistory.data.push(newElement);
        }
        return newHistory;
    }

    static convertQRToSuperFormInputs(QRString) {
        let map = {
            n: null,
            t: true,
            f: false,
            cp: 'Complete',
            fu: 'Follow Up',
            ns: 'No Show',
            ms: 'Missing'
        };
        let data = QRString.split('$');
        let allianceNumbers = [
            parseInt(data[3].split('#')[1]),
            parseInt(data[4].split('#')[1]),
            parseInt(data[5].split('#')[1])
        ];
        let superFormInputs = [];
        for (const inputs of [data[3], data[4], data[5]]) {
            let teamData = inputs.split('#');
            let superFormInput = {
                eventKey: data[0],
                matchNumber: data[1],
                superScouter: data[2],
                station: teamData[0],
                teamNumber: parseInt(teamData[1]),
                allianceNumbers: allianceNumbers,
                agility: teamData[2] === 'n' ? null : parseInt(teamData[2]),
                fieldAwareness: teamData[3] === 'n' ? null : parseInt(teamData[3]),
                ampPlayer: map[teamData[4]],
                ampPlayerGP: {
                    highNoteScore: parseInt(teamData[5]),
                    highNoteMiss: parseInt(teamData[6])
                },
                superStatus: map[teamData[7]],
                superStatusComment: teamData[8] === 'n' ? '' : teamData[8]
            };
            superFormInputs.push(superFormInput);
        }
        return superFormInputs;
    }
}

module.exports = { router, HelperFunctions };

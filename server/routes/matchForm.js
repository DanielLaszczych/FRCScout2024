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
    timeZone,
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
            req.body.standScouter = req.user.displayName;
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
                                              hour12: true,
                                              timeZone: timeZone
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
            matchFormInputs = req.body.map((QRString) => HelperFunctions.convertQRToSuperFormInputs(QRString));
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
        let standFormInput = {
            eventKey: data[0],
            matchNumber: data[1],
            station: data[2],
            teamNumber: parseInt(data[3]),
            standScouter: data[4],
            startingPosition: data[5] === 'n' ? null : parseInt(data[5]),
            preloadedPiece: data[6] === 'n' ? null : data[6] === 't' ? 'Note' : 'None',
            leftStart: map[data[7]],
            autoTimeline: data[8] === 'n' ? [] : HelperFunctions.extractAutoTimeline(data[8]),
            teleopGP: {
                intakeSource: parseInt(data[9]),
                intakeGround: parseInt(data[10]),
                ampScore: parseInt(data[11]),
                speakerScore: parseInt(data[12]),
                ampMiss: parseInt(data[13]),
                speakerMiss: parseInt(data[14]),
                ferry: parseInt(data[15]),
                trap: parseInt(data[16])
            },
            wasDefended: map[data[17]],
            defenseRating: parseInt(data[18]),
            defenseAllocation: parseFloat(data[19]),
            climb: {
                attempt: map[data[20]],
                location: map[data[21]],
                harmony: data[22] === 'n' ? null : parseInt(data[22]),
                park: map[data[23]]
            },
            lostCommunication: map[data[24]],
            robotBroke: map[data[25]],
            yellowCard: map[data[26]],
            redCard: map[data[27]],
            standComment: data[28] === 'n' ? '' : data[28],
            standStatus: map[data[29]],
            standStatusComment: data[30] === 'n' ? '' : data[30],
            history: {
                auto:
                    data[31] === 'n'
                        ? { data: [], position: data[32] }
                        : HelperFunctions.extractHistory(data[31], data[32]),
                teleop:
                    data[33] === 'n'
                        ? { data: [], position: data[34] }
                        : HelperFunctions.extractHistory(data[33], data[34]),
                endGame:
                    data[35] === 'n'
                        ? { data: [], position: data[36] }
                        : HelperFunctions.extractHistory(data[35], data[36])
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

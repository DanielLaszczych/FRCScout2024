const express = require('express');
const router = express.Router();
const { PracticeForm } = require('../models/MatchForm');
const { gamePieceFields, climbFields } = require('../util/helperConstants');
const { convertQRToStandFormInput, convertQRToSuperFormInputs } = require('./matchForm').HelperFunctions;

router.get('/getMatchForms', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    try {
        const practiceForms = await PracticeForm.find(JSON.parse(req.headers.filters || '{}')).exec();
        res.status(200).json(practiceForms);
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
        const practiceForm = await PracticeForm.findOne(JSON.parse(req.headers.filters || '{}')).exec();
        res.status(200).json(practiceForm);
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
            matchFormInputs = req.body.map((QRString) => convertQRToStandFormInput(QRString));
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
                    if (element === 'trap') {
                        matchFormInput.stagePoints +=
                            matchFormInput.teleopGP[element] * (gamePieceFields[element].teleopValue || 0);
                    } else {
                        matchFormInput.teleopPoints +=
                            matchFormInput.teleopGP[element] * (gamePieceFields[element].teleopValue || 0);
                    }
                }
                // ?. in case climb is null;
                matchFormInput.stagePoints += climbFields[matchFormInput.climb.attempt]?.teleopValue || 0;
                matchFormInput.stagePoints += 2 * matchFormInput.climb.harmony;
                matchFormInput.stagePoints += matchFormInput.climb.park ? 1 : 0;

                matchFormInput.offensivePoints =
                    matchFormInput.autoPoints + matchFormInput.teleopPoints + matchFormInput.stagePoints;

                await PracticeForm.findOneAndUpdate(
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
            matchFormInputs = req.body.map((QRString) => convertQRToSuperFormInputs(QRString));
        } else {
            req.body.forEach((matchFormInput) => (matchFormInput.superScouter = req.user.displayName));
            matchFormInputs = [req.body];
        }

        await Promise.all(
            matchFormInputs.map(async (superFormInputs) => {
                const updates = superFormInputs.map((superFormInput) =>
                    PracticeForm.findOneAndUpdate(
                        {
                            eventKey: superFormInput.eventKey,
                            matchNumber: superFormInput.matchNumber,
                            station: superFormInput.station
                        },
                        superFormInput,
                        {
                            upsert: true
                        }
                    )
                        .lean()
                        .exec()
                );
                await Promise.all(updates);
            })
        );
        res.sendStatus(200);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const TED = require('../models/TED');
const MatchForm = require('../models/MatchForm');
const PitForm = require('../models/PitForm');
const { matchFormStatus, gamePieceFields, climbFields } = require('../util/helperConstants');
const { leafGet, leafSet } = require('../util/helperFunctions');
const { internalBlueCall } = require('./blueAlliance');

router.get('/getAllTeamEventData', async (req, res) => {
    try {
        let filters = JSON.parse(req.headers.filters || '{}');
        Promise.all([
            PitForm.findOne(filters).exec(),
            MatchForm.find(filters).exec(),
            TED.findOne(filters).lean().exec()
        ])
            .then((responses) => {
                let data = {
                    pitForm: responses[0],
                    matchForms: responses[1],
                    teamEventData: responses[2]
                };
                if (!data.teamEventData) {
                    res.status(200).json(data);
                    return;
                }
                let rankQueries = [
                    'offensivePoints.avg',
                    'autoPoints.avg',
                    'teleopGP.speakerScore.avg',
                    'teleopGP.ampScore.avg',
                    'stagePoints.avg',
                    'defenseRating.avg'
                ].map((field) => HelperFunctions.getRank(data.teamEventData, field));
                Promise.all([
                    ...rankQueries,
                    internalBlueCall(`event/${filters.eventKey}/teams/keys`)
                        .then((data) => {
                            return !data.Error ? data.length : null;
                        })
                        .catch((err) => null)
                ])
                    .then((responses) => {
                        data.teamEventData.rank = {
                            offense: responses[0],
                            auto: responses[1],
                            teleopSpeaker: responses[2],
                            teleopAmp: responses[3],
                            stage: responses[4],
                            defense: responses[5],
                            totalTeams: responses[6]
                        };
                        res.status(200).json(data);
                    })
                    .catch((err) => {
                        res.statusMessage = err.message;
                        res.sendStatus(500);
                    });
            })
            .catch((err) => {
                res.statusMessage = err.message;
                res.sendStatus(500);
            });
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

class HelperFunctions {
    static async getRank(ted, field) {
        let value = leafGet(ted, field);
        return (
            (await TED.countDocuments({
                [field]: { $gt: value }
            })) + 1
        );
    }

    static getStandFormUpdate(data, reverse = false) {
        //Anything that has modify next to it means it probably has to be changed next year
        let incUpdate = { standForms: 1 };
        let maxUpdate = {};

        for (const element in data.autoGP) {
            // To ignore _id field
            if (Object.hasOwn(gamePieceFields, element) && data.autoGP[element] > 0) {
                incUpdate[`autoGP.${element}.total`] = data.autoGP[element];
                maxUpdate[`autoGP.${element}.max`] = data.autoGP[element];
            }
        }

        for (const element in data.teleopGP) {
            // To ignore _id field
            if (Object.hasOwn(gamePieceFields, element) && data.teleopGP[element] > 0) {
                incUpdate[`teleopGP.${element}.total`] = data.teleopGP[element];
                maxUpdate[`teleopGP.${element}.max`] = data.teleopGP[element];
            }
        }

        incUpdate[`climbCounts.${climbFields[data.climb].field}`] = 1; //Modify the labels to field object

        if (data.defenseRating !== 0) {
            incUpdate['playedDefense'] = 1;
            incUpdate[`defenseRating.total`] = data.defenseRating;
            incUpdate[`defenseAllocation.total`] = data.defenseAllocation;
            maxUpdate[`defenseRating.max`] = data.defenseRating;
            maxUpdate[`defenseAllocation.max`] = data.defenseAllocation;
        }
        // First element is usually crossing starting line (Modify)
        for (const field of ['leftStart', 'wasDefended', 'lostCommunication', 'robotBroke', 'yellowCard', 'redCard']) {
            if (data[field]) {
                incUpdate[field] = 1;
            }
        }

        for (const field of ['autoPoints', 'teleopPoints', 'stagePoints', 'offensivePoints']) {
            if (data[field] > 0) {
                incUpdate[`${field}.total`] = data[field];
                maxUpdate[`${field}.max`] = data[field];
            }
        }

        if (reverse) {
            for (const key in incUpdate) {
                if (incUpdate[key] > 0) {
                    incUpdate[key] *= -1;
                }
            }
        }

        return {
            incUpdate,
            maxUpdate
        };
    }

    static getSuperFormUpdate(data, reverse = false) {
        return {
            incUpdate: {
                superForms: reverse ? -1 : 1,
                'agility.total': data.agility * (reverse ? -1 : 1),
                'fieldAwareness.total': data.fieldAwareness * (reverse ? -1 : 1)
            },
            maxUpdate: { 'agility.max': data.agility, 'fieldAwareness.max': data.fieldAwareness }
        };
    }

    static mergeIncUpdates(incUpdateOne, incUpdateTwo) {
        let incUpdate = { ...incUpdateOne };
        for (const key in incUpdateTwo) {
            if (Object.hasOwn(incUpdate, key)) {
                incUpdate[key] += incUpdateTwo[key];
            } else {
                incUpdate[key] = incUpdateTwo[key];
            }
        }

        return incUpdate;
    }

    static compareMaxUpdates(forwardMaxUpdate, reverseMaxUpdate) {
        for (const key in forwardMaxUpdate) {
            if (Object.hasOwn(reverseMaxUpdate, key)) {
                if (forwardMaxUpdate[key] >= reverseMaxUpdate[key]) {
                    delete reverseMaxUpdate[key];
                } else {
                    delete forwardMaxUpdate[key];
                }
            }
        }
    }

    static updateStandFormAverages(ted) {
        for (const element in gamePieceFields) {
            if (gamePieceFields[element].auto) {
                if (ted.standForms === 0) {
                    ted.autoGP[element].avg = 0;
                } else {
                    ted.autoGP[element].avg = ted.autoGP[element].total / ted.standForms;
                }
            }
            if (gamePieceFields[element].teleop) {
                if (ted.standForms === 0) {
                    ted.teleopGP[element].avg = 0;
                } else {
                    ted.teleopGP[element].avg = ted.teleopGP[element].total / ted.standForms;
                }
            }
        }

        let totalAttempts = ted.climbCounts.success + ted.climbCounts.harmony + ted.climbCounts.fail;
        ted.climbSuccessPercentage =
            totalAttempts === 0 ? null : (ted.climbCounts.success + ted.climbCounts.harmony) / totalAttempts;
        ted.climbSuccessFraction =
            totalAttempts === 0 ? null : `${ted.climbCounts.success + ted.climbCounts.harmony} / ${totalAttempts}`;

        ted.defenseRating.avg = ted.playedDefense === 0 ? 0 : ted.defenseRating.total / ted.playedDefense;
        ted.defenseAllocation.avg = ted.playedDefense === 0 ? 0 : ted.defenseAllocation.total / ted.playedDefense;

        for (const field of ['autoPoints', 'teleopPoints', 'stagePoints', 'offensivePoints']) {
            ted[field].avg = ted.standForms === 0 ? 0 : ted[field].total / ted.standForms;
        }
    }

    static async getMatchFormMaxValue(eventKey, teamNumber, field, isSuperForms) {
        let maxValue = await MatchForm.findOne({
            eventKey: eventKey,
            teamNumber: teamNumber,
            [isSuperForms ? 'superStatus' : 'standStatus']: matchFormStatus.complete
        })
            .sort({ field: -1 }) // Sort in descending order
            .limit(1)
            .select(field);
        return maxValue ? leafGet(maxValue, field) : 0;
    }

    static async updateMatchFormMaxes(
        eventKey,
        teamNumber,
        ted,
        forwardMaxUpdate,
        reverseMaxUpdate,
        updatingSuperForms
    ) {
        for (const key in forwardMaxUpdate) {
            if (forwardMaxUpdate[key] > leafGet(ted, key)) {
                leafSet(ted, key, forwardMaxUpdate[key]);
            }
        }
        for (const key in reverseMaxUpdate) {
            if (reverseMaxUpdate[key] === leafGet(ted, key)) {
                let newMax = await HelperFunctions.getMatchFormMaxValue(
                    eventKey,
                    teamNumber,
                    key.slice(0, key.indexOf('.max')),
                    updatingSuperForms
                );
                leafSet(ted, key, newMax);
            }
        }
    }

    static async updateStandForm(eventKey, teamNumber, incUpdate, forwardMaxUpdate, reverseMaxUpdate) {
        const ted = await TED.findOneAndUpdate(
            {
                eventKey: eventKey,
                teamNumber: teamNumber
            },
            incUpdate,
            {
                new: true,
                upsert: true
            }
        );

        HelperFunctions.updateStandFormAverages(ted);
        await HelperFunctions.updateMatchFormMaxes(
            eventKey,
            teamNumber,
            ted,
            forwardMaxUpdate,
            reverseMaxUpdate,
            false
        );
        await ted.save();
    }

    static updateSuperFormAverages(ted) {
        ted.agility.avg = ted.superForms === 0 ? 0 : ted.agility.total / ted.superForms;
        ted.fieldAwareness.avg = ted.superForms === 0 ? 0 : ted.fieldAwareness.total / ted.superForms;
    }

    static async updateSuperForm(eventKey, teamNumber, incUpdate, forwardMaxUpdate, reverseMaxUpdate) {
        const ted = await TED.findOneAndUpdate(
            {
                eventKey: eventKey,
                teamNumber: teamNumber
            },
            incUpdate,
            {
                new: true,
                upsert: true
            }
        );

        HelperFunctions.updateSuperFormAverages(ted);
        await HelperFunctions.updateMatchFormMaxes(eventKey, teamNumber, ted, forwardMaxUpdate, reverseMaxUpdate, true);
        await ted.save();
    }

    static async updateTEDStandForm(prevStandForm, standFormInput) {
        let reverseUpdate = null;
        if (prevStandForm !== null) {
            if (prevStandForm.standStatus === matchFormStatus.complete) {
                reverseUpdate = HelperFunctions.getStandFormUpdate(prevStandForm, true);
            } else if (prevStandForm.standStatus === matchFormStatus.noShow) {
                reverseUpdate = {
                    incUpdate: { noShows: -1 },
                    maxUpdate: {}
                };
            }
        }

        let forwardUpdate = null;
        if (standFormInput.standStatus === matchFormStatus.complete) {
            forwardUpdate = HelperFunctions.getStandFormUpdate(standFormInput);
        } else if (standFormInput.standStatus === matchFormStatus.noShow) {
            forwardUpdate = { incUpdate: { noShows: 1 }, maxUpdate: {} };
        }

        if (
            reverseUpdate !== null &&
            forwardUpdate !== null &&
            prevStandForm.teamNumber === standFormInput.teamNumber
        ) {
            let incUpdate = {
                $inc: HelperFunctions.mergeIncUpdates(forwardUpdate.incUpdate, reverseUpdate.incUpdate)
            };
            HelperFunctions.compareMaxUpdates(forwardUpdate.maxUpdate, reverseUpdate.maxUpdate);

            await HelperFunctions.updateStandForm(
                standFormInput.eventKey,
                standFormInput.teamNumber,
                incUpdate,
                forwardUpdate.maxUpdate,
                reverseUpdate.maxUpdate
            );
            return;
        }
        if (reverseUpdate !== null) {
            let incUpdate = {
                $inc: reverseUpdate.incUpdate
            };

            await HelperFunctions.updateStandForm(
                prevStandForm.eventKey,
                prevStandForm.teamNumber,
                incUpdate,
                null,
                reverseUpdate.maxUpdate
            );
        }
        if (forwardUpdate !== null) {
            let incUpdate = { $inc: forwardUpdate.incUpdate };

            await HelperFunctions.updateStandForm(
                standFormInput.eventKey,
                standFormInput.teamNumber,
                incUpdate,
                forwardUpdate.maxUpdate,
                null
            );
        }
    }

    static async updateTEDSuperForms(prevSuperForms, superFormInputs) {
        let updates = [];
        for (const prevSuperForm of prevSuperForms) {
            if (prevSuperForm !== null && prevSuperForm.superStatus === matchFormStatus.complete) {
                let reverseUpdate = HelperFunctions.getSuperFormUpdate(prevSuperForm, true);

                let index = superFormInputs.findIndex(
                    (element) =>
                        parseInt(element.teamNumber) === prevSuperForm.teamNumber &&
                        element.superStatus === matchFormStatus.complete
                );
                if (index !== -1) {
                    let superFormInput = superFormInputs.splice(index, 1)[0];
                    let forwardUpdate = HelperFunctions.getSuperFormUpdate(superFormInput);
                    HelperFunctions.compareMaxUpdates(forwardUpdate.maxUpdate, reverseUpdate.maxUpdate);
                    let incUpdate = {
                        $inc: HelperFunctions.mergeIncUpdates(forwardUpdate.incUpdate, reverseUpdate.incUpdate)
                    };
                    updates.push(
                        HelperFunctions.updateSuperForm(
                            superFormInput.eventKey,
                            superFormInput.teamNumber,
                            incUpdate,
                            forwardUpdate.maxUpdate,
                            reverseUpdate.maxUpdate
                        )
                    );
                } else {
                    let incUpdate = { $inc: reverseUpdate.incUpdate };
                    updates.push(
                        HelperFunctions.updateSuperForm(
                            prevSuperForm.eventKey,
                            prevSuperForm.teamNumber,
                            incUpdate,
                            null,
                            reverseUpdate.maxUpdate
                        )
                    );
                }
            }
        }

        for (const superFormInput of superFormInputs) {
            if (superFormInput.superStatus === matchFormStatus.complete) {
                let forwardUpdate = HelperFunctions.getSuperFormUpdate(superFormInput);
                let incUpdate = { $inc: forwardUpdate.incUpdate };
                updates.push(
                    HelperFunctions.updateSuperForm(
                        superFormInput.eventKey,
                        superFormInput.teamNumber,
                        incUpdate,
                        forwardUpdate.maxUpdate,
                        null
                    )
                );
            }
        }

        return Promise.all(updates).catch((err) => {
            throw new Error(err);
        });
    }
}

module.exports = { router, HelperFunctions };

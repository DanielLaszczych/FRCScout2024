const express = require('express');
const router = express.Router();
const TED = require('../models/TED');
const MatchForm = require('../models/MatchForm');
const PitForm = require('../models/PitForm');
const { matchFormStatus, gamePieceFields, climbFields } = require('../util/helperConstants');
const { capitalizeFirstLetter } = require('../util/helperFunctions');

router.get('/getAllTeamEventData', async (req, res) => {
    try {
        let filters = JSON.parse(req.headers.filters);
        Promise.all([
            PitForm.findOne(filters).exec(),
            MatchForm.find(filters).exec(),
            TED.find({ eventKey: filters.eventKey }).exec()
        ])
            .then((responses) => {
                res.status(200).json({
                    pitForm: responses[0],
                    matchForms: responses[1],
                    teamEventData: responses[2]
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
    static consoldiateEventTED(EventTEDData, specificTeamNumber = null) {
        // let consolidatedData = [];
        // let maxAverages = {
        //     autoPoints: 0,
        //     teleopPoints: 0,
        //     offensivePoints: 0,
        //     teleopAmpPieces: 0,
        //     teleopSpeakerPieces: 0,
        //     defensiveRating: 0,
        //     climbPoints: 0
        // };
        // for (const ted of EventTEDData) {
        //     let consolidated = {
        //         eventKey: ted.eventKey,
        //         teamNumber: ted.eventKey,
        //         auto: { avgPoints: 0, maxPoints: 0 },
        //         teleop: { avgPoints: 0, maxPoints: 0 },
        //         avgOffensivePoints: 0,
        //         maxOffensivePoints: 0
        //     };
        //     // All stuff related to game piece scoring
        //     for (const element in gamePieceFields) {
        //         if (gamePieceFields[element].auto) {
        //             let value = 0;
        //             if (ted.autoGP[gamePieceFields[element].field] !== 0 && ted.standForms !== 0) {
        //                 value = ted.autoGP[gamePieceFields[element].field] / ted.standForms;
        //             }
        //             consolidated[`auto.avg${capitalizeFirstLetter(gamePieceFields[element].field)}`] = value;
        //             if (Object.hasOwn('autoValue')) {
        //                 consolidated.auto.avgPoints += value * gamePieceFields[element].autoValue;
        //             }
        //         }
        //         if (gamePieceFields[element].teleop) {
        //             let value = 0;
        //             if (ted.teleopGP[gamePieceFields[element].field] !== 0 && ted.standForms !== 0) {
        //                 value = ted.teleopGP[gamePieceFields[element].field] / ted.standForms;
        //             }
        //             consolidated[`teleop.avg${capitalizeFirstLetter(gamePieceFields[element].field)}`] = value;
        //             if (Object.hasOwn('teleopValue')) {
        //                 consolidated.auto.avgPoints += value * gamePieceFields[element].teleopValue;
        //             }
        //         }
        //     }
        //     maxAverages.autoPoints = Math.max(maxAverages.autoPoints, consolidated.auto.avgPoints);
        //     maxAverages.teleopPoints = Math.max(maxAverages.teleopPoints, consolidated.teleop.avgPoints);
        //     // Climb stuff
        // }
        // return consolidated;
    }

    static getStandFormUpdate(data, removal = false) {
        //Anything that has modify next to it means it probably has to be changed next year
        let autoUpdates = {};
        let teleopUpdates = {};
        let otherUpdates = {};
        let maxValues = { 'autoPoints.max': 0, 'teleopPoints.max': 0 };
        for (const element of data.autoTimeline) {
            maxValues['autoPoints.max'] += gamePieceFields[element.scored].autoValue || 0;
            if (Object.hasOwn(autoUpdates, `autoGP.${element.scored}`)) {
                autoUpdates[`autoGP.${element.scored}.total`] += 1 * (removal ? -1 : 1);
                maxValues[`autoGP.${element.scored}.max`] += 1;
            } else {
                autoUpdates[`autoGP.${element.scored}.total`] = 1 * (removal ? -1 : 1);
                maxValues[`autoGP.${element.scored}.max`] = 1;
            }
        }
        for (const element in data.teleopGP) {
            teleopUpdates[`teleopGP.${element}.total`] = data.teleopGP[element] * (removal ? -1 : 1);
            maxValues[`teleopGP.${element}.max`] = data.teleopGP[element];
            maxValues['teleopPoints.max'] += data.teleopGP[element] * (gamePieceFields[element].teleopValue || 0);
        }

        otherUpdates[`climbCounts.${climbFields[data.climb].field}`] = removal ? -1 : 1; //Modify the labels to field object
        maxValues['teleopPoints.max'] += climbFields[data.climb].field.teleopValue || 0;

        if (data.defenseRating !== 0) {
            otherUpdates.playedDefense = removal ? -1 : 1;
            otherUpdates[`defenseRating.total`] = data.defenseRating * (removal ? -1 : 1);
            otherUpdates[`defenseAllocation.total`] = data.defenseAllocation * (removal ? -1 : 1);
            maxValues[`defenseRating.max`] = data.defenseRating;
            maxValues[`defenseAllocation.max`] = data.defenseAllocation;
        }
        // First element is usually crossing starting line (Modify)
        for (const field of ['leftStart', 'wasDefended', 'lostCommunication', 'robotBroke', 'yellowCard', 'redCard']) {
            otherUpdates[field] = data[field] ? (removal ? -1 : 1) : 0;
        }
        maxValues['autoPoints.max'] += data['leftStart'] ? 2 : 0;

        maxValues['offensivePoints.max'] = maxValues['autoPoints.max'] + maxValues['teleopPoints.max'];

        return {
            incUpdate: {
                standForms: removal ? -1 : 1,
                ...autoUpdates,
                ...teleopUpdates,
                ...otherUpdates
            },
            maxValues
        };
    }

    static getSuperFormUpdate(data, removal = false) {
        return {
            $inc: {
                superForms: removal ? -1 : 1,
                agility: data.agility * (removal ? -1 : 1),
                fieldAwareness: data.fieldAwareness * (removal ? -1 : 1)
            }
        };
    }

    static mergeIncUpdates(update1, update2) {
        const result = { ...update1 };
        for (const key in update2) {
            if (Object.hasOwn(result, key)) {
                result[key] += update2[key];
            } else {
                result[key] = update2[key];
            }
        }

        return result;
    }

    static getSetAndMaxUpdate(maxValues, prevMaxValues, removalUpdate) {
        let setUpdate = {};
        let maxUpdate = {};

        for (const key in maxValues) {
            if (prevMaxValues && Object.hasOwn(prevMaxValues, key)) {
                if (maxValues[key] >= prevMaxValues[key]) {
                    maxUpdate[key] = { key: maxValues[key] };
                } else {
                    // This means the new max value from the match form is less than the previous match forms
                    // so we need to signal it for revaluating in the post middleware
                    setUpdate[key] = { key: -1 };
                }
            } else if (removalUpdate) {
                setUpdate[key] = { key: -1 };
            } else {
                maxUpdate[key] = { key: maxValues[key] };
            }
        }

        return {
            setUpdate,
            maxUpdate
        };
    }

    static async updateTEDStandForm(prevStandForm, standFormInput) {
        let prevUpdate = null;
        // If this is true that means the prev forms data was added to a team ted so we have to remove it
        if (prevStandForm !== null) {
            if (prevStandForm.standStatus === matchFormStatus.complete) {
                prevUpdate = HelperFunctions.getStandFormUpdate(prevStandForm, true);
            } else if (prevStandForm.standStatus === matchFormStatus.noShow) {
                prevUpdate = {
                    $inc: { noShows: -1 }
                };
            }
        }

        let update = null;
        if (standFormInput.standStatus === matchFormStatus.complete) {
            update = HelperFunctions.getStandFormUpdate(standFormInput);
        } else if (standFormInput.standStatus === matchFormStatus.noShow) {
            update = {
                $inc: { noShows: 1 }
            };
        }

        if (prevUpdate !== null) {
            // We have to check if the update is not null in case its a followUp stand form
            if (update !== null && prevStandForm.teamNumber === standFormInput.teamNumber) {
                update = {
                    $inc: HelperFunctions.mergeIncUpdates(update.$inc, prevUpdate.$inc)
                };
            } else {
                await TED.findOneAndUpdate(
                    {
                        eventKey: prevStandForm.eventKey,
                        teamNumber: prevStandForm.teamNumber
                    },
                    prevUpdate,
                    {
                        new: true,
                        upsert: true
                    }
                );
            }
        }

        if (update !== null) {
            await TED.findOneAndUpdate(
                {
                    eventKey: standFormInput.eventKey,
                    teamNumber: standFormInput.teamNumber
                },
                update,
                {
                    new: true,
                    upsert: true
                }
            );
        }
    }

    static async updateTEDSuperForms(prevSuperForms, superFormInputs) {
        let updates = [];
        for (const prevInput of prevSuperForms) {
            if (prevInput !== null && prevInput.superStatus === matchFormStatus.complete) {
                let prevUpdate = HelperFunctions.getSuperFormUpdate(prevInput, true);

                let index = superFormInputs.findIndex(
                    (element) =>
                        element.teamNumber === prevInput.teamNumber && element.superStatus === matchFormStatus.complete
                );
                let update = prevUpdate;
                if (index !== -1) {
                    let input = superFormInputs.splice(index, 1)[0];
                    update = HelperFunctions.getSuperFormUpdate(input);
                    update = {
                        $inc: HelperFunctions.mergeIncUpdates(update.$inc, prevUpdate.$inc)
                    };
                }

                updates.push(
                    TED.findOneAndUpdate(
                        {
                            eventKey: prevInput.eventKey,
                            teamNumber: prevInput.teamNumber
                        },
                        update,
                        {
                            new: true,
                            upsert: true
                        }
                    )
                );
            }
        }

        for (const input of superFormInputs) {
            if (input.superStatus === matchFormStatus.complete) {
                let update = HelperFunctions.getSuperFormUpdate(input);
                updates.push(
                    TED.findOneAndUpdate(
                        {
                            eventKey: input.eventKey,
                            teamNumber: input.teamNumber
                        },
                        update,
                        {
                            new: true,
                            upsert: true
                        }
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

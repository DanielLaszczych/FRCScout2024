const express = require('express');
const router = express.Router();
const TED = require('../models/TED');
const MatchForm = require('../models/MatchForm');
const PitForm = require('../models/PitForm');
const { matchFormStatus, gamePieceFields, climbFields } = require('../util/helperConstants');
const { leaf } = require('../util/helperFunctions');

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
    static getStandFormUpdate(data, removal = false) {
        //Anything that has modify next to it means it probably has to be changed next year
        let autoUpdates = {};
        let teleopUpdates = {};
        let otherUpdates = {};
        let maxValues = { 'autoPoints.max': 0, 'teleopPoints.max': 0 };

        for (const element in data.autoGP) {
            // To ignore _id field
            if (Object.hasOwn(gamePieceFields, element)) {
                autoUpdates[`autoGP.${element}.total`] = data.autoGP[element] * (removal ? -1 : 1);
                maxValues[`autoGP.${element}.max`] = data.autoGP[element];
                maxValues['autoPoints.max'] += data.autoGP[element] * (gamePieceFields[element].autoValue || 0);
            }
        }

        for (const element in data.teleopGP) {
            // To ignore _id field
            if (Object.hasOwn(gamePieceFields, element)) {
                teleopUpdates[`teleopGP.${element}.total`] = data.teleopGP[element] * (removal ? -1 : 1);
                maxValues[`teleopGP.${element}.max`] = data.teleopGP[element];
                maxValues['teleopPoints.max'] += data.teleopGP[element] * (gamePieceFields[element].teleopValue || 0);
            }
        }

        otherUpdates[`climbCounts.${climbFields[data.climb].field}`] = removal ? -1 : 1; //Modify the labels to field object
        maxValues['teleopPoints.max'] += climbFields[data.climb].teleopValue || 0;

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

        autoUpdates['autoPoints.total'] = maxValues['autoPoints.max'] * (removal ? -1 : 1);
        teleopUpdates['teleopPoints.total'] = maxValues['teleopPoints.max'] * (removal ? -1 : 1);
        otherUpdates['offensivePoints.total'] = maxValues['offensivePoints.max'] * (removal ? -1 : 1);

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
            incUpdate: {
                superForms: removal ? -1 : 1,
                'agility.total': data.agility * (removal ? -1 : 1),
                'fieldAwareness.total': data.fieldAwareness * (removal ? -1 : 1)
            },
            maxValues: { 'agility.max': data.agility, 'fieldAwareness.max': data.fieldAwareness }
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

    static async getMatchFormMaxValue(prevMatchForm, field, isSuperForms) {
        let properField = field.slice(0, field.indexOf('.max'));
        let maxValue = await MatchForm.findOne({
            eventKey: prevMatchForm.eventKey,
            teamNumber: prevMatchForm.teamNumber,
            [isSuperForms ? 'superStatus' : 'standStatus']: matchFormStatus.complete
        })
            .sort({ properField: -1 }) // Sort in descending order
            .limit(1)
            .select(properField);
        return maxValue ? leaf(maxValue, properField) : 0;
    }

    static async getSetAndMaxUpdate(maxValues, prevMaxValues, prevMatchForm, removalUpdate, isSuperForms = false) {
        let keys1 = Object.keys(maxValues);
        let keys2 = [];
        if (prevMaxValues !== null) {
            keys2 = Object.keys(prevMaxValues);
        }
        // Concatenate the keys and remove duplicates using a Set
        const mergedKeys = [...new Set([...keys1, ...keys2])];
        let setUpdate = {};
        let maxUpdate = {};

        for (const key of mergedKeys) {
            if (prevMaxValues && Object.hasOwn(prevMaxValues, key)) {
                if (Object.hasOwn(maxValues, key) && maxValues[key] >= prevMaxValues[key]) {
                    maxUpdate[key] = maxValues[key];
                    // No point to try to compare zero to the max
                } else if (prevMaxValues[key] !== 0) {
                    // If the max we are removing equals to current max then we need to
                    // signal to re-evaluate the max by checking past forms
                    setUpdate[key] = await HelperFunctions.getMatchFormMaxValue(prevMatchForm, key, isSuperForms);
                    console.log(setUpdate[key]);
                }
            } else if (removalUpdate) {
                setUpdate[key] = await HelperFunctions.getMatchFormMaxValue(prevMatchForm, key, isSuperForms);
                // No point to try to compare zero to the max
            } else if (maxUpdate[key] !== 0) {
                maxUpdate[key] = maxValues[key];
            }
        }

        return {
            setUpdate,
            maxUpdate
        };
    }

    static async updateStandFormAverages(ted) {
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
        ted.climbSucessPercentage =
            totalAttempts === 0 ? null : (ted.climbCounts.success + ted.climbCounts.harmony) / totalAttempts;
        ted.climbSucessFraction =
            totalAttempts === 0 ? null : `${ted.climbCounts.success + ted.climbCounts.harmony} / ${totalAttempts}`;

        ted.defenseRating.avg = ted.playedDefense === 0 ? 0 : ted.defenseRating.total / ted.playedDefense;
        ted.defenseAllocation.avg = ted.playedDefense === 0 ? 0 : ted.defenseAllocation.total / ted.playedDefense;

        ted.autoPoints.avg = ted.standForms === 0 ? 0 : ted.autoPoints.total / ted.standForms;
        ted.teleopPoints.avg = ted.standForms === 0 ? 0 : ted.teleopPoints.total / ted.standForms;
        ted.offensivePoints.avg = ted.standForms === 0 ? 0 : ted.offensivePoints.total / ted.standForms;

        await ted.save();
    }

    static async updateSuperFormAverages(ted) {
        ted.agility.avg = ted.superForms === 0 ? 0 : ted.agility.total / ted.superForms;
        ted.fieldAwareness.avg = ted.superForms === 0 ? 0 : ted.fieldAwareness.total / ted.superForms;

        return ted.save();
    }

    static async updateTEDStandForm(prevStandForm, standFormInput) {
        let prevUpdate = null;
        // If this is true that means the prev forms data was added to a team ted so we have to remove it
        if (prevStandForm !== null) {
            if (prevStandForm.standStatus === matchFormStatus.complete) {
                prevUpdate = HelperFunctions.getStandFormUpdate(prevStandForm, true);
            } else if (prevStandForm.standStatus === matchFormStatus.noShow) {
                prevUpdate = {
                    incUpdate: { noShows: -1 },
                    maxValues: {}
                };
            }
        }

        let update = null;
        if (standFormInput.standStatus === matchFormStatus.complete) {
            update = HelperFunctions.getStandFormUpdate(standFormInput);
        } else if (standFormInput.standStatus === matchFormStatus.noShow) {
            update = {
                incUpdate: { noShows: 1 },
                maxValues: {}
            };
        }

        console.log('Prev Update Pre Max');
        console.log(prevUpdate);
        console.log('Update Pre Max');
        console.log(update);

        let sameTeamNumber = false;
        if (prevUpdate !== null) {
            // We have to check if the update is not null in case its a followUp stand form
            if (update !== null && prevStandForm.teamNumber === standFormInput.teamNumber) {
                let setAndMaxUpdate = await HelperFunctions.getSetAndMaxUpdate(
                    update.maxValues,
                    prevUpdate.maxValues,
                    prevStandForm,
                    false
                );
                update = {
                    $inc: HelperFunctions.mergeIncUpdates(update.incUpdate, prevUpdate.incUpdate),
                    ...setAndMaxUpdate.setUpdate,
                    $max: setAndMaxUpdate.maxUpdate
                };
                sameTeamNumber = true;
            } else {
                let setAndMaxUpdate = await HelperFunctions.getSetAndMaxUpdate(
                    prevUpdate.maxValues,
                    null,
                    prevStandForm,
                    true
                );
                prevUpdate = {
                    $inc: prevUpdate.incUpdate,
                    ...setAndMaxUpdate.setUpdate,
                    $max: setAndMaxUpdate.maxUpdate
                };

                console.log('Prev Update Post Max');
                console.log(prevUpdate);

                const ted = await TED.findOneAndUpdate(
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
                await HelperFunctions.updateStandFormAverages(ted);
            }
        }

        if (update !== null) {
            if (!sameTeamNumber) {
                let setAndMaxUpdate = await HelperFunctions.getSetAndMaxUpdate(update.maxValues, null, null, false);
                update = { $inc: update.incUpdate, ...setAndMaxUpdate.setUpdate, $max: setAndMaxUpdate.maxUpdate };
            }

            console.log('Final Update Post Max');
            console.log(update);

            const ted = await TED.findOneAndUpdate(
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
            await HelperFunctions.updateStandFormAverages(ted);
        }
    }

    static async updateTEDSuperForms(prevSuperForms, superFormInputs) {
        let updates = [];
        for (const prevSuperForm of prevSuperForms) {
            if (prevSuperForm !== null && prevSuperForm.superStatus === matchFormStatus.complete) {
                let prevUpdate = HelperFunctions.getSuperFormUpdate(prevSuperForm, true);

                let index = superFormInputs.findIndex(
                    (element) =>
                        element.teamNumber === prevSuperForm.teamNumber &&
                        element.superStatus === matchFormStatus.complete
                );
                let update;
                if (index !== -1) {
                    let input = superFormInputs.splice(index, 1)[0];
                    update = HelperFunctions.getSuperFormUpdate(input);
                    let setAndMaxUpdate = await HelperFunctions.getSetAndMaxUpdate(
                        update.maxValues,
                        prevUpdate.maxValues,
                        prevSuperForm,
                        false,
                        true
                    );
                    update = {
                        $inc: HelperFunctions.mergeIncUpdates(update.incUpdate, prevUpdate.incUpdate),
                        ...setAndMaxUpdate.setUpdate,
                        $max: setAndMaxUpdate.maxUpdate
                    };
                } else {
                    let setAndMaxUpdate = await HelperFunctions.getSetAndMaxUpdate(
                        prevUpdate.maxValues,
                        null,
                        prevSuperForm,
                        true,
                        true
                    );
                    update = {
                        $inc: prevUpdate.incUpdate,
                        ...setAndMaxUpdate.setUpdate,
                        $max: setAndMaxUpdate.maxUpdate
                    };
                }

                updates.push(
                    TED.findOneAndUpdate(
                        {
                            eventKey: prevSuperForm.eventKey,
                            teamNumber: prevSuperForm.teamNumber
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

        for (const superFormInput of superFormInputs) {
            if (superFormInput.superStatus === matchFormStatus.complete) {
                let update = HelperFunctions.getSuperFormUpdate(superFormInput);
                let setAndMaxUpdate = await HelperFunctions.getSetAndMaxUpdate(
                    update.maxValues,
                    null,
                    null,
                    false,
                    true
                );
                update = { $inc: update.incUpdate, ...setAndMaxUpdate.setUpdate, $max: setAndMaxUpdate.maxUpdate };
                updates.push(
                    TED.findOneAndUpdate(
                        {
                            eventKey: superFormInput.eventKey,
                            teamNumber: superFormInput.teamNumber
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

        return Promise.all(updates)
            .then((teds) => Promise.all(teds.map((ted) => HelperFunctions.updateSuperFormAverages(ted))))
            .catch((err) => {
                throw new Error(err);
            });
    }
}

module.exports = { router, HelperFunctions };

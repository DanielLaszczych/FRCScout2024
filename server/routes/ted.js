const express = require('express');
const router = express.Router();
const TED = require('../models/TED');
const { MatchForm, PracticeForm } = require('../models/MatchForm');
const PitForm = require('../models/PitForm');
const { matchFormStatus, gamePieceFields, climbFields } = require('../util/helperConstants');
const { leafGet, leafSet } = require('../util/helperFunctions');
const { internalBlueCall } = require('./blueAlliance');

router.get('/getTEDs', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.sendStatus(401);
        return;
    }
    try {
        const TEDs = await TED.find(JSON.parse(req.headers.filters || '{}')).exec();
        res.status(200).json(TEDs);
    } catch (err) {
        res.statusMessage = err.message;
        res.sendStatus(500);
    }
});

router.get('/getAllTeamEventData', async (req, res) => {
    try {
        let filters = JSON.parse(req.headers.filters || '{}');
        await Promise.all([
            PitForm.findOne(filters).exec(),
            MatchForm.find(filters).exec(),
            PracticeForm.find(filters).exec(),
            TED.findOne(filters).lean().exec()
        ]).then(async (responses) => {
            let data = {
                pitForm: responses[0],
                matchForms: responses[1],
                practiceForms: responses[2],
                teamEventData: responses[3]
            };
            if (data.teamEventData) {
                data.teamEventData.autoPaths = HelperFunctions.getAutoPaths(data.matchForms);
            }
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
            await Promise.all([
                ...rankQueries,
                internalBlueCall(`event/${filters.eventKey}/teams/keys`)
                    .then((data) => {
                        return !data.Error ? data.length : null;
                    })
                    .catch((err) => null)
            ]).then((responses) => {
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
            });
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
                eventKey: ted.eventKey,
                [field]: { $gt: value }
            })) + 1
        );
    }

    static getAutoPaths(matchForms) {
        let map = {
            ampScore: 'amp',
            ampMiss: 'amp',
            speakerScore: 'speaker',
            speakerMiss: 'speaker',
            intakeMiss: 'intake',
            null: 'n'
        };

        let paths = {};
        for (const matchForm of matchForms) {
            if (matchForm.standStatus !== matchFormStatus.complete) {
                continue;
            }

            let timeline = matchForm.startingPosition.toString();
            let count = { speaker: 0, amp: 0, intake: 0, null: 0 };
            for (const action of matchForm.autoTimeline) {
                timeline += action.piece + map[action.scored];
                count[map[action.scored]] += 1;
            }

            let pathData;
            let newPath = false;
            if (Object.hasOwn(paths, timeline.replaceAll('intake', 'speaker'))) {
                pathData = paths[timeline.replaceAll('intake', 'speaker')];
            } else if (Object.hasOwn(paths, timeline.replaceAll('intake', 'amp'))) {
                pathData = paths[timeline.replaceAll('intake', 'amp')];
            } else {
                newPath = true;
                if (count.amp > count.speaker) {
                    timeline = timeline.replaceAll('intake', 'amp');
                } else {
                    timeline = timeline.replaceAll('intake', 'speaker');
                }
                pathData = {
                    runs: 0,
                    startingPosition: matchForm.startingPosition,
                    leftStart: 0,
                    path: {},
                    totalPoints: 0
                };
                let order = 1;
                for (const action of matchForm.autoTimeline) {
                    let label = map[action.scored];
                    if (label === 'intake') {
                        if (count.amp > count.speaker) {
                            label = 'amp';
                        } else {
                            label = 'speaker';
                        }
                    }
                    pathData.path[order++] = { piece: action.piece, label: label, score: 0, miss: 0 };
                }
            }

            pathData.runs += 1;
            pathData.leftStart += matchForm.leftStart ? 1 : 0;
            pathData.totalPoints += matchForm.leftStart ? 2 : 0;
            let order = 1;
            for (const action of matchForm.autoTimeline) {
                if (action.scored !== null) {
                    if (action.scored.includes('Score')) {
                        pathData.path[order].score += 1;
                        pathData.totalPoints += gamePieceFields[action.scored].autoValue;
                    } else if (action.scored.includes('Miss')) {
                        pathData.path[order].miss += 1;
                    }
                }
                order += 1;
            }
            if (newPath) {
                paths[timeline] = pathData;
            }
        }

        return Object.values(paths).sort(
            (path1, path2) => path2.runs - path1.runs || path2.totalPoints / path2.runs - path1.totalPoints / path1.runs
        );
    }

    static getStandFormUpdate(data, reverse = false) {
        //Anything that has modify next to it means it probably has to be changed next year
        let incUpdate = { standForms: 1 };
        let maxUpdate = {};

        for (const element in data.autoGP) {
            if (data.autoGP[element] > 0) {
                incUpdate[`autoGP.${element}.total`] = data.autoGP[element];
                maxUpdate[`autoGP.${element}.max`] = data.autoGP[element];
            }
        }

        for (const element in data.teleopGP) {
            if (gamePieceFields[element].teleop && data.teleopGP[element] > 0) {
                incUpdate[`teleopGP.${element}.total`] = data.teleopGP[element];
                maxUpdate[`teleopGP.${element}.max`] = data.teleopGP[element];
            }
        }

        incUpdate[`climb.${climbFields[data.climb.attempt].field}`] = 1; //Modify the labels to field object
        if (climbFields[data.climb.attempt].field === climbFields.Success.field) {
            incUpdate[`climb.${climbFields[data.climb.location].field}`] = 1;
            incUpdate[`climb.harmony.total`] = data.climb.harmony;
            maxUpdate[`climb.harmony.max`] = data.climb.harmony;
        } else {
            incUpdate[`climb.park`] = data.climb.park ? 1 : 0;
        }

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
                'fieldAwareness.total': data.fieldAwareness * (reverse ? -1 : 1),
                ampPlayer: data.ampPlayer ? (reverse ? -1 : 1) : 0,
                'ampPlayerGP.highNoteScore.total': data.ampPlayerGP.highNoteScore * (reverse ? -1 : 1),
                'ampPlayerGP.highNoteMiss.total': data.ampPlayerGP.highNoteMiss * (reverse ? -1 : 1)
            },
            maxUpdate: {
                'agility.max': data.agility,
                'fieldAwareness.max': data.fieldAwareness,
                'ampPlayerGP.highNoteScore.max': data.ampPlayerGP.highNoteScore,
                'ampPlayerGP.highNoteMiss.max': data.ampPlayerGP.highNoteMiss
            }
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

        let totalAttempts = ted.climb.success + ted.climb.fail;
        ted.climbSuccessPercentage = totalAttempts === 0 ? null : ted.climb.success / totalAttempts;
        ted.climbSuccessFraction = totalAttempts === 0 ? null : `${ted.climb.success} / ${totalAttempts}`;

        totalAttempts = ted.climb.noAttempt + ted.climb.fail;
        ted.parkSuccessPercentage = totalAttempts === 0 ? null : ted.climb.park / totalAttempts;

        ted.climb.harmony.avg = ted.climb.success === 0 ? 0 : ted.climb.harmony.total / ted.climb.success;

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
            .sort({ [field]: -1 }) // Sort in descending order
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
        ted.agility.avg =
            ted.superForms === 0 && ted.noShows === 0
                ? 0
                : (ted.agility.total + ted.noShows) / (ted.superForms + ted.noShows);
        ted.fieldAwareness.avg =
            ted.superForms === 0 && ted.noShows === 0
                ? 0
                : (ted.fieldAwareness.total + ted.noShows) / (ted.superForms + ted.noShows);

        ted.ampPlayerGP.highNoteScore.avg =
            ted.ampPlayer === 0 ? 0 : ted.ampPlayerGP.highNoteScore.total / ted.ampPlayer;
        ted.ampPlayerGP.highNoteMiss.avg = ted.ampPlayer === 0 ? 0 : ted.ampPlayerGP.highNoteMiss.total / ted.ampPlayer;

        let totalAttempts = ted.ampPlayerGP.highNoteScore.total + ted.ampPlayerGP.highNoteMiss.total;
        ted.highNoteScorePercentage = totalAttempts === 0 ? null : ted.ampPlayerGP.highNoteScore.total / totalAttempts;
        ted.highNoteScoreFraction =
            totalAttempts === 0 ? null : `${ted.ampPlayerGP.highNoteScore.total} / ${totalAttempts}`;
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
            let incUpdate = { $inc: reverseUpdate.incUpdate };

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

    static async updateTEDSuperForm(prevSuperForm, superFormInput) {
        let reverseUpdate = null;
        if (prevSuperForm !== null && prevSuperForm.superStatus === matchFormStatus.complete) {
            reverseUpdate = HelperFunctions.getSuperFormUpdate(prevSuperForm, true);
        }

        let forwardUpdate = null;
        if (superFormInput.superStatus === matchFormStatus.complete) {
            let forwardUpdate = HelperFunctions.getSuperFormUpdate(superFormInput);
        }

        if (
            reverseUpdate !== null &&
            forwardUpdate !== null &&
            prevSuperForm.teamNumber === superFormInput.teamNumber
        ) {
            HelperFunctions.compareMaxUpdates(forwardUpdate.maxUpdate, reverseUpdate.maxUpdate);
            let incUpdate = {
                $inc: HelperFunctions.mergeIncUpdates(forwardUpdate.incUpdate, reverseUpdate.incUpdate)
            };
            await HelperFunctions.updateSuperForm(
                superFormInput.eventKey,
                superFormInput.teamNumber,
                incUpdate,
                forwardUpdate.maxUpdate,
                reverseUpdate.maxUpdate
            );
            return;
        }

        if (reverseUpdate !== null) {
            let incUpdate = { $inc: reverseUpdate.incUpdate };

            await HelperFunctions.updateSuperForm(
                prevSuperForm.eventKey,
                prevSuperForm.teamNumber,
                incUpdate,
                null,
                reverseUpdate.maxUpdate
            );
        }

        if (forwardUpdate !== null) {
            let incUpdate = { $inc: forwardUpdate.incUpdate };

            await HelperFunctions.updateSuperForm(
                superFormInput.eventKey,
                superFormInput.teamNumber,
                incUpdate,
                forwardUpdate.maxUpdate,
                null
            );
        }
    }
}

module.exports = { router, HelperFunctions };

const express = require('express');
const router = express.Router();
const { MatchForm } = require('../models/MatchForm');
const bcrypt = require('bcrypt');
const PitForm = require('../models/PitForm');
const Event = require('../models/Event');
const {
    averageArr,
    medianArr,
    capitalizeFirstLetter,
    getAutoContribution,
    getTeleContribution,
    getDefenseRatings,
    sortMatches,
    getDeepFields,
    roundToWhole,
    convertMatchKeyToString,
    roundToHundredth
} = require('../util/helperFunctions');
const { matchFormStatus } = require('../util/helperConstants');
const { sum, median, mean } = require('mathjs');
const { internalBlueCall } = require('./blueAlliance');

router.use('/getEventData/:eventKey', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.send('Not signed in');
        return;
    }
    let event = await Event.findOne({ key: req.params.eventKey }).lean().exec();
    let teams = event.teams.map((team) => team.number);
    let teamData = {};

    for (let team of teams) {
        let standForms = await MatchForm.find({
            eventKey: req.params.eventKey,
            teamNumber: team,
            standStatus: [matchFormStatus.complete]
        })
            .lean()
            .exec();
        let data = {};
        let fields = ['bottomAuto', 'middleAuto', 'topAuto', 'bottomTele', 'middleTele', 'topTele'];

        for (let field of fields) {
            for (let subField of ['cone', 'cube']) {
                let scored = sum(getDeepFields(standForms, field, `${subField}Scored`));
                let missed = sum(getDeepFields(standForms, field, `${subField}Missed`));
                let result = 'N/A';
                if (scored + missed > 0) {
                    result = `${roundToWhole((scored / (scored + missed)) * 100)}%`;
                }
                data[`${field}${capitalizeFirstLetter(subField)}Accuracy`] = result;
            }
            for (let subField of ['coneScored', 'coneMissed', 'cubeScored', 'cubeMissed']) {
                let arr = getDeepFields(standForms, field, subField);
                data[`average${capitalizeFirstLetter(field)}${capitalizeFirstLetter(subField)}`] = averageArr(arr);
                data[`median${capitalizeFirstLetter(field)}${capitalizeFirstLetter(subField)}`] = medianArr(arr);
            }
        }
        data['averageAutoContribution'] = averageArr(getAutoContribution(standForms));
        data['medianAutoContribution'] = medianArr(getAutoContribution(standForms));
        data['averageTeleContribution'] = averageArr(getTeleContribution(standForms));
        data['medianTeleContribution'] = medianArr(getTeleContribution(standForms));
        data['chargeDockAuto'] =
            standForms.length > 0 ? standForms.filter((e) => e.chargeAuto === 'Dock').length : 'N/A';
        data['chargeEngageAuto'] =
            standForms.length > 0 ? standForms.filter((e) => e.chargeAuto === 'Engage').length : 'N/A';
        data['chargeDockTele'] =
            standForms.length > 0 ? standForms.filter((e) => e.chargeTele === 'Dock').length : 'N/A';
        data['chargeEngageTele'] =
            standForms.length > 0 ? standForms.filter((e) => e.chargeTele === 'Engage').length : 'N/A';

        let superForms = await MatchForm.find({
            eventKey: req.params.eventKey,
            teamNumber: team,
            superStatus: [matchFormStatus.complete]
        })
            .lean()
            .exec();

        data['averageDefenseRating'] = averageArr(getDefenseRatings(superForms));
        data['medianDefenseRating'] = medianArr(getDefenseRatings(superForms));

        teamData[team] = data;
    }
    res.send(teamData);
});

router.use('/getTableauEventData/:eventKey/:password?', async (req, res) => {
    let hasAccess = false;
    if (req.isAuthenticated()) {
        hasAccess = true;
    } else {
        if (req.params.password !== undefined) {
            await bcrypt
                .compare(req.params.password, process.env.TABLEAU_HASH)
                .then((result) => (hasAccess = result))
                .catch((err) => {
                    res.send('Access denied');
                    return;
                });
        }
    }
    if (!hasAccess) {
        res.send('Access denied');
        return;
    } else {
        try {
            let matchForms = await MatchForm.find({
                eventKey: req.params.eventKey,
                standStatus: matchFormStatus.complete
            })
                .lean()
                .exec();
            matchForms = sortMatches(matchForms);
            let matchFormMap = new Map();
            let driveTrainMap = new Map();
            for (let matchForm of matchForms) {
                if (!matchFormMap.has(matchForm.teamNumber)) {
                    matchFormMap.set(matchForm.teamNumber, 1);
                    matchForm.matchIndex = 1;
                    let pitForm = await PitForm.findOne({
                        eventKey: req.params.eventKey,
                        followUp: false,
                        teamNumber: matchForm.teamNumber
                    })
                        .lean()
                        .exec();
                    if (pitForm !== null) {
                        matchForm.driveTrain = pitForm.driveTrain;
                        driveTrainMap.set(matchForm.teamNumber, pitForm.driveTrain);
                    }
                    if (pitForm !== null && pitForm.driveStats !== undefined && pitForm.driveStats.length > 0) {
                        let maxFreeSpeed = null;
                        let maxPushingPower = null;
                        for (let stat of pitForm.driveStats) {
                            if (maxFreeSpeed === null || stat.freeSpeed > maxFreeSpeed) {
                                maxFreeSpeed = stat.freeSpeed;
                            }
                            if (maxPushingPower === null || stat.pushingPower > maxPushingPower) {
                                maxPushingPower = stat.pushingPower;
                            }
                        }
                        matchForm.freeSpeed = maxFreeSpeed;
                        matchForm.pushingPower = maxPushingPower;
                    } else {
                        matchForm.freeSpeed = null;
                        matchForm.pushingPower = null;
                    }
                } else {
                    let matchIndex = matchFormMap.get(matchForm.teamNumber);
                    matchForm.matchIndex = matchIndex + 1;
                    matchFormMap.set(matchForm.teamNumber, matchIndex + 1);
                    matchForm.driveTrain = driveTrainMap.get(matchForm.teamNumber);
                }
            }

            res.send(matchForms);
        } catch (err) {
            res.send(err);
        }
    }
});

router.use('/getMedianMatches/:eventKey', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.send('Not signed in');
        return;
    }
    let standForms = await MatchForm.find({ eventKey: req.params.eventKey, standStatus: [matchFormStatus.complete] })
        .lean()
        .exec();
    let medianScores = [];
    let teamNumbers = Array.from(new Set(standForms.map((standForm) => standForm.teamNumber))).sort((a, b) => a - b);
    for (let teamNumber of teamNumbers) {
        let teamStandForms = standForms.filter((standForm) => standForm.teamNumber === teamNumber);
        teamStandForms.forEach((standForm) => {
            let totalScore = 0;
            totalScore += standForm.bottomAuto.coneScored * 3;
            totalScore += standForm.bottomAuto.cubeScored * 3;
            totalScore += standForm.middleAuto.coneScored * 4;
            totalScore += standForm.middleAuto.cubeScored * 4;
            totalScore += standForm.topAuto.coneScored * 6;
            totalScore += standForm.topAuto.cubeScored * 6;
            totalScore += standForm.crossCommunity ? 3 : 0;
            totalScore += standForm.chargeAuto === 'Dock' ? 8 : standForm.chargeAuto === 'Engage' ? 12 : 0;
            totalScore += standForm.bottomTele.coneScored * 2;
            totalScore += standForm.bottomTele.cubeScored * 2;
            totalScore += standForm.middleTele.coneScored * 3;
            totalScore += standForm.middleTele.cubeScored * 3;
            totalScore += standForm.topTele.coneScored * 5;
            totalScore += standForm.topTele.cubeScored * 5;
            totalScore += standForm.chargeTele === 'Dock' ? 6 : standForm.chargeTele === 'Engage' ? 10 : 0;
            standForm.totalScore = totalScore;
        });
        let allMatchScores = teamStandForms.map((standForm) => standForm.totalScore).sort((a, b) => a - b);
        let halfIndex = Math.floor(allMatchScores.length / 2);
        let matchScores = allMatchScores.slice(halfIndex);
        let medianScore = matchScores[Math.floor(matchScores.length / 2)];
        let medianStandForm = teamStandForms.find((standForm) => standForm.totalScore === medianScore);
        medianScores.push({
            teamNumber: medianStandForm.teamNumber,
            matchNumber: convertMatchKeyToString(medianStandForm.matchNumber),
            medianScore: medianScore,
            matchScores: allMatchScores
        });
    }
    res.send(medianScores);
});

router.use('/getEventAccuracy/:eventKey', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.send('Not signed in');
        return;
    }
    let standForms = await MatchForm.find({
        eventKey: req.params.eventKey,
        standStatus: [matchFormStatus.complete, matchFormStatus.noShow]
    })
        .lean()
        .exec();
    let blueAllianceForms = await internalBlueCall(`/event/${req.params.eventKey}/matches`);
    if (blueAllianceForms.Error) {
        res.send(blueAllianceForms);
        return;
    }

    let accuracyData = [];
    let autoErrors = 0;
    let mobilityErrors = 0;
    let autoChargeErrors = 0;
    let teleErrors = 0;
    let teleChargeErrors = 0;
    let accuracies = [];
    for (let blueAllianceForm of blueAllianceForms) {
        let object = {
            matchNumber: convertMatchKeyToString(blueAllianceForm.key.split('_')[1]),
            matchKey: blueAllianceForm.key.split('_')[1]
        };
        let filteredStandForms = standForms.filter((standForm) => standForm.matchNumber === object.matchKey);

        let redStandForms = filteredStandForms.filter((standForm) => standForm.station.charAt(0) === 'r');
        let scoutedAutoPoints = 0;
        let scoutedMobilityPoints = 0;
        let scoutedAutoChargePoints = 0;
        let scoutedTelePoints = 0;
        let scoutedTeleChargePoints = 0;
        let scoreBreakdown = blueAllianceForm.score_breakdown?.red;
        if (!scoreBreakdown) {
            continue;
        }
        let teamNumbers = blueAllianceForm.alliances.red.team_keys.map((teamNumber) => teamNumber.substring(3));
        let errorsObject = { [teamNumbers[0]]: {}, [teamNumbers[1]]: {}, [teamNumbers[2]]: {} };
        for (let redForm of redStandForms) {
            let index = teamNumbers.indexOf(redForm.teamNumber.toString());
            if (index === -1) {
                continue;
            }
            index += 1;
            scoutedAutoPoints += redForm.bottomAuto.coneScored * 3;
            scoutedAutoPoints += redForm.bottomAuto.cubeScored * 3;
            scoutedAutoPoints += redForm.middleAuto.coneScored * 4;
            scoutedAutoPoints += redForm.middleAuto.cubeScored * 4;
            scoutedAutoPoints += redForm.topAuto.coneScored * 6;
            scoutedAutoPoints += redForm.topAuto.cubeScored * 6;
            scoutedMobilityPoints += redForm.crossCommunity ? 3 : 0;
            let trueMobility = scoreBreakdown[`mobilityRobot${index}`];
            let scoutedMobility = redForm.crossCommunity ? 'Yes' : 'No';
            if (scoutedMobility !== trueMobility) {
                errorsObject[redForm.teamNumber].mobility = {
                    scouted: scoutedMobility,
                    true: scoreBreakdown[`mobilityRobot${index}`]
                };
                mobilityErrors += 1;
            }
            scoutedAutoChargePoints += redForm.chargeAuto === 'Dock' ? 8 : redForm.chargeAuto === 'Engage' ? 12 : 0;
            let trueAutoCharge = scoreBreakdown[`autoChargeStationRobot${index}`];
            if (trueAutoCharge === 'Docked') {
                if (scoreBreakdown[`autoBridgeState`] === 'Level') {
                    trueAutoCharge = 'Engage';
                } else {
                    trueAutoCharge = 'Dock';
                }
            }
            let scoutedChargeAuto = ['No Attempt', 'Fail', null].includes(redForm.chargeAuto)
                ? 'None'
                : redForm.chargeAuto;
            if (scoutedChargeAuto !== trueAutoCharge) {
                errorsObject[redForm.teamNumber].autoChargeStation = {
                    scouted: redForm.chargeAuto,
                    true: trueAutoCharge
                };
                autoChargeErrors += 1;
            }
            scoutedTelePoints += redForm.bottomTele.coneScored * 2;
            scoutedTelePoints += redForm.bottomTele.cubeScored * 2;
            scoutedTelePoints += redForm.middleTele.coneScored * 3;
            scoutedTelePoints += redForm.middleTele.cubeScored * 3;
            scoutedTelePoints += redForm.topTele.coneScored * 5;
            scoutedTelePoints += redForm.topTele.cubeScored * 5;
            scoutedTeleChargePoints += redForm.chargeTele === 'Dock' ? 6 : redForm.chargeTele === 'Engage' ? 10 : 0;
            let trueTeleCharge = scoreBreakdown[`endGameChargeStationRobot${index}`];
            if (trueTeleCharge === 'Docked') {
                if (scoreBreakdown[`endGameBridgeState`] === 'Level') {
                    trueTeleCharge = 'Engage';
                } else {
                    trueTeleCharge = 'Dock';
                }
            } else {
                trueTeleCharge = 'None';
            }
            let scoutedChargeTele = ['No Attempt', 'Fail', null].includes(redForm.chargeTele)
                ? 'None'
                : redForm.chargeTele;
            if (scoutedChargeTele !== trueTeleCharge) {
                errorsObject[redForm.teamNumber].teleChargeStation = {
                    scouted: redForm.chargeTele,
                    true: trueTeleCharge
                };
                teleChargeErrors += 1;
            }
        }
        if (redStandForms.length > 0) {
            overallErrors = [];
            if (scoreBreakdown.autoGamePiecePoints !== scoutedAutoPoints) {
                overallErrors.push('Auto Game Pieces');
                autoErrors++;
            }
            if (scoreBreakdown.teleopGamePiecePoints !== scoutedTelePoints) {
                overallErrors.push('Tele Game Pieces');
                teleErrors++;
            }
            let actualScore =
                scoreBreakdown.totalPoints -
                scoreBreakdown.endGameParkPoints -
                scoreBreakdown.foulPoints -
                scoreBreakdown.linkPoints;
            let scoutedScore =
                scoutedAutoPoints +
                scoutedMobilityPoints +
                scoutedAutoChargePoints +
                scoutedTelePoints +
                scoutedTeleChargePoints;
            let accuarcy = (1 - Math.abs((scoutedScore - actualScore) / actualScore)) * 100;
            if (redStandForms.length === 3) {
                accuracies.push(accuarcy);
            }
            errorsObject.other = overallErrors;
            object.red = {
                actualScore: actualScore,
                scoutedScore: scoutedScore,
                accuarcy: `${roundToHundredth(accuarcy)}%`,
                errors: errorsObject
            };
        }

        let blueStandForms = filteredStandForms.filter((standForm) => standForm.station.charAt(0) === 'b');
        scoutedAutoPoints = 0;
        scoutedMobilityPoints = 0;
        scoutedAutoChargePoints = 0;
        scoutedTelePoints = 0;
        scoutedTeleChargePoints = 0;
        scoreBreakdown = blueAllianceForm.score_breakdown?.blue;
        if (!scoreBreakdown) {
            continue;
        }
        teamNumbers = blueAllianceForm.alliances.blue.team_keys.map((teamNumber) => teamNumber.substring(3));
        errorsObject = { [teamNumbers[0]]: {}, [teamNumbers[1]]: {}, [teamNumbers[2]]: {} };
        for (let blueForm of blueStandForms) {
            let index = teamNumbers.indexOf(blueForm.teamNumber.toString());
            if (index === -1) {
                continue;
            }
            index += 1;
            scoutedAutoPoints += blueForm.bottomAuto.coneScored * 3;
            scoutedAutoPoints += blueForm.bottomAuto.cubeScored * 3;
            scoutedAutoPoints += blueForm.middleAuto.coneScored * 4;
            scoutedAutoPoints += blueForm.middleAuto.cubeScored * 4;
            scoutedAutoPoints += blueForm.topAuto.coneScored * 6;
            scoutedAutoPoints += blueForm.topAuto.cubeScored * 6;
            scoutedMobilityPoints += blueForm.crossCommunity ? 3 : 0;
            let trueMobility = scoreBreakdown[`mobilityRobot${index}`];
            let scoutedMobility = blueForm.crossCommunity ? 'Yes' : 'No';
            if (scoutedMobility !== trueMobility) {
                errorsObject[blueForm.teamNumber].mobility = {
                    scouted: scoutedMobility,
                    true: scoreBreakdown[`mobilityRobot${index}`]
                };
                mobilityErrors += 1;
            }
            scoutedAutoChargePoints += blueForm.chargeAuto === 'Dock' ? 8 : blueForm.chargeAuto === 'Engage' ? 12 : 0;
            let trueAutoCharge = scoreBreakdown[`autoChargeStationRobot${index}`];
            if (trueAutoCharge === 'Docked') {
                if (scoreBreakdown[`autoBridgeState`] === 'Level') {
                    trueAutoCharge = 'Engage';
                } else {
                    trueAutoCharge = 'Dock';
                }
            }
            let scoutedChargeAuto = ['No Attempt', 'Fail', null].includes(blueForm.chargeAuto)
                ? 'None'
                : blueForm.chargeAuto;
            if (scoutedChargeAuto !== trueAutoCharge) {
                errorsObject[blueForm.teamNumber].autoChargeStation = {
                    scouted: blueForm.chargeAuto,
                    true: trueAutoCharge
                };
                autoChargeErrors += 1;
            }
            scoutedTelePoints += blueForm.bottomTele.coneScored * 2;
            scoutedTelePoints += blueForm.bottomTele.cubeScored * 2;
            scoutedTelePoints += blueForm.middleTele.coneScored * 3;
            scoutedTelePoints += blueForm.middleTele.cubeScored * 3;
            scoutedTelePoints += blueForm.topTele.coneScored * 5;
            scoutedTelePoints += blueForm.topTele.cubeScored * 5;
            scoutedTeleChargePoints += blueForm.chargeTele === 'Dock' ? 6 : blueForm.chargeTele === 'Engage' ? 10 : 0;
            let trueTeleCharge = scoreBreakdown[`endGameChargeStationRobot${index}`];
            if (trueTeleCharge === 'Docked') {
                if (scoreBreakdown[`endGameBridgeState`] === 'Level') {
                    trueTeleCharge = 'Engage';
                } else {
                    trueTeleCharge = 'Dock';
                }
            } else {
                trueTeleCharge = 'None';
            }
            let scoutedChargeTele = ['No Attempt', 'Fail', null].includes(blueForm.chargeTele)
                ? 'None'
                : blueForm.chargeTele;
            if (scoutedChargeTele !== trueTeleCharge) {
                errorsObject[blueForm.teamNumber].teleChargeStation = {
                    scouted: blueForm.chargeTele,
                    true: trueTeleCharge
                };
                teleChargeErrors += 1;
            }
        }
        if (blueStandForms.length > 0) {
            overallErrors = [];
            if (scoreBreakdown.autoGamePiecePoints !== scoutedAutoPoints) {
                overallErrors.push('Auto Game Pieces');
                autoErrors++;
            }
            if (scoreBreakdown.teleopGamePiecePoints !== scoutedTelePoints) {
                overallErrors.push('Tele Game Pieces');
                teleErrors++;
            }
            let actualScore =
                scoreBreakdown.totalPoints -
                scoreBreakdown.endGameParkPoints -
                scoreBreakdown.foulPoints -
                scoreBreakdown.linkPoints;
            let scoutedScore =
                scoutedAutoPoints +
                scoutedMobilityPoints +
                scoutedAutoChargePoints +
                scoutedTelePoints +
                scoutedTeleChargePoints;
            let accuarcy = (1 - Math.abs((scoutedScore - actualScore) / actualScore)) * 100;
            if (blueStandForms.length === 3) {
                accuracies.push(accuarcy);
            }
            errorsObject.other = overallErrors;
            object.blue = {
                actualScore: actualScore,
                scoutedScore: scoutedScore,
                accuarcy: `${roundToHundredth(accuarcy)}%`,
                errors: errorsObject
            };
        }

        accuracyData.push(object);
    }
    accuracyData = sortMatches(accuracyData, 'matchKey', false);
    let scoreDifferences = [];
    accuracyData.forEach((data) => {
        if (data.red) scoreDifferences.push(Math.abs(data.red.actualScore - data.red.scoutedScore));
        if (data.blue) scoreDifferences.push(Math.abs(data.blue.actualScore - data.blue.scoutedScore));
    });
    let object = {
        autoErrors: autoErrors,
        mobilityErrors: mobilityErrors,
        autoChargeErrors: autoChargeErrors,
        teleErrors: teleErrors,
        teleChargeErrors: teleChargeErrors,
        averageAccuracy: accuracies.length > 0 ? roundToHundredth(mean(accuracies)) : 'N/A',
        medianAccuracy: accuracies.length > 0 ? roundToHundredth(median(accuracies)) : 'N/A',
        averageScoreDiff: scoreDifferences.length > 0 ? roundToHundredth(mean(scoreDifferences)) : 'N/A',
        medianScoreDiff: scoreDifferences.length > 0 ? roundToHundredth(median(scoreDifferences)) : 'N/A'
    };
    accuracyData.push(object);
    res.send(accuracyData);
});

module.exports = router;

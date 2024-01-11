import { capitalizeFirstLetter, getDeepFields, roundToWhole } from './helperFunctions';
import { mode, sum } from 'mathjs';

export function getStartingPoints(arr, scale, redOffset, blueOffset) {
    let data = [];
    arr.forEach((e) => {
        let offset = e.station.charAt(0) === 'r' ? redOffset : blueOffset;
        data.push({
            _id: e.startingPosition._id,
            x: (e.startingPosition.x + offset.x) * scale,
            y: (e.startingPosition.y + offset.y) * scale,
            bottomConeAuto: e.bottomAuto.coneScored,
            bottomCubeAuto: e.bottomAuto.cubeScored,
            middleConeAuto: e.middleAuto.coneScored,
            middleCubeAuto: e.middleAuto.cubeScored,
            topConeAuto: e.topAuto.coneScored,
            topCubeAuto: e.topAuto.cubeScored,
            chargePoints: e.chargeAuto === 'Dock' ? 8 : e.chargeAuto === 'Engage' ? 12 : 0,
            crossCommunity: e.crossCommunity ? 3 : 0
        });
    });
    return data;
}

export function getFractionForChargeTele(arr) {
    let totalCharges = 0;
    let successfulDock = 0;
    let successfulEngage = 0;
    arr.forEach((a) => {
        if (a['chargeTele'] !== 'No Attempt') {
            totalCharges += 1;
            successfulDock += a['chargeTele'] === 'Dock' ? 1 : 0;
            successfulEngage += a['chargeTele'] === 'Engage' ? 1 : 0;
        }
    });
    if (totalCharges === 0) {
        return 'No Attempts';
    }
    return `[${successfulDock} Dock + ${successfulEngage} Engage] / ${totalCharges}`;
}

export function getAutoContribution(arr) {
    return arr.map((match) => {
        let total = 0;
        total += match.crossCommunity ? 3 : 0;
        total += match.bottomAuto.coneScored * 3;
        total += match.middleAuto.coneScored * 4;
        total += match.topAuto.coneScored * 6;
        total += match.bottomAuto.cubeScored * 3;
        total += match.middleAuto.cubeScored * 4;
        total += match.topAuto.cubeScored * 6;
        if (match.chargeAuto === 'Dock') {
            total += 8;
        } else if (match.chargeAuto === 'Engage') {
            total += 12;
        }
        return total;
    });
}

export function getTeleContribution(arr) {
    return arr.map((match) => {
        let total = 0;
        total += match.bottomTele.coneScored * 2;
        total += match.middleTele.coneScored * 3;
        total += match.topTele.coneScored * 5;
        total += match.bottomTele.cubeScored * 2;
        total += match.middleTele.cubeScored * 3;
        total += match.topTele.cubeScored * 5;
        if (match.chargeTele === 'Dock') {
            total += 6;
        } else if (match.chargeTele === 'Engage') {
            total += 10;
        }
        return total;
    });
}

export function getSuccessfulClimbTimes(arr) {
    return arr.filter((a) => a.climbTime > 0 && a.climbRung !== 'Failed').map((a) => a['climbTime']);
}

export function getSucessfulClimbRungMode(arr) {
    let filteredArr = arr.filter((a) => a.climbTime > 0 && a.climbRung !== 'Failed').map((a) => a['climbRung']);
    if (filteredArr.length === 0) {
        return 'N/A';
    }
    return mode(filteredArr).join(', ');
}

export function getAccuarcy(data, gamePhase, row, gamePiece) {
    gamePhase = capitalizeFirstLetter(gamePhase);
    let scored = data[`${row}${gamePhase}`][`${gamePiece}Scored`];
    let missed = data[`${row}${gamePhase}`][`${gamePiece}Missed`];
    if (scored + missed === 0) {
        return 'N/A';
    }
    return `${roundToWhole((scored / (scored + missed)) * 100)}%`;
}

export function getTotalAccuarcy(data, gamePhase, row, gamePiece) {
    gamePhase = capitalizeFirstLetter(gamePhase);
    let scored = sum(getDeepFields(data, `${row}${gamePhase}`, `${gamePiece}Scored`));
    let missed = sum(getDeepFields(data, `${row}${gamePhase}`, `${gamePiece}Missed`));
    if (scored + missed === 0) {
        return 'N/A';
    }
    return `${roundToWhole((scored / (scored + missed)) * 100)}%`;
}

export function getHubPercentage(arr, gameStage) {
    let totalMissed = 0;
    arr.forEach((a) => (totalMissed += a[`missed${gameStage}`]));
    let totalScored = 0;
    arr.forEach((a) => {
        totalScored += a[`lowerCargo${gameStage}`];
        totalScored += a[`upperCargo${gameStage}`];
    });
    return totalScored / (totalMissed + totalScored);
}

import { mode, mean, sum } from 'mathjs';

export function sortRegisteredEvents(events) {
    let modifiedEvents = [...events];
    return modifiedEvents.sort((a, b) => {
        let delta = new Date(a.startDate) - new Date(b.startDate);
        if (delta === 0) {
            delta = new Date(a.endDate) - new Date(b.endDate);
            if (delta === 0) {
                delta = a.name.localeCompare(b.name);
            }
        }
        return delta;
    });
}

export function sortBlueAllianceEvents(events) {
    return events.sort((a, b) => {
        let delta = new Date(a.start_date) - new Date(b.start_date);
        if (delta === 0) {
            delta = new Date(a.end_date) - new Date(b.end_date);
            if (delta === 0) {
                delta = a.name.localeCompare(b.name);
            }
        }
        return delta;
    });
}

export function sortMatches(matches, field = 'matchNumber', compareStations = true) {
    let matchTypes = { q: 0, s: 1, f: 2 };
    return matches.sort((a, b) => {
        let matchTypeA = matchTypes[a[field].charAt(0)];
        let matchTypeB = matchTypes[b[field].charAt(0)];
        let typeDifference = matchTypeA - matchTypeB;
        if (typeDifference === 0) {
            let endIndex = matchTypeA === 0 ? 5 : 4;
            let matchNumberDifference = a[field].substring(2, endIndex).replace(/[^0-9]/g, '') - b[field].substring(2, endIndex).replace(/[^0-9]/g, '');
            if (matchNumberDifference === 0 && compareStations) {
                return a.station.charAt(0) === b.station.charAt(0) ? a.station.charAt(1) - b.station.charAt(1) : a.station.charAt(0) < b.station.charAt(0) ? 1 : -1;
            } else {
                return matchNumberDifference;
            }
        } else {
            return typeDifference;
        }
    });
}

export function convertMatchKeyToString(matchKey) {
    switch (matchKey.substring(0, 2)) {
        case 'qm':
            return `Quals ${matchKey.substring(2)}`;
        case 'sf':
            let matchNumber = parseInt(matchKey.substring(2, 4));
            let roundNumber;
            if (matchNumber <= 8) {
                roundNumber = Math.floor((parseInt(matchKey.substring(2, 4)) + 3) / 4);
            } else {
                roundNumber = Math.floor((parseInt(matchKey.substring(2, 4)) - 3) / 2);
            }
            return `Round ${roundNumber} Match ${matchNumber}`;
        default:
            return `Finals ${matchKey.substring(3)}`;
    }
}

export function convertStationKeyToString(stationKey) {
    switch (stationKey.charAt(0)) {
        case 'r':
            return `Red ${stationKey.charAt(1)}`;
        default:
            return `Blue ${stationKey.charAt(1)}`;
    }
}

export function joinStandAndSuperForms(standForms, superForms) {
    let combinedForms = [];
    for (let i = 0; i < standForms.length; ) {
        let standForm = standForms[i];
        let found = false;
        for (let j = 0; j < superForms.length; ) {
            let superForm = superForms[j];
            if (standForm.eventKey === superForm.eventKey && standForm.matchNumber === superForm.matchNumber && standForm.station === superForm.station) {
                let combined = { ...standForm, ...superForm };
                combinedForms.push(combined);
                standForms.splice(i, 1);
                superForms.splice(j, 1);
                found = true;
                break;
            } else {
                j++;
            }
        }
        if (!found) {
            combinedForms.push({ ...standForm });
            i++;
        }
    }

    combinedForms = combinedForms.concat(superForms);
    return combinedForms;
}

export function getFields(arr, field) {
    return arr.map((a) => a[field]);
}

export function getDeepFields(arr, field1, field2) {
    return arr.map((a) => a[field1][field2]);
}

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

export const medianArr = (x) => {
    if (x.length === 0) {
        return 'N/A';
    }
    let sortedx = x.sort((a, b) => a - b);
    let halfIndex = Math.floor(sortedx.length / 2);

    return sortedx.length % 2 ? sortedx[Math.floor(sortedx.length / 2.0)] : (sortedx[halfIndex - 1] + sortedx[halfIndex]) / 2.0;
};

export const averageArr = (x, round = true, roundToHundredthBoolean = true) => {
    if (x.length === 0) {
        return 'N/A';
    }
    return round ? (roundToHundredthBoolean ? roundToHundredth(mean(x)) : roundToTenth(mean(x))) : mean(x);
};

export function getPercentageForTFField(arr, field) {
    let total = 0;
    arr.forEach((a) => (total += a[field]));
    return total / arr.length;
}

export function countOccurencesForTFField(arr, field) {
    let total = 0;
    arr.forEach((a) => (total += a[field]));
    return total;
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

export function getDefenseRatings(arr) {
    return arr.filter((a) => a.defenseRating > 0).map((a) => a['defenseRating']);
}

export function getDefenseAllocation(arr) {
    return arr.filter((a) => a.defenseRating > 0).map((a) => a['defenseAllocation']);
}

export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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

export function roundToHundredth(value) {
    const stringValue = value.toString();
    return Number(stringValue).toFixed(2);
}

export function roundToTenth(value) {
    const stringValue = value.toString();
    return parseFloat(Number(stringValue).toFixed(1));
}

export function roundToWhole(value) {
    return Number(value.toFixed());
}

export function deepEqual(object1, object2) {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);
    if (keys1.length !== keys2.length) {
        return false;
    }
    for (const key of keys1) {
        const val1 = object1[key];
        const val2 = object2[key];
        const areObjects = isObject(val1) && isObject(val2);
        if ((areObjects && !deepEqual(val1, val2)) || (!areObjects && val1 !== val2)) {
            console.log(key);
            return false;
        }
    }
    return true;
}

export function isObject(object) {
    return object != null && typeof object === 'object';
}

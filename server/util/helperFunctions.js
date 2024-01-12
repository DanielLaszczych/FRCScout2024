const { mean } = require('mathjs');
const Event = require('../models/Event');
const { teamNumber } = require('./helperConstants');

class HelperFunction {
    static sortMatches(matches, field = 'matchNumber', compareStations = true) {
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

    static convertMatchKeyToString(matchKey) {
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

    static roundToTenth(value) {
        const stringValue = value.toString();
        return parseFloat(Number(stringValue).toFixed(1));
    }

    static roundToHundredth(value) {
        const stringValue = value.toString();
        return Number(stringValue).toFixed(2);
    }

    static roundToWhole(value) {
        return Number(value.toFixed());
    }

    static getFields(arr, field) {
        return arr.map((a) => a[field]);
    }

    static getDeepFields(arr, field1, field2) {
        return arr.map((a) => a[field1][field2]);
    }

    static getStartingPoints(arr, scale, redOffset, blueOffset) {
        let data = [];
        arr.forEach((e) => {
            let offset = e.station.charAt(0) === 'r' ? redOffset : blueOffset;
            data.push({
                _id: e.startingPosition._id,
                x: (e.startingPosition.x + offset.x) * scale,
                y: (e.startingPosition.y + offset.y) * scale,
                bottomConeAuto: e.bottomConeAuto,
                bottomCubeAuto: e.bottomCubeAuto,
                middleConeAuto: e.middleConeAuto,
                middleCubeAuto: e.middleCubeAuto,
                topConeAuto: e.topConeAuto,
                topCubeAuto: e.topCubeAuto
            });
        });
        return data;
    }

    static medianArr(x) {
        if (x.length === 0) {
            return 'N/A';
        }
        let sortedx = x.sort((a, b) => a - b);
        let halfIndex = Math.floor(sortedx.length / 2);

        return sortedx.length % 2 ? sortedx[Math.floor(sortedx.length / 2.0)] : (sortedx[halfIndex - 1] + sortedx[halfIndex]) / 2.0;
    }

    static averageArr(x, round = true, roundToHundredthBoolean = false) {
        if (x.length === 0) {
            return 'N/A';
        }
        return round ? (roundToHundredthBoolean ? HelperFunction.roundToHundredth(mean(x)) : HelperFunction.roundToTenth(mean(x))) : mean(x);
    }

    static getPercentageForTFField(arr, field) {
        let total = 0;
        arr.forEach((a) => (total += a[field]));
        return total / arr.length;
    }

    static countOccurencesForTFField(arr, field) {
        let total = 0;
        arr.forEach((a) => (total += a[field]));
        return total;
    }

    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    static getAutoContribution(arr) {
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

    static getTeleContribution(arr) {
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

    static getDefenseRatings(arr) {
        return arr.filter((a) => a.defenseRating > 0).map((a) => a['defenseRating']);
    }
}

module.exports = HelperFunction;

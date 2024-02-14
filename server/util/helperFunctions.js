const { mean } = require('mathjs');
const Event = require('../models/Event');
const { teamNumber } = require('./helperConstants');

class HelperFunctions {
    static sortMatches(matches, field = 'matchNumber', compareStations = true) {
        let matchTypes = { q: 0, s: 1, f: 2 };
        return matches.sort((a, b) => {
            let matchTypeA = matchTypes[a[field].charAt(0)];
            let matchTypeB = matchTypes[b[field].charAt(0)];
            let typeDifference = matchTypeA - matchTypeB;
            if (typeDifference === 0) {
                let endIndex = matchTypeA === 0 ? 5 : 4;
                let matchNumberDifference =
                    a[field].substring(2, endIndex).replace(/[^0-9]/g, '') -
                    b[field].substring(2, endIndex).replace(/[^0-9]/g, '');
                if (matchNumberDifference === 0 && compareStations) {
                    return a.station.charAt(0) === b.station.charAt(0)
                        ? a.station.charAt(1) - b.station.charAt(1)
                        : a.station.charAt(0) < b.station.charAt(0)
                        ? 1
                        : -1;
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
            case 'pm':
                return `Practice ${matchKey.substring(2)}`;
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

    static medianArr(x) {
        if (x.length === 0) {
            return 'N/A';
        }
        let sortedx = x.sort((a, b) => a - b);
        let halfIndex = Math.floor(sortedx.length / 2);

        return sortedx.length % 2
            ? sortedx[Math.floor(sortedx.length / 2.0)]
            : (sortedx[halfIndex - 1] + sortedx[halfIndex]) / 2.0;
    }

    static averageArr(x, round = true, roundToHundredthBoolean = false) {
        if (x.length === 0) {
            return 'N/A';
        }
        return round
            ? roundToHundredthBoolean
                ? HelperFunctions.roundToHundredth(mean(x))
                : HelperFunctions.roundToTenth(mean(x))
            : mean(x);
    }

    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    static leafGet = (obj, path) => path.split('.').reduce((value, el) => value[el], obj);

    static leafSet = (obj, path, value) => {
        let deepObj = obj;
        let paths = path.split('.');
        if (paths.length === 1) {
            deepObj[paths[0]] = value;
        } else {
            for (let i = 0; i < paths.length; i++) {
                if (i === paths.length - 1) {
                    deepObj[paths[i]] = value;
                } else {
                    deepObj = deepObj[paths[i]];
                }
            }
        }
    };
}

module.exports = HelperFunctions;

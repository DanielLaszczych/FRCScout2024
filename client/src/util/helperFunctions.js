import { mean } from 'mathjs';
import { cacheName } from './helperConstants';

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

export async function fetchDataAndCache(url) {
    try {
        if (!navigator.onLine) throw Error;
        // Try fetching from the network
        const response = await fetch(url);

        // If successful, clone the response and store it in the cache
        const cache = await caches.open(cacheName);
        await cache.put(url, response.clone());

        // Return the original response
        return response;
    } catch (error) {
        // If network request fails, try to retrieve the response from the cache
        const cacheResponse = await caches.match(url);

        if (cacheResponse) {
            // If cached response exists, return it
            return cacheResponse;
        } else {
            // If neither network nor cache is available, handle the error
            console.error('Error fetching data:', error);
            throw error;
        }
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

export function getDefenseRatings(arr) {
    return arr.filter((a) => a.defenseRating > 0).map((a) => a['defenseRating']);
}

export function getDefenseAllocation(arr) {
    return arr.filter((a) => a.defenseRating > 0).map((a) => a['defenseAllocation']);
}

export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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

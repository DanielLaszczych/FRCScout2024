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

// Two types of dates because blue alliance stores it as start_date and I do startDate
export function sortEvents(events) {
    return events.sort((a, b) => {
        let delta = new Date(a.start_date || a.startDate) - new Date(b.start_date || b.startDate);
        if (delta === 0) {
            delta = new Date(a.end_date || a.endDate) - new Date(b.end_date || b.endDate);
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

export function convertMatchKeyToString(matchKey, splitRoundAndMatch = false) {
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
            return `Round ${roundNumber}${splitRoundAndMatch ? '\n' : ' '}Match ${matchNumber}`;
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

export function shortenScouterName(name) {
    return `${name.split(' ')[0]} ${name.split(' ')[1].charAt(0)}.`;
}

export async function fetchAndCache(url) {
    try {
        if (!navigator.onLine || localStorage.getItem('Offline') === 'true') throw Error;
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

export function getValueByRange(inputValue, values = [0.85, 0.85, 0.66, 0.5]) {
    // Define your ranges and associated values
    const ranges = [
        { min: 0, max: 479, value: values[0] },
        { min: 480, max: 767, value: values[1] },
        { min: 768, max: 991, value: values[2] },
        { min: 992, max: 1920, value: values[3] }
    ];

    // Find the range for the given input value
    inputValue = Math.round(inputValue);
    const selectedRange = ranges.find((range) => inputValue >= range.min && inputValue <= range.max);

    // Return the associated value or a default value if no range is found
    return selectedRange ? selectedRange.value : values[3];
}

export function joinStandAndSuperForms(standForms, superForms) {
    let combinedForms = [];
    for (let i = 0; i < standForms.length; ) {
        let standForm = standForms[i];
        let found = false;
        for (let j = 0; j < superForms.length; ) {
            let superForm = superForms[j];
            if (
                standForm.eventKey === superForm.eventKey &&
                standForm.matchNumber === superForm.matchNumber &&
                standForm.station === superForm.station
            ) {
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

export const medianArr = (x) => {
    if (x.length === 0) {
        return 'N/A';
    }
    let sortedx = x.sort((a, b) => a - b);
    let halfIndex = Math.floor(sortedx.length / 2);

    return sortedx.length % 2
        ? sortedx[Math.floor(sortedx.length / 2.0)]
        : (sortedx[halfIndex - 1] + sortedx[halfIndex]) / 2.0;
};

export const averageArr = (x, round = true, roundToHundredthBoolean = true) => {
    if (x.length === 0) {
        return 'N/A';
    }
    return round ? (roundToHundredthBoolean ? roundToHundredth(mean(x)) : roundToTenth(mean(x))) : mean(x);
};

export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function camelToFlat(string) {
    string = string.replace(/[A-Z]/g, ' $&');
    return string[0].toUpperCase() + string.slice(1);
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
            return false;
        }
    }
    return true;
}

export function isObject(object) {
    return object != null && typeof object === 'object';
}

export const leafGet = (obj, path) => path.split('.').reduce((value, el) => value[el], obj);

// https://gist.github.com/mlocati/7210513
export function perc2color(perc) {
    perc = perc * 100;
    var r,
        g,
        b = 0;
    if (perc < 50) {
        r = 255;
        g = Math.round(5.1 * perc);
    } else {
        g = 255;
        r = Math.round(510 - 5.1 * perc);
    }
    var h = r * 0x10000 + g * 0x100 + b * 0x1;
    return '#' + ('000000' + h.toString(16)).slice(-6);
}

export function checksum(s) {
    var chk = 0x12345678;
    var len = s.length;
    for (var i = 0; i < len; i++) {
        chk += s.charCodeAt(i) * (i + 1);
    }

    return (chk & 0xffffffff).toString(16);
}

const express = require('express');
const { teamNumber } = require('../util/helperConstants');
const { sortMatches } = require('../util/helperFunctions');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

router.use('/getEventsCustom/:year', (req, res) => {
    if (req.isUnauthenticated()) {
        res.send('Not signed in');
        return;
    }
    fetch(`https://www.thebluealliance.com/api/v3/events/${req.params.year}?X-TBA-Auth-Key=${process.env.BLUEALLIANCE_API_KEY}`)
        .then((response) => response.json())
        .then((data) => {
            if (!data.Error) {
                let optimizedData = data.map((event) => ({
                    name: event.name,
                    key: event.key,
                    week: event.week,
                    event_type_string: event.event_type_string,
                    start_date: event.start_date,
                    end_date: event.end_date,
                    year: event.year
                }));
                res.send(optimizedData);
            } else {
                res.send(data);
            }
        })
        .catch((err) => {
            res.send(err);
        });
});

router.use('/isFutureAlly/:eventKey/:teamNumber/:currentMatch/:allowPlayed', async (req, res) => {
    if (req.isUnauthenticated()) {
        res.send('Not signed in');
        return;
    }
    let isAlly = await isFutureAlly(req.params.eventKey, req.params.teamNumber, req.params.currentMatch, req.params.allowPlayed === 'true');
    res.send(Boolean(isAlly));
});

router.use('/:apiCall(*)', (req, res) => {
    if (req.isUnauthenticated()) {
        res.send('Not signed in');
        return;
    }
    fetch(`https://www.thebluealliance.com/api/v3/${req.params.apiCall}?X-TBA-Auth-Key=${process.env.BLUEALLIANCE_API_KEY}`)
        .then((response) => response.json())
        .then((data) => {
            if (!data.Error) {
                res.send(data);
            } else {
                res.send(data);
            }
        })
        .catch((err) => {
            res.send(err);
        });
});

const internalBlueCall = (apiCall) => {
    return new Promise((resolve, reject) => {
        fetch(`https://www.thebluealliance.com/api/v3/${apiCall}?X-TBA-Auth-Key=${process.env.BLUEALLIANCE_API_KEY}`)
            .then((response) => response.json())
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                reject(err);
            });
    });
};

const isFutureAlly = (eventKey, teamNumberParam, currentMatch, allowPlayed) => {
    return new Promise((resolve, reject) => {
        if (parseInt(teamNumberParam) === teamNumber) {
            resolve(false);
            return;
        }
        internalBlueCall(`/team/frc${teamNumber}/event/${eventKey}/matches/simple`)
            .then((data) => {
                if (!data.Error) {
                    data.forEach((match) => (match.key = match.key.split('_')[1]));
                    let matches = sortMatches(data, 'key', false);
                    for (const match of matches) {
                        blue_keys = match.alliances.blue.team_keys;
                        red_keys = match.alliances.red.team_keys;
                        if (
                            (match.actual_time === null || allowPlayed) &&
                            match.key !== currentMatch &&
                            ((blue_keys.includes(`frc${teamNumber}`) && blue_keys.includes(`frc${teamNumberParam}`)) ||
                                (red_keys.includes(`frc${teamNumber}`) && red_keys.includes(`frc${teamNumberParam}`)))
                        ) {
                            resolve(match.key);
                        }
                    }
                    resolve(false);
                }
                resolve(false);
            })
            .catch((err) => {
                reject(err);
            });
    });
};

module.exports = { router, internalBlueCall, isFutureAlly };

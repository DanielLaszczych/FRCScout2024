const prod = {
    API_URL: 'https://scout.robotigers1796.com'
};
const dev = {
    API_URL: 'http://localhost:5000'
};

export const config = process.env.NODE_ENV === 'development' ? dev : prod;
export const year = 2023;
export const teamNumber = 1796;
export const cacheName = 'scouting';

export const matchFormStatus = {
    complete: 'Complete',
    followUp: 'Follow Up',
    noShow: 'No Show',
    missing: 'Missing'
};

export const rtessIssuesStatus = {
    unresolved: 'Unresolved',
    beingResolved: 'Being Resolved',
    resolved: 'Resolved'
};

export const scoutedField = {
    intakeSource: { field: 'intakeSource', label: 'Source', short: 'is' },
    intakeGround: { field: 'intakeGround', label: 'Ground', short: 'ig' },
    intakeMiss: { field: 'intakeMiss', label: 'Intake Miss', short: 'im' },
    ampScore: { field: 'ampScore', label: 'Amp', short: 'as' },
    speakerScore: { field: 'speakerScore', label: 'Speaker', short: 'ss' },
    ampMiss: { field: 'ampMiss', label: 'Amp Miss', short: 'am' },
    speakerMiss: { field: 'speakerMiss', label: 'Speaker Miss', short: 'sm' },
    ferry: { field: 'ferry', label: 'Ferry', short: 'f' },
    trap: { field: 'trap', label: 'Trap', short: 't' }
};

export const timeZone = 'US/Central';

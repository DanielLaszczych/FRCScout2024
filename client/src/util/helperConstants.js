const prod = {
    API_URL: 'https://scout.robotigers1796.com'
};
const dev = {
    API_URL: 'http://localhost:5000'
};

export const config = process.env.NODE_ENV === 'development' ? dev : prod;
export const year = 2024;
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
    intakeSource: { field: 'intakeSource', label: 'Source' },
    intakeGround: { field: 'intakeGround', label: 'Ground' },
    intakeMiss: { field: 'intakeMiss', label: 'Intake Miss' },
    ampScore: { field: 'ampScore', label: 'Amp' },
    speakerScore: { field: 'speakerScore', label: 'Speaker' },
    ampMiss: { field: 'ampMiss', label: 'Amp Miss' },
    speakerMiss: { field: 'speakerMiss', label: 'Speaker Miss' },
    ferry: { field: 'ferry', label: 'Ferry' },
    trap: { field: 'trap', label: 'Trap' }
};

export const timeZone = 'US/Central';

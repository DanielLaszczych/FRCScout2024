const prod = {
    API_URL: 'https://scout.robotigers1796.com'
};
const dev = {
    API_URL: 'http://localhost:5000'
};

export const config = process.env.NODE_ENV === 'development' ? dev : prod;
export const version = '2024.5';
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

export const gamePieceFields = {
    intakeSource: { field: 'intakeSource', label: 'Source', short: 'is', auto: false, teleop: true },
    intakeGround: { field: 'intakeGround', label: 'Ground', short: 'ig', auto: false, teleop: true },
    intakePreloaded: { field: 'intakePreloaded', label: 'Preloaded', short: 'pl', auto: false, teleop: false },
    intakeMiss: { field: 'intakeMiss', label: 'Intake Miss', short: 'im', auto: true, teleop: false },
    ampScore: { field: 'ampScore', label: 'Amp', short: 'as', auto: true, teleop: true },
    speakerScore: { field: 'speakerScore', label: 'Speaker', short: 'ss', auto: true, teleop: true },
    ampMiss: { field: 'ampMiss', label: 'Amp Miss', short: 'am', auto: true, teleop: true },
    speakerMiss: { field: 'speakerMiss', label: 'Speaker Miss', short: 'sm', auto: true, teleop: true },
    ferry: { field: 'ferry', label: 'Deposit Ferry', short: 'f', auto: false, teleop: true },
    centerFerry: { field: 'centerFerry', label: 'Shot Ferry', short: 'cf', auto: false, teleop: true },
    trap: { field: 'trap', label: 'Trap', short: 't', auto: false, teleop: true },
    subwooferScore: { field: 'subwooferScore', label: 'Subwoofer Score', short: 'sws', auto: false, teleop: true },
    subwooferMiss: { field: 'subwooferMiss', label: 'Subwoofer Miss', short: 'swm', auto: false, teleop: true },
    otherScore: { field: 'otherScore', label: 'Range Score', short: 'os', auto: false, teleop: true },
    otherMiss: { field: 'otherMiss', label: 'Range Miss', short: 'om', auto: false, teleop: true }
};

export const climbFields = {
    'No Attempt': { field: 'noAttempt' },
    Success: { field: 'success', teleopValue: 3 },
    Fail: { field: 'fail' },
    Center: { field: 'center' },
    Side: { field: 'side' }
};

export const teamPageTabs = {
    overview: 'overview',
    pit: 'pit',
    forms: 'forms',
    analysis: 'analysis',
    other: 'other'
};

export const timeZone = 'US/Eastern';

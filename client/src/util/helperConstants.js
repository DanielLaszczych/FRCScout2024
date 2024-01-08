const prod = {
    API_URL: 'https://scout.robotigers1796.com',
};
const dev = {
    API_URL: 'http://localhost:5000',
};

export const config = process.env.NODE_ENV === 'development' ? dev : prod;
export const year = 2023;
export const teamNumber = 1796;

export const matchFormStatus = {
    complete: 'Complete',
    followUp: 'Follow Up',
    noShow: 'No Show',
    missing: 'Missing',
    inconclusive: 'Inconclusive',
};

export const rtessIssuesStatus = {
    unresolved: 'Unresolved',
    beingResolved: 'Being Resolved',
    resolved: 'Resolved',
};

export const timeZone = 'US/Central';

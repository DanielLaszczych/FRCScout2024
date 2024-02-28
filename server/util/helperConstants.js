class HelperConstants {
    static matchFormStatus = {
        complete: 'Complete',
        followUp: 'Follow Up',
        noShow: 'No Show',
        missing: 'Missing'
    };

    static teamNumber = 1796;

    static rtessIssuesStatus = {
        unresolved: 'Unresolved',
        beingResolved: 'Being Resolved',
        resolved: 'Resolved'
    };

    static weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    static timeZone = 'US/Eastern';

    // Try to combine these two next year maybe into an all encompasing fields object
    static gamePieceFields = {
        intakeSource: {
            field: 'intakeSource',
            label: 'Source',
            short: 'is',
            auto: false,
            teleop: true
        },
        intakeGround: {
            field: 'intakeGround',
            label: 'Ground',
            short: 'ig',
            auto: false,
            teleop: true
        },
        intakePreloaded: { field: 'intakePreloaded', label: 'Preloaded', short: 'pl', auto: false, teleop: false },
        intakeMiss: {
            field: 'intakeMiss',
            label: 'Intake Miss',
            short: 'im',
            auto: true,
            teleop: false
        },
        ampScore: {
            field: 'ampScore',
            label: 'Amp',
            short: 'as',
            auto: true,
            teleop: true,
            autoValue: 2,
            teleopValue: 1
        },
        speakerScore: {
            field: 'speakerScore',
            label: 'Speaker',
            short: 'ss',
            auto: true,
            teleop: true,
            autoValue: 5,
            teleopValue: 2
        },
        ampMiss: {
            field: 'ampMiss',
            label: 'Amp Miss',
            short: 'am',
            auto: true,
            teleop: true
        },
        speakerMiss: {
            field: 'speakerMiss',
            label: 'Speaker Miss',
            short: 'sm',
            auto: true,
            teleop: true
        },
        ferry: {
            field: 'ferry',
            label: 'Ferry',
            short: 'f',
            auto: false,
            teleop: true
        },
        trap: {
            field: 'trap',
            label: 'Trap',
            short: 't',
            auto: false,
            teleop: true,
            teleopValue: 5
        }
    };

    // The keys are named after the label in the standform maybe next year change how this is done
    static climbFields = {
        'No Attempt': { field: 'noAttempt' },
        Success: { field: 'success', teleopValue: 3 },
        Fail: { field: 'fail' },
        'Left Side': { field: 'left' },
        Center: { field: 'center' },
        'Right Side': { field: 'right' }
    };
}

module.exports = HelperConstants;

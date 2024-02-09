// TED = Team Event Data, contains the totals for a team in an event to ease the
// process of getting the averages and updating averages for a team. This is mostly
// done for when you go on a teams overview page and want to see how they compare to
// other teams, instead of getting all the match forms for all the team and finding
// averages that way, we just use this.
// It only collects data from complete forms or no show forms

const { model, Schema } = require('mongoose');

const metricsSchema = new Schema(
    {
        total: {
            type: Number,
            default: 0
        },
        avg: {
            type: Number,
            default: 0
        },
        max: {
            type: Number,
            default: 0
        }
    },
    { _id: false }
);

const autoGPSchema = new Schema(
    {
        intakeMiss: {
            type: metricsSchema,
            default: {}
        },
        ampScore: {
            type: metricsSchema,
            default: {}
        },
        speakerScore: {
            type: metricsSchema,
            default: {}
        },
        ampMiss: {
            type: metricsSchema,
            default: {}
        },
        speakerMiss: {
            type: metricsSchema,
            default: {}
        }
    },
    { _id: false }
);

const teleopGPSchema = new Schema(
    {
        intakeSource: {
            type: metricsSchema,
            default: {}
        },
        intakeGround: {
            type: metricsSchema,
            default: {}
        },
        ampScore: {
            type: metricsSchema,
            default: {}
        },
        speakerScore: {
            type: metricsSchema,
            default: {}
        },
        ampMiss: {
            type: metricsSchema,
            default: {}
        },
        speakerMiss: {
            type: metricsSchema,
            default: {}
        },
        ferry: {
            type: metricsSchema,
            default: {}
        },
        trap: {
            type: metricsSchema,
            default: {}
        }
    },
    { _id: false }
);

const ampPlayerGPSchema = new Schema(
    {
        highNoteScore: {
            type: metricsSchema,
            default: {}
        },
        highNoteMiss: {
            type: metricsSchema,
            default: {}
        }
    },
    { _id: false }
);

const climbSchema = new Schema(
    {
        noAttempt: {
            type: Number,
            default: 0
        },
        success: {
            type: Number,
            default: 0
        },
        fail: {
            type: Number,
            default: 0
        },
        harmony: {
            type: metricsSchema,
            default: {}
        },
        left: {
            type: Number,
            default: 0
        },
        center: {
            type: Number,
            default: 0
        },
        right: {
            type: Number,
            default: 0
        }
    },
    { _id: false }
);

const TeamEventDataSchema = new Schema({
    eventKey: {
        type: String,
        required: true
    },
    teamNumber: {
        type: Number,
        required: true
    },
    // Only complete forms
    standForms: {
        type: Number,
        default: 0
    },
    superForms: {
        type: Number,
        default: 0
    },
    noShows: {
        type: Number,
        default: 0
    },
    // Stand form fields
    leftStart: {
        type: Number,
        default: 0
    },
    autoGP: {
        type: autoGPSchema,
        default: {}
    },
    autoPoints: {
        type: metricsSchema,
        default: {}
    },
    teleopGP: {
        type: teleopGPSchema,
        default: {}
    },
    climb: {
        type: climbSchema,
        default: {}
    },
    climbSuccessPercentage: {
        type: Number,
        default: 0
    },
    climbSuccessFraction: {
        type: String,
        default: ''
    },
    teleopPoints: {
        type: metricsSchema,
        default: {}
    },
    stagePoints: {
        type: metricsSchema,
        default: {}
    },
    offensivePoints: {
        type: metricsSchema,
        default: {}
    },
    wasDefended: {
        type: Number,
        default: 0
    },
    // Used to calculate averages for defense values
    playedDefense: {
        type: Number,
        default: 0
    },
    defenseRating: {
        type: metricsSchema,
        default: {}
    },
    defenseAllocation: {
        type: metricsSchema,
        default: {}
    },
    lostCommunication: {
        type: Number,
        default: 0
    },
    robotBroke: {
        type: Number,
        default: 0
    },
    yellowCard: {
        type: Number,
        default: 0
    },
    redCard: {
        type: Number,
        default: 0
    },
    // Super form fields
    agility: {
        type: metricsSchema,
        default: {}
    },
    fieldAwareness: {
        type: metricsSchema,
        default: {}
    },
    ampPlayer: {
        type: Number,
        default: 0
    },
    ampPlayerGP: {
        type: ampPlayerGPSchema,
        default: {}
    },
    highNoteScorePercentage: {
        type: Number,
        default: 0
    },
    highNoteScoreFraction: {
        type: String,
        default: ''
    }
});

const TED = model('TED', TeamEventDataSchema);
module.exports = TED;

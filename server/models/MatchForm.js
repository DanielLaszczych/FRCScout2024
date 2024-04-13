const { model, Schema } = require('mongoose');
const { matchFormStatus } = require('../util/helperConstants');

const autoTimelineSchema = new Schema(
    {
        piece: {
            type: String
        },
        scored: {
            type: String
        }
    },
    { _id: false }
);

// We need to defaualt in case auto timeline is empty
const autoGPSchema = new Schema(
    {
        intakeMiss: {
            type: Number,
            default: 0
        },
        ampScore: {
            type: Number,
            default: 0
        },
        speakerScore: {
            type: Number,
            default: 0
        },
        ampMiss: {
            type: Number,
            default: 0
        },
        speakerMiss: {
            type: Number,
            default: 0
        },
        autoFerry: {
            type: Number,
            default: 0
        }
    },
    { _id: false }
);

const teleopGPSchema = new Schema(
    {
        intakeSource: {
            type: Number
        },
        intakeGround: {
            type: Number
        },
        intakePreloaded: {
            type: Number
        },
        ampScore: {
            type: Number
        },
        speakerScore: {
            type: Number
        },
        ampMiss: {
            type: Number
        },
        speakerMiss: {
            type: Number
        },
        ferry: {
            type: Number
        },
        centerFerry: {
            type: Number,
            default: 0
        },
        trap: {
            type: Number
        },
        subwooferScore: {
            type: Number,
            default: 0
        },
        subwooferMiss: {
            type: Number,
            default: 0
        },
        otherScore: {
            type: Number,
            default: 0
        },
        otherMiss: {
            type: Number,
            default: 0
        }
    },
    { _id: false }
);

const historyDataSchema = new Schema(
    {
        data: {
            type: [String]
        },
        position: {
            type: Number
        }
    },
    { _id: false }
);

const climbSchema = new Schema(
    {
        attempt: {
            type: String
        },
        location: {
            type: String
        },
        harmony: {
            type: Number
        },
        park: {
            type: Boolean
        }
    },
    { _id: false }
);

const historySchema = new Schema(
    {
        auto: {
            type: historyDataSchema
        },
        teleop: {
            type: historyDataSchema
        },
        endGame: {
            type: historyDataSchema
        }
    },
    { _id: false }
);

const ampPlayerGPSchema = new Schema(
    {
        highNoteScore: {
            type: Number
        },
        highNoteMiss: {
            type: Number
        }
    },
    { _id: false }
);

const matchFormSchema = new Schema(
    {
        eventKey: {
            type: String,
            required: true
        },
        matchNumber: {
            type: String,
            required: true
        },
        station: {
            type: String,
            required: true
        },
        teamNumber: {
            type: Number,
            required: true
        },
        standScouter: {
            type: String
        },
        startingPosition: {
            type: Number
        },
        preloadedPiece: {
            type: String
        },
        leftStart: {
            type: Boolean
        },
        autoTimeline: {
            type: [autoTimelineSchema]
        },
        // We need to defaualt in case auto timeline is empty
        autoGP: {
            type: autoGPSchema,
            default: {}
        },
        autoPoints: {
            type: Number
        },
        teleopGP: {
            type: teleopGPSchema
        },
        teleopPoints: {
            type: Number
        },
        climb: {
            type: climbSchema
        },
        stagePoints: {
            type: Number
        },
        offensivePoints: {
            type: Number
        },
        wasDefended: {
            type: Boolean
        },
        defenseRating: {
            type: Number
        },
        defenseAllocation: {
            type: Number
        },
        lostCommunication: {
            type: Boolean
        },
        robotBroke: {
            type: Boolean
        },
        yellowCard: {
            type: Boolean
        },
        redCard: {
            type: Boolean
        },
        standComment: {
            type: String
        },
        standStatus: {
            type: String,
            required: true,
            default: matchFormStatus.missing
        },
        standStatusComment: {
            type: String
        },
        history: {
            type: historySchema
        },
        superScouter: {
            type: String
        },
        allianceNumbers: {
            type: [Number],
            default: [0, 0, 0]
        },
        agility: {
            type: Number
        },
        fieldAwareness: {
            type: Number
        },
        ampPlayer: {
            type: Boolean
        },
        ampPlayerGP: {
            type: ampPlayerGPSchema
        },
        superStatus: {
            type: String,
            required: true,
            default: matchFormStatus.missing
        },
        superStatusComment: {
            type: String
        }
    },
    { timestamps: true }
);

const MatchForm = model('MatchForm', matchFormSchema);
const PracticeForm = model('PracticeForm', matchFormSchema);
module.exports = { MatchForm, PracticeForm };

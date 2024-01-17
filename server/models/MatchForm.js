const { model, Schema } = require('mongoose');
const { matchFormStatus } = require('../util/helperConstants');

const autoTimelineSchema = new Schema({
    piece: {
        type: Number
    },
    scored: {
        type: String
    }
});

const teleopSchema = new Schema({
    groundIntake: {
        type: Number
    },
    sourceIntake: {
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
    trap: {
        type: Number
    }
});

const matchFormSchema = new Schema({
    eventKey: {
        type: String,
        required: true
    },
    station: {
        type: String,
        required: true
    },
    matchNumber: {
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
    preLoadedPiece: {
        type: String
    },
    leaveStart: {
        type: Boolean
    },
    autoTimeline: {
        type: [autoTimelineSchema]
    },
    teleopGP: {
        type: teleopSchema
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
    climb: {
        type: String
    },
    loseCommunication: {
        type: Boolean
    },
    robotBreak: {
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
    superScouter: {
        type: String
    },
    allianceNumbers: {
        type: [Number],
        default: [0, 0, 0]
    },
    quickness: {
        type: Number
    },
    driverAwareness: {
        type: Number
    },
    superEndComment: {
        type: String
    },
    superStatus: {
        type: String,
        required: true,
        default: matchFormStatus.missing
    },
    superStatusComment: {
        type: String
    }
});

const MatchForm = model('MatchForm', matchFormSchema);
module.exports = MatchForm;

const { model, Schema } = require('mongoose');
const { matchFormStatus } = require('../util/helperConstants');

const autoTimelineSchema = new Schema({
    piece: {
        type: String
    },
    scored: {
        type: String
    }
});

const teleopSchema = new Schema({
    intakeSource: {
        type: Number
    },
    intakeGround: {
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

const historyDataSchema = new Schema({
    data: {
        type: [String]
    },
    position: {
        type: Number
    }
});

const historySchema = new Schema({
    auto: {
        type: historyDataSchema
    },
    teleop: {
        type: historyDataSchema
    },
    endGame: {
        type: historyDataSchema
    }
});

const matchFormSchema = new Schema({
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
    preLoadedPiece: {
        type: String
    },
    leftStart: {
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

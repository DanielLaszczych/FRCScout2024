const { model, Schema } = require('mongoose');
const { matchFormStatus } = require('../util/helperConstants');

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
        type: String,
        required: true
    },
    leaveStart: {
        type: Boolean
    },
    ampAuto: {
        type: Number
    },
    speakerAuto: {
        type: Number
    },
    autoTimeline: {
        type: [String]
    },
    ampTele: {
        type: Number
    },
    speakerTele: {
        type: Number
    },
    trap: {
        type: Number
    },
    stage: {
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
    defenseRating: {
        type: Number
    },
    defenseAllocation: {
        type: Number
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

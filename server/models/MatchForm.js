const { model, Schema } = require('mongoose');
const { matchFormStatus } = require('../util/helperConstants');

const startingPositionSchema = new Schema({
    x: {
        type: Number,
        required: true,
    },
    y: {
        type: Number,
        required: true,
    },
});

const gamePieceScoring = new Schema({
    coneScored: {
        type: Number,
    },
    coneMissed: {
        type: Number,
    },
    cubeScored: {
        type: Number,
    },
    cubeMissed: {
        type: Number,
    },
});

const matchFormSchema = new Schema({
    eventKey: {
        type: String,
        required: true,
    },
    eventName: {
        type: String,
        required: true,
    },
    station: {
        type: String,
        required: true,
    },
    matchNumber: {
        type: String,
        required: true,
    },
    teamNumber: {
        type: Number,
        required: true,
    },
    teamName: {
        type: String,
        required: true,
    },
    standScouter: {
        type: String,
    },
    startingPosition: {
        type: startingPositionSchema,
    },
    preLoadedPiece: {
        type: String,
        required: true,
    },
    bottomAuto: {
        type: gamePieceScoring,
    },
    middleAuto: {
        type: gamePieceScoring,
    },
    topAuto: {
        type: gamePieceScoring,
    },
    crossCommunity: {
        type: Boolean,
    },
    chargeAuto: {
        type: String,
    },
    autoChargeComment: {
        type: String,
        default: '', // necessary because this field was added after our first event
    },
    standAutoComment: {
        type: String,
    },
    bottomTele: {
        type: gamePieceScoring,
    },
    middleTele: {
        type: gamePieceScoring,
    },
    topTele: {
        type: gamePieceScoring,
    },
    chargeTele: {
        type: String,
    },
    chargeComment: {
        type: String,
    },
    chargeRobotCount: {
        type: Number,
    },
    impairedCharge: {
        type: Boolean,
    },
    impairedComment: {
        type: String,
    },
    defendedBy: {
        type: String,
    },
    loseCommunication: {
        type: Boolean,
    },
    robotBreak: {
        type: Boolean,
    },
    yellowCard: {
        type: Boolean,
    },
    redCard: {
        type: Boolean,
    },
    standEndComment: {
        type: String,
    },
    standStatus: {
        type: String,
        required: true,
        default: matchFormStatus.missing,
    },
    standStatusComment: {
        type: String,
    },
    superScouter: {
        type: String,
    },
    allianceNumbers: {
        type: [Number],
        default: [0, 0, 0],
    },
    defenseRating: {
        type: Number,
    },
    defenseAllocation: {
        type: Number,
    },
    quickness: {
        type: Number,
    },
    driverAwareness: {
        type: Number,
    },
    superEndComment: {
        type: String,
    },
    superStatus: {
        type: String,
        required: true,
        default: matchFormStatus.missing,
    },
    superStatusComment: {
        type: String,
    },
});

const MatchForm = model('MatchForm', matchFormSchema);
module.exports = MatchForm;

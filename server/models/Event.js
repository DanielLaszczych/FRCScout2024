const { model, Schema } = require('mongoose');

const teamSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        number: {
            type: Number,
            required: true
        },
        key: {
            type: String,
            required: true
        }
    },
    { _id: false }
);

const pitImageOCRInfoSchema = new Schema({
    teamNumber: {
        type: Number,
        required: true
    },
    left: {
        type: Number,
        required: true
    },
    top: {
        type: Number,
        required: true
    },
    height: {
        type: Number,
        required: true
    },
    width: {
        type: Number,
        required: true
    }
});

const eventSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    week: {
        type: Number,
        required: false //to allow events with a null week such as Championship events
    },
    eventType: {
        type: String,
        required: true
    },
    startDate: {
        type: String,
        required: true
    },
    endDate: {
        type: String,
        required: true
    },
    teams: [teamSchema],
    key: {
        type: String,
        required: true
    },
    currentEvent: {
        type: Boolean,
        required: true,
        default: false
    },
    pitMapImage: {
        type: String,
        required: false
    },
    pitImageOCRInfo: {
        type: [pitImageOCRInfoSchema],
        required: false
    },
    custom: {
        type: Boolean,
        default: false
    }
});

const Event = model('Event', eventSchema);
module.exports = Event;

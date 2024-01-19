const { model, Schema } = require('mongoose');

const frameSizeSchema = new Schema({
    width: {
        type: Number
    },
    length: {
        type: Number
    }
});

const motorSchema = new Schema({
    label: {
        type: String,
        required: true
    },
    value: {
        type: Number,
        required: true
    }
});

const innerAbilitySchema = new Schema({
    label: {
        type: String,
        required: true
    },
    subType: {
        type: String
    },
    subField: {
        type: String
    }
});

const outerAbilitySchema = new Schema({
    label: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    abilities: {
        type: [innerAbilitySchema]
    }
});

const pitFormSchema = new Schema(
    {
        eventKey: {
            type: String,
            required: true
        },
        teamNumber: {
            type: Number,
            required: true
        },
        scouter: {
            type: String,
            required: true
        },
        weight: {
            type: Number
        },
        height: {
            type: Number
        },
        frameSize: {
            type: frameSizeSchema
        },
        driveTrain: {
            type: String
        },
        motors: {
            type: [motorSchema]
        },
        driveTrainComment: {
            type: String
        },
        programmingLanguage: {
            type: String
        },
        startingPosition: {
            type: Number
        },
        autoAbilities: {
            type: [outerAbilitySchema]
        },
        autoComment: {
            type: String
        },
        teleAbilities: {
            type: [outerAbilitySchema]
        },
        batteryCount: {
            type: Number
        },
        chargingBatteryCount: {
            type: Number
        },
        workingComment: {
            type: String
        },
        closingComment: {
            type: String
        },
        image: {
            type: String
        },
        followUp: {
            type: Boolean,
            required: true
        },
        followUpComment: {
            type: String
        }
    },
    { timestamps: true }
);

const PitForm = model('PitForm', pitFormSchema);
module.exports = PitForm;

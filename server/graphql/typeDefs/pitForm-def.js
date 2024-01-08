const { gql } = require('apollo-server-express');

module.exports = gql`
    type FrameSize {
        _id: ID!
        width: Float
        length: Float
    }

    type Motor {
        _id: ID!
        label: String!
        value: Int!
    }

    type Wheel {
        _id: ID!
        label: String!
        size: Float
        value: Int!
    }

    type DriveStats {
        _id: ID!
        drivingGear: Float!
        drivenGear: Float!
        freeSpeed: Float!
        pushingPower: Float!
        preferRatio: Boolean!
    }

    type StartingPosition {
        _id: ID!
        x: Float
        y: Float
    }

    type InnerAbility {
        _id: ID!
        label: String!
        subType: String
        subField: String
    }

    type OuterAbility {
        _id: ID!
        label: String!
        type: String!
        abilities: [InnerAbility]
    }

    type PitForm {
        _id: ID!
        eventKey: String!
        eventName: String!
        teamNumber: Int!
        teamName: String!
        scouter: String!
        weight: Float
        height: Float
        frameSize: FrameSize
        driveTrain: String
        motors: [Motor]
        wheels: [Wheel]
        driveStats: [DriveStats]
        driveTrainComment: String
        programmingLanguage: String
        startingPosition: StartingPosition
        autoAbilities: [OuterAbility]
        autoComment: String
        teleAbilities: [OuterAbility]
        batteryCount: Int
        chargingBatteryCount: Int
        workingComment: String
        closingComment: String
        image: String
        followUp: Boolean!
        followUpComment: String
        createdAt: String
    }

    input FrameSizeInput {
        width: Float
        length: Float
    }

    input MotorInput {
        label: String!
        value: Int!
    }

    input WheelInput {
        label: String!
        size: Float
        value: Int!
    }

    input GearRatioInput {
        drivingGear: Float!
        drivenGear: Float!
        freeSpeed: Float!
        preferRatio: Boolean!
    }

    input StartingPositionInput {
        x: Float
        y: Float
    }

    input InnerAbilityInput {
        label: String!
        subType: String
        subField: String
    }

    input OuterAbilityInput {
        label: String!
        type: String!
        abilities: [InnerAbilityInput]
    }

    input PitFormInput {
        eventKey: String!
        eventName: String!
        teamNumber: Int!
        teamName: String!
        weight: Float
        height: Float
        frameSize: FrameSizeInput
        driveTrain: String
        motors: [MotorInput]
        wheels: [WheelInput]
        gearRatios: [GearRatioInput]
        driveTrainComment: String
        programmingLanguage: String
        startingPosition: StartingPositionInput
        autoAbilities: [OuterAbilityInput]
        autoComment: String
        teleAbilities: [OuterAbilityInput]
        batteryCount: Int
        chargingBatteryCount: Int
        workingComment: String
        closingComment: String
        image: String
        followUp: Boolean!
        followUpComment: String
    }

    extend type Query {
        getPitForms(eventKey: String, teamNumber: Int, followUp: Boolean): [PitForm]
        getPitForm(eventKey: String, teamNumber: Int, followUp: Boolean): PitForm
    }

    extend type Mutation {
        updatePitForm(pitFormInput: PitFormInput!): PitForm
    }
`;

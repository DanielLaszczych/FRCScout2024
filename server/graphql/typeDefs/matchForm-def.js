const { gql } = require('apollo-server-express');

module.exports = gql`
    type StartingPosition {
        _id: ID!
        x: Float
        y: Float
    }

    type GamePieceScoring {
        _id: ID!
        coneScored: Int
        coneMissed: Int
        cubeScored: Int
        cubeMissed: Int
    }

    type MatchForm {
        _id: ID!
        eventKey: String!
        eventName: String!
        station: String!
        matchNumber: String!
        teamNumber: Int!
        teamName: String!
        standScouter: String
        startingPosition: StartingPosition
        preLoadedPiece: String
        bottomAuto: GamePieceScoring
        middleAuto: GamePieceScoring
        topAuto: GamePieceScoring
        crossCommunity: Boolean
        chargeAuto: String
        autoChargeComment: String
        standAutoComment: String
        bottomTele: GamePieceScoring
        middleTele: GamePieceScoring
        topTele: GamePieceScoring
        chargeTele: String
        chargeComment: String
        chargeRobotCount: Int
        impairedCharge: Boolean
        impairedComment: String
        defendedBy: String
        loseCommunication: Boolean
        robotBreak: Boolean
        yellowCard: Boolean
        redCard: Boolean
        standEndComment: String
        standStatus: String!
        standStatusComment: String
        superScouter: String
        allianceNumbers: [Int]
        defenseRating: Int
        defenseAllocation: Float
        quickness: Int
        driverAwareness: Int
        superEndComment: String
        superStatus: String!
        superStatusComment: String
    }

    input StartingPositionInput {
        x: Float
        y: Float
    }

    input GamePieceScoringInput {
        coneScored: Int
        coneMissed: Int
        cubeScored: Int
        cubeMissed: Int
    }

    input MatchFormInput {
        eventKey: String!
        eventName: String!
        station: String!
        matchNumber: String!
        teamNumber: Int!
        teamName: String!
        startingPosition: StartingPositionInput
        preLoadedPiece: String
        bottomAuto: GamePieceScoringInput
        middleAuto: GamePieceScoringInput
        topAuto: GamePieceScoringInput
        crossCommunity: Boolean
        chargeAuto: String
        autoChargeComment: String
        standAutoComment: String
        bottomTele: GamePieceScoringInput
        middleTele: GamePieceScoringInput
        topTele: GamePieceScoringInput
        chargeTele: String
        chargeComment: String
        chargeRobotCount: Int
        impairedCharge: Boolean
        impairedComment: String
        defendedBy: String
        loseCommunication: Boolean
        robotBreak: Boolean
        yellowCard: Boolean
        redCard: Boolean
        standEndComment: String
        standStatus: String
        standStatusComment: String
        superScouter: String
        allianceNumbers: [String]
        defenseRating: Int
        defenseAllocation: Float
        quickness: Int
        driverAwareness: Int
        superEndComment: String
        superStatus: String
        superStatusComment: String
    }

    extend type Query {
        getMatchForms(eventKey: String, teamNumber: Int, matchNumber: String, station: [String], standStatus: [String], superStatus: [String]): [MatchForm]
        getMatchForm(eventKey: String, teamNumber: Int, matchNumber: String, station: [String], standStatus: [String], superStatus: [String]): MatchForm
    }

    extend type Mutation {
        updateStandForm(matchFormInput: MatchFormInput!): MatchForm
        updateSuperForms(matchFormInputs: [MatchFormInput!]!): [MatchForm]
    }
`;

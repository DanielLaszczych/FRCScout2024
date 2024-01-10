const { gql } = require('graphql-tag');

module.exports = gql`
    type Team {
        name: String!
        number: Int!
        key: String!
    }

    type PickList {
        firstPick: [String]!
        secondPick: [String]!
        thirdPick: [String]!
        doNotPick: [String]!
        picked: [String]!
    }

    type Event {
        _id: ID!
        name: String!
        year: Int!
        week: Int
        eventType: String!
        startDate: String!
        endDate: String!
        teams: [Team]
        key: String!
        currentEvent: Boolean!
        pitMapImage: String
        pickList: PickList
        custom: Boolean!
    }

    input TeamInput {
        name: String!
        number: Int!
        key: String!
    }

    input PickListInput {
        firstPick: [String]!
        secondPick: [String]!
        thirdPick: [String]!
        doNotPick: [String]!
        picked: [String]!
    }

    input EventInput {
        name: String!
        year: Int!
        week: Int
        eventType: String!
        startDate: String!
        endDate: String!
        teams: [TeamInput]
        key: String!
        pickList: PickListInput
        custom: Boolean
    }

    extend type Query {
        getEvents: [Event]
        getEvent(key: String!): Event
        getCurrentEvent: Event
        getTeamsEvents(teamNumber: Int!): [Event]
    }

    extend type Mutation {
        createEvent(eventInput: EventInput!): Event
        removeEvent(key: String!): Event
        setCurrentEvent(key: String!): Event
        setEventPitMap(key: String!, image: String!): Event
        savePickList(key: String!): Event
    }
`;

const { gql } = require('apollo-server-express');

module.exports = gql`
    type RTESSIssue {
        _id: ID!
        eventKey: String!
        matchNumber: String
        teamNumber: Int!
        teamName: String!
        submitter: String
        rtessMember: String
        issue: String
        problemComment: String
        solutionComment: String
        status: String!
        updatedAt: String
    }

    input RTESSIssueInput {
        _id: ID
        eventKey: String
        matchNumber: String
        teamNumber: Int
        teamName: String
        submitter: String
        rtessMember: String
        issue: String
        problemComment: String
        solutionComment: String
        status: String
    }

    extend type Query {
        getRTESSIssues(eventKey: String, matchNumber: String, teamNumber: Int): [RTESSIssue]
        getRTESSIssue(_id: String): RTESSIssue
    }

    extend type Mutation {
        createRTESSIssue(rtessIssueInput: RTESSIssueInput!): RTESSIssue
        updateRTESSIssue(rtessIssueInput: RTESSIssueInput!): RTESSIssue
    }
`;

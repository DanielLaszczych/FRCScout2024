const { model, Schema } = require('mongoose');
const { rtessIssuesStatus } = require('../util/helperConstants');

const rtessIssueSchema = new Schema(
    {
        eventKey: {
            type: String,
            required: true
        },
        matchNumber: {
            type: String
        },
        teamNumber: {
            type: Number,
            required: true
        },
        teamName: {
            type: String,
            required: true
        },
        submitter: {
            type: String,
            required: true
        },
        rtessMember: {
            type: String
        },
        issue: {
            type: String,
            required: true
        },
        problemComment: {
            type: String
        },
        solutionComment: {
            type: String
        },
        status: {
            type: String,
            required: true,
            default: rtessIssuesStatus.unresolved
        }
    },
    { timestamps: true }
);

const RTESSIssue = model('RTESSIssue', rtessIssueSchema);
module.exports = RTESSIssue;

const eventResolvers = require('./event-resolvers');
const matchFormResolvers = require('./matchForm-resolvers');
const pitFormResolvers = require('./pitForm-resolvers');
const rtessIssueResolvers = require('./rtessIssue-resolvers');
const usersResolvers = require('./users-resolvers');

module.exports = [usersResolvers, pitFormResolvers, eventResolvers, rtessIssueResolvers, matchFormResolvers];

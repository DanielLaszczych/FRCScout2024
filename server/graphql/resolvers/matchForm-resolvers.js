const MatchForm = require('../../models/MatchForm');
const RTESSIssue = require('../../models/RTESSIssue');
const { isFutureAlly, internalBlueCall } = require('../../routes/blueAlliance');
const { internalSendMessage } = require('../../routes/groupMeBot');
const { matchFormStatus, rtessIssuesStatus, weekday, timeZone } = require('../../util/helperConstants');
const { convertMatchKeyToString } = require('../../util/helperFunctions');

module.exports = {
    Query: {
        async getMatchForms(_, filters, context) {
            if (!context.req.user) {
                throw new Error('You must be logged in');
            }
            try {
                const matchForms = await MatchForm.find(filters).exec();
                return matchForms;
            } catch (err) {
                throw new Error(err);
            }
        },
        async getMatchForm(_, filters, context) {
            if (!context.req.user) {
                throw new Error('You must be logged in');
            }
            try {
                const matchForm = await MatchForm.findOne(filters).exec();
                return matchForm;
            } catch (err) {
                throw new Error(err);
            }
        },
    },
    Mutation: {
        async updateStandForm(_, { matchFormInput }, context) {
            if (!context.req.user) {
                throw new Error('You must be logged in');
            }
            try {
                matchFormInput.standScouter = context.req.user.displayName;

                const matchForm = await MatchForm.findOneAndUpdate({ eventKey: matchFormInput.eventKey, matchNumber: matchFormInput.matchNumber, station: matchFormInput.station }, matchFormInput, {
                    new: true,
                    upsert: true,
                }).exec();
                if (matchFormInput.loseCommunication || matchFormInput.robotBreak || matchFormInput.standStatus === matchFormStatus.noShow) {
                    let futureMatchNumber = await isFutureAlly(matchFormInput.eventKey, matchFormInput.teamNumber, matchFormInput.matchNumber, false);
                    let prevRTESSIssue = await RTESSIssue.findOne({ eventKey: matchFormInput.eventKey, matchNumber: matchFormInput.matchNumber, teamNumber: matchFormInput.teamNumber });
                    if (futureMatchNumber || prevRTESSIssue) {
                        let issues = [];
                        if (matchFormInput.loseCommunication) issues.push('Lost Communication');
                        if (matchFormInput.robotBreak) issues.push('Robot Broke');
                        if (matchFormInput.standStatus === matchFormStatus.noShow) issues.push('No show');

                        let rtessIssueInput = {
                            eventKey: matchFormInput.eventKey,
                            matchNumber: matchFormInput.matchNumber,
                            teamNumber: matchFormInput.teamNumber,
                            teamName: matchFormInput.teamName,
                            submitter: context.req.user.displayName,
                            issue: issues.join(', '),
                            problemComment: matchFormInput.standStatus === matchFormStatus.noShow ? matchFormInput.standStatusComment : matchFormInput.standEndComment,
                            status: rtessIssuesStatus.unresolved,
                        };

                        if (prevRTESSIssue) {
                            rtessIssueInput.status = prevRTESSIssue.status;
                            rtessIssueInput.rtessMember = prevRTESSIssue.rtessMember;
                            rtessIssueInput.solutionComment = prevRTESSIssue.solutionComment;
                        }

                        await RTESSIssue.findOneAndUpdate({ eventKey: rtessIssueInput.eventKey, matchNumber: rtessIssueInput.matchNumber, teamNumber: rtessIssueInput.teamNumber }, rtessIssueInput, {
                            new: true,
                            upsert: true,
                        }).exec();

                        let io = context.req.app.get('socketio');
                        io.sockets.emit('rtessUpdate');

                        //Service Squad Anncoument
                        if (futureMatchNumber && !prevRTESSIssue) {
                            internalBlueCall(`/match/${rtessIssueInput.eventKey}_${futureMatchNumber}/simple`)
                                .then((data) => {
                                    let time = data.time;
                                    if (data.predicted_time) {
                                        time = data.predicted_time;
                                    }
                                    let convertedTime = time
                                        ? ` (${weekday[new Date(time * 1000).getDay()]} ${new Date(time * 1000).toLocaleString('en-US', {
                                              hour: 'numeric',
                                              minute: 'numeric',
                                              hour12: true,
                                              timeZone: timeZone,
                                          })})`
                                        : '';
                                    internalSendMessage(
                                        `*SSA*\nTeam: ${rtessIssueInput.teamNumber}\nIssue: ${rtessIssueInput.issue}\nPlaying together in: ${convertMatchKeyToString(
                                            futureMatchNumber
                                        )}${convertedTime}`
                                    );
                                })
                                .catch((err) => {
                                    throw new Error(err);
                                });
                        }

                        return matchForm;
                    }
                } else {
                    return matchForm;
                }
            } catch (err) {
                throw new Error(err);
            }
        },
        async updateSuperForms(_, { matchFormInputs }, context) {
            if (!context.req.user) {
                throw new Error('You must be logged in');
            }
            try {
                matchFormInputs.forEach((matchFormInput) => (matchFormInput.superScouter = context.req.user.displayName));

                let updates = matchFormInputs.map((matchFormInput) =>
                    MatchForm.findOneAndUpdate({ eventKey: matchFormInput.eventKey, matchNumber: matchFormInput.matchNumber, station: matchFormInput.station }, matchFormInput, {
                        new: true,
                        upsert: true,
                    }).exec()
                );
                Promise.all(updates).then((values) => {
                    return values;
                });
            } catch (err) {
                throw new Error(err);
            }
        },
    },
};

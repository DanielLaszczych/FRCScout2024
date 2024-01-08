const RTESSIssue = require('../../models/RTESSIssue');
const { isFutureAlly, internalBlueCall } = require('../../routes/blueAlliance');
const { internalSendMessage } = require('../../routes/groupMeBot');
const { rtessIssuesStatus, weekday, timeZone } = require('../../util/helperConstants');
const { convertMatchKeyToString } = require('../../util/helperFunctions');

module.exports = {
    Query: {
        async getRTESSIssues(_, filters, context) {
            if (!context.req.user) {
                throw new Error('You must be logged in');
            }
            try {
                const rtessIssues = await RTESSIssue.find(filters).exec();
                return rtessIssues;
            } catch (err) {
                throw new Error(err);
            }
        },
        async getRTESSIssue(_, filters, context) {
            if (!context.req.user) {
                throw new Error('You must be logged in');
            }
            try {
                const rtessIssue = await RTESSIssue.findOne(filters).exec();
                return rtessIssue;
            } catch (err) {
                throw new Error(err);
            }
        },
    },
    Mutation: {
        async createRTESSIssue(_, { rtessIssueInput }, context) {
            if (!context.req.user) {
                throw new Error('You must be logged in');
            }
            try {
                rtessIssueInput.submitter = context.req.user.displayName;
                if (rtessIssueInput.status === rtessIssuesStatus.resolved) {
                    rtessIssueInput.rtessMember = context.req.user.displayName;
                }
                const rtessIssue = await RTESSIssue.create(rtessIssueInput);

                let io = context.req.app.get('socketio');
                io.sockets.emit('rtessUpdate');
                if (rtessIssueInput.status === rtessIssuesStatus.unresolved) {
                    let futureMatchNumber = await isFutureAlly(rtessIssueInput.eventKey, rtessIssueInput.teamNumber, false, false);
                    if (futureMatchNumber) {
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
                                    `*SSA*\nTeam: ${rtessIssueInput.teamNumber}\nIssue: ${rtessIssueInput.issue}\nPlaying together in: ${convertMatchKeyToString(futureMatchNumber)}${convertedTime}`
                                );
                            })
                            .catch((err) => {
                                throw new Error(err);
                            });
                    }
                }

                return rtessIssue;
            } catch (err) {
                throw new Error(err);
            }
        },
        async updateRTESSIssue(_, { rtessIssueInput }, context) {
            if (!context.req.user) {
                throw new Error('You must be logged in');
            }
            try {
                rtessIssueInput.rtessMember = context.req.user.displayName;
                const rtessIssue = await RTESSIssue.findOneAndUpdate({ _id: rtessIssueInput._id }, rtessIssueInput, { new: true });

                let io = context.req.app.get('socketio');
                io.sockets.emit('rtessUpdate');

                return rtessIssue;
            } catch (err) {
                throw new Error(err);
            }
        },
    },
};

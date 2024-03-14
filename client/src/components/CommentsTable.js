import React, { useLayoutEffect, useState } from 'react';
import { matchFormStatus } from '../util/helperConstants';
import { convertMatchKeyToString, sortMatches } from '../util/helperFunctions';
import { Box, Center, Flex, Grid, GridItem, Spinner, Text } from '@chakra-ui/react';

function CommentsTable({ teamNumbers, multiTeamMatchForms, multiTeamRTESSForms, onTeamPage }) {
    const [comments, setComments] = useState(null);

    useLayoutEffect(() => {
        let comments = {};
        for (const teamNumber of teamNumbers) {
            let matchForms = sortMatches(multiTeamMatchForms[teamNumber]);
            let rtessIssues = [...multiTeamRTESSForms[teamNumber]];
            comments[teamNumber] = [];
            for (const matchForm of matchForms) {
                let obj = {
                    matchForm: true,
                    rtessIssue: false,
                    matchNumber: matchForm.matchNumber,
                    issues: '',
                    problemComment: '',
                    status: '',
                    solutionComment: '',
                    createdAt: matchForm.createdAt || new Date() // Need this because we decided to add this later in the year and matchForm did not have timestamps until then
                };
                if (
                    (matchForm.standStatus === matchFormStatus.complete &&
                        (matchForm.lostCommunication || matchForm.robotBroke)) ||
                    matchForm.standStatus === matchFormStatus.noShow
                ) {
                    let rtessIssueIndex = rtessIssues.findIndex(
                        (rtessIssue) => rtessIssue.matchNumber === matchForm.matchNumber
                    );
                    if (rtessIssueIndex !== -1) {
                        let rtessIssue = rtessIssues.splice(rtessIssueIndex, 1)[0];
                        obj.rtessIssue = true;
                        obj.status = rtessIssue.status;
                        obj.solutionComment = rtessIssue.solutionComment;
                    }
                    if (matchForm.standStatus === matchFormStatus.complete) {
                        obj.issues = [];
                        if (matchForm.lostCommunication) obj.issues.push('Lost Communication');
                        if (matchForm.robotBroke) obj.issues.push('Robot Broke');
                        obj.issues = obj.issues.join(', ');
                    } else {
                        obj.issues = 'No Show';
                    }
                    obj.problemComment =
                        matchForm.standStatus === matchFormStatus.complete
                            ? matchForm.standComment
                            : matchForm.standStatusComment;
                    comments[teamNumber].push(obj);
                } else if (matchForm.standComment !== '') {
                    obj.problemComment = matchForm.standComment;
                    comments[teamNumber].push(obj);
                }
            }

            for (const rtessIssue of rtessIssues) {
                comments[teamNumber].push({
                    matchForm: false,
                    rtessIssue: true,
                    issues: rtessIssue.issue,
                    problemComment: rtessIssue.problemComment,
                    status: rtessIssue.status,
                    solutionComment: rtessIssue.solutionComment,
                    createdAt: rtessIssue.createdAt
                });
            }

            comments[teamNumber] = comments[teamNumber].sort((a, b) => {
                return new Date(parseInt(b.createdAt)) - new Date(parseInt(a.createdAt));
            });
        }
        setComments(comments);
    }, [teamNumbers, multiTeamMatchForms, multiTeamRTESSForms]);

    function getGridComponent(comment) {
        if (comment.matchForm && comment.rtessIssue) {
            return (
                <React.Fragment>
                    <GridItem
                        display={'flex'}
                        flexDirection={'column'}
                        rowGap={'10px'}
                        justifyContent={'center'}
                        alignItems={'center'}
                        backgroundColor={'gray.100'}
                        borderBottom={'1px solid black'}
                        borderRight={'1px solid black'}
                        padding={'10px 5px'}
                    >
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            {`Issue(s): ${comment.issues}`}
                        </Text>
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            {`Comment: ${comment.problemComment || 'N/A'}`}
                        </Text>
                    </GridItem>
                    <GridItem
                        display={'flex'}
                        flexDirection={'column'}
                        rowGap={'10px'}
                        justifyContent={'center'}
                        alignItems={'center'}
                        backgroundColor={'gray.100'}
                        borderBottom={'1px solid black'}
                        padding={'10px 5px'}
                    >
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            {`Status: ${comment.status}`}
                        </Text>
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            {`Solution: ${comment.solutionComment || 'N/A'}`}
                        </Text>
                    </GridItem>
                </React.Fragment>
            );
        } else if (comment.matchForm && !comment.rtessIssue) {
            return (
                <GridItem
                    display={'flex'}
                    flexDirection={'column'}
                    rowGap={'10px'}
                    justifyContent={'center'}
                    alignItems={'center'}
                    backgroundColor={'gray.100'}
                    borderBottom={'1px solid black'}
                    padding={'10px 5px'}
                    colSpan={2}
                >
                    {comment.issues && (
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            {`Issue(s): ${comment.issues}`}
                        </Text>
                    )}
                    <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                        {`Comment: ${comment.problemComment || 'N/A'}`}
                    </Text>
                </GridItem>
            );
        } else if (!comment.matchForm && comment.rtessIssue) {
            return (
                <React.Fragment>
                    <GridItem
                        display={'flex'}
                        flexDirection={'column'}
                        rowGap={'10px'}
                        justifyContent={'center'}
                        alignItems={'center'}
                        backgroundColor={'gray.100'}
                        borderBottom={'1px solid black'}
                        borderRight={'1px solid black'}
                        padding={'10px 5px'}
                    >
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            {`Issue(s): ${comment.issues}`}
                        </Text>
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            {`Comment: ${comment.problemComment || 'N/A'}`}
                        </Text>
                    </GridItem>
                    <GridItem
                        display={'flex'}
                        flexDirection={'column'}
                        rowGap={'10px'}
                        justifyContent={'center'}
                        alignItems={'center'}
                        backgroundColor={'gray.100'}
                        borderBottom={'1px solid black'}
                        padding={'10px 5px'}
                    >
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            {`Status: ${comment.status}`}
                        </Text>
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            {`Solution: ${comment.solutionComment || 'N/A'}`}
                        </Text>
                    </GridItem>
                </React.Fragment>
            );
        }
    }

    if (comments === null) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Flex
            margin={'0 auto'}
            width={'100%'}
            flexWrap={'wrap'}
            columnGap={'50px'}
            rowGap={'40px'}
            justifyContent={'center'}
        >
            {teamNumbers.map((teamNumber, index) => (
                <Flex
                    key={teamNumber}
                    justifyContent={'center'}
                    width={{ base: '90%', lg: `calc(90% / ${Math.min(teamNumbers.length, 3)})` }}
                    height={
                        comments[teamNumber].length === 0
                            ? 'fit-content'
                            : {
                                  base: `min(fit-content, max(60vh, 280px + ${!onTeamPage ? 27 : 0}px))`,
                                  lg: `max(calc(120vh / ${teamNumbers.length > 3 ? 3 : 2}), 280px + ${
                                      !onTeamPage ? 27 : 0
                                  }px)`
                              }
                    }
                >
                    {comments[teamNumber].length > 0 ? (
                        <Box width={{ base: '100%', lg: onTeamPage ? '50%' : '100%' }}>
                            {!onTeamPage && (
                                <Text
                                    fontSize={'xl'}
                                    fontWeight={'semibold'}
                                    textAlign={'center'}
                                    color={index > 2 ? 'blue.500' : 'red.500'}
                                >
                                    {index > 2 ? `Blue ${index - 2}: ${teamNumber}` : `Red ${index + 1}: ${teamNumber}`}
                                </Text>
                            )}
                            <Box
                                height={{
                                    base: `min(fit-content, max(calc(60vh - ${!onTeamPage ? 27 : 0}px), 280px))`,
                                    lg: `max(calc(120vh / ${teamNumbers.length > 3 ? 3 : 2} - ${
                                        !onTeamPage ? 27 : 0
                                    }px), 280px)`
                                }}
                                overflowY={'auto'}
                                borderRadius={'5px'}
                            >
                                <Grid templateColumns={'1fr 3fr 3fr'}>
                                    {comments[teamNumber].map((comment, index) => (
                                        <React.Fragment key={index}>
                                            <GridItem
                                                display={'flex'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                                backgroundColor={'gray.100'}
                                                borderBottom={'1px solid black'}
                                                borderRight={'1px solid black'}
                                                padding={'10px 5px'}
                                            >
                                                <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                                                    {comment.matchForm
                                                        ? convertMatchKeyToString(comment.matchNumber)
                                                        : 'RTESS Issue'}
                                                </Text>
                                            </GridItem>
                                            {getGridComponent(comment)}
                                        </React.Fragment>
                                    ))}
                                </Grid>
                            </Box>
                        </Box>
                    ) : (
                        <Box key={teamNumber}>
                            {!onTeamPage && (
                                <Text
                                    fontSize={'xl'}
                                    fontWeight={'semibold'}
                                    textAlign={'center'}
                                    color={index > 2 ? 'blue.500' : 'red.500'}
                                >
                                    {index > 2 ? `Blue ${index - 2}: ${teamNumber}` : `Red ${index + 1}: ${teamNumber}`}
                                </Text>
                            )}
                            <Text fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'}>
                                No comments or issues
                            </Text>
                        </Box>
                    )}
                </Flex>
            ))}
        </Flex>
    );
}

export default CommentsTable;

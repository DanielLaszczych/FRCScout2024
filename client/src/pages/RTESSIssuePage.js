import { useMutation, useQuery } from '@apollo/client';
import { Box, Button, Center, HStack, Spinner, Text, Textarea, useToast } from '@chakra-ui/react';
import { React, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UPDATE_RTESS_ISSUE } from '../graphql/mutations';
import { GET_EVENT, GET_RTESS_ISSUE } from '../graphql/queries';
import { rtessIssuesStatus } from '../util/helperConstants';

function RTESSIssuePage() {
    const { id: idParam } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [eventName, setEventName] = useState(null);
    const [rtessIssueData, setRTESSIssueData] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const { error: eventError } = useQuery(GET_EVENT, {
        fetchPolicy: 'network-only',
        skip: rtessIssueData === null,
        variables: {
            key: rtessIssueData?.eventKey
        },
        onError(err) {
            console.log(JSON.stringify(err, null, 2));
            setError('Apollo error, could not retrieve data on current event');
        },
        onCompleted({ getEvent: event }) {
            setEventName(event.name);
        }
    });

    const { loading: loadingRTESSIssue, error: rtessIssueError } = useQuery(GET_RTESS_ISSUE, {
        fetchPolicy: 'network-only',
        variables: {
            _id: idParam
        },
        onError(err) {
            console.log(JSON.stringify(err, null, 2));
            setError('Apollo error, could not retrieve rtess issue');
        },
        onCompleted({ getRTESSIssue: rtessIssue }) {
            if (!rtessIssue) {
                setError('RTESS issue does not exist');
            }
            setRTESSIssueData(rtessIssue);
        }
    });

    function validForm() {
        return rtessIssueData.status !== rtessIssuesStatus.resolved || (rtessIssueData.solutionComment && rtessIssueData.solutionComment.trim() !== '');
    }

    const [updateRTESSIssues] = useMutation(UPDATE_RTESS_ISSUE, {
        onCompleted() {
            toast({
                title: 'RTESS Issue Updated',
                status: 'success',
                duration: 3000,
                isClosable: true
            });
            navigate('/rtessIssues/event');
            setSubmitting(false);
        },
        onError(err) {
            console.log(JSON.stringify(err, null, 2));
            toast({
                title: 'Apollo Error',
                description: 'RTESS Issues could not be updated',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
            setSubmitting(false);
        }
    });

    function submit() {
        setSubmitAttempted(true);
        if (!validForm()) {
            toast({
                title: 'Missing fields',
                description: 'Fill out all fields',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
            return;
        }
        setSubmitting(true);
        updateRTESSIssues({
            variables: {
                rtessIssueInput: {
                    _id: rtessIssueData._id,
                    solutionComment: rtessIssueData.solutionComment ? rtessIssueData.solutionComment.trim() : '',
                    status: rtessIssueData.status
                }
            }
        });
    }

    if (error) {
        return (
            <Box textAlign={'center'} fontSize={'25px'} fontWeight={'medium'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
                {error}
            </Box>
        );
    }

    if (loadingRTESSIssue || (rtessIssueError && eventError && error !== false) || eventName === null || rtessIssueData === null) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Box margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
            <Box boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'} borderRadius={'10px'} padding={'10px'} marginBottom={'30px'}>
                <Text marginBottom={'20px'} fontWeight={'bold'} fontSize={'110%'}>
                    Competition: {eventName}
                </Text>
                <Text marginBottom={'20px'} fontWeight={'bold'} fontSize={'110%'}>
                    Team Number: {rtessIssueData.teamNumber}
                </Text>
                <Text marginBottom={'0px'} fontWeight={'bold'} fontSize={'110%'}>
                    Team Name: {rtessIssueData.teamName}
                </Text>
            </Box>

            <Box boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'} borderRadius={'10px'} padding={'10px'} marginBottom={'30px'}>
                <Text marginBottom={'20px'} fontWeight={'bold'} fontSize={'110%'}>
                    Reported by: {rtessIssueData.submitter}
                </Text>
                <Text marginBottom={'0px'} fontWeight={'bold'} fontSize={'110%'}>
                    Resolved by: {rtessIssueData.rtessMember || 'N/A'}
                </Text>
            </Box>

            <Box boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'} borderRadius={'10px'} padding={'10px'} marginBottom={'20px'}>
                <Text marginBottom={'20px'} fontWeight={'bold'} fontSize={'110%'}>
                    Issue(s): {rtessIssueData.issue}
                </Text>
                <Box marginBottom={'20px'} fontWeight={'bold'} fontSize={'110%'}>
                    Comment: {rtessIssueData.problemComment}
                </Box>
                <Text marginBottom={'10px'} fontWeight={'bold'} fontSize={'110%'}>
                    RTESS Comment:
                </Text>
                <Center marginBottom={'20px'}>
                    <Textarea
                        isInvalid={rtessIssueData.status === rtessIssuesStatus.resolved && submitAttempted && (!rtessIssueData.solutionComment || rtessIssueData.solutionComment.trim() === '')}
                        _focus={{
                            outline: 'none',
                            boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px'
                        }}
                        onChange={(event) => {
                            setRTESSIssueData({ ...rtessIssueData, solutionComment: event.target.value });
                        }}
                        value={rtessIssueData.solutionComment || ''}
                        placeholder='Any comments from RTESS?'
                        w={'85%'}
                    ></Textarea>
                </Center>
                <Text marginBottom={'10px'} fontWeight={'bold'} fontSize={'110%'}>
                    Resolved:
                </Text>
                <HStack marginBottom={'20px'} marginLeft={{ base: '10px', sm: '25px' }} spacing={'20px'}>
                    <Button
                        outline={'none'}
                        _focus={{ outline: 'none' }}
                        colorScheme={rtessIssueData.status === rtessIssuesStatus.resolved ? 'green' : 'gray'}
                        onClick={() => {
                            setRTESSIssueData({ ...rtessIssueData, status: rtessIssuesStatus.resolved });
                        }}
                    >
                        Yes
                    </Button>
                    <Button
                        outline={'none'}
                        _focus={{ outline: 'none' }}
                        colorScheme={rtessIssueData.status === rtessIssuesStatus.beingResolved ? 'green' : 'gray'}
                        onClick={() => {
                            setRTESSIssueData({ ...rtessIssueData, status: rtessIssuesStatus.beingResolved });
                        }}
                    >
                        Being Resolved
                    </Button>
                    <Button
                        outline={'none'}
                        _focus={{ outline: 'none' }}
                        colorScheme={rtessIssueData.status === rtessIssuesStatus.unresolved ? 'green' : 'gray'}
                        onClick={() => {
                            setRTESSIssueData({ ...rtessIssueData, status: rtessIssuesStatus.unresolved });
                        }}
                    >
                        No
                    </Button>
                </HStack>
            </Box>
            <Center>
                <Button isLoading={submitting} _focus={{ outline: 'none' }} marginBottom={'25px'} onClick={() => submit()}>
                    Submit
                </Button>
            </Center>
        </Box>
    );
}

export default RTESSIssuePage;

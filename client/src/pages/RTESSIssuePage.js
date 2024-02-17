import { React, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardBody,
    CardHeader,
    Center,
    Flex,
    Spinner,
    Stack,
    StackDivider,
    Text,
    Textarea,
    useToast
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { rtessIssuesStatus } from '../util/helperConstants';
import { v4 as uuidv4 } from 'uuid';

const statusOptions = [
    { id: uuidv4(), label: 'Yes', status: rtessIssuesStatus.resolved, color: 'green' },
    { id: uuidv4(), label: 'Being Resolved', status: rtessIssuesStatus.beingResolved, color: 'yellow' },
    { id: uuidv4(), label: 'No', status: rtessIssuesStatus.unresolved, color: 'red' }
];

function RTESSIssuePage() {
    const { id: idParam } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [eventName, setEventName] = useState(null);
    const [rtessIssue, setRTESSIssue] = useState(null);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/rtessIssue/getRTESSIssue', {
            headers: {
                filters: JSON.stringify({ _id: idParam })
            }
        })
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    throw new Error(response.statusText);
                }
            })
            .then((data) => {
                let rtessIssue = data;
                setRTESSIssue(rtessIssue);
                fetch('/event/getEvent', { headers: { filters: JSON.stringify({ key: rtessIssue.eventKey }) } })
                    .then((response) => {
                        if (response.status === 200) {
                            return response.json();
                        } else {
                            throw new Error(response.statusText);
                        }
                    })
                    .then((data) => {
                        setEventName(data.name);
                    })
                    .catch((error) => setError(error.message));
            })
            .catch((error) => setError(error.message));
    }, [idParam]);

    function validForm() {
        return (
            rtessIssue.status !== rtessIssuesStatus.resolved ||
            (rtessIssue.solutionComment && rtessIssue.solutionComment.trim() !== '')
        );
    }

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
        fetch('/rtessIssue/updateRTESSIssue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rtessIssue)
        })
            .then((response) => {
                if (response.status === 200) {
                    toast({
                        title: 'RTESS Issue Updated',
                        status: 'success',
                        duration: 3000,
                        isClosable: true
                    });
                    navigate('/rtessIssues/event');
                    setSubmitting(false);
                } else {
                    throw new Error(response.statusText);
                }
            })
            .catch((error) => {
                console.log(error);
                toast({
                    title: 'Error',
                    description: 'RTESS Issue could not be updated',
                    status: 'error',
                    duration: 3000,
                    isClosable: true
                });
                setSubmitting(false);
            });
    }

    if (error) {
        return (
            <Box
                fontSize={'lg'}
                fontWeight={'semibold'}
                textAlign={'center'}
                margin={'0 auto'}
                width={{ base: '85%', md: '66%', lg: '50%' }}
            >
                {error}
            </Box>
        );
    }

    if (rtessIssue === null || eventName === null) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Box margin={'0 auto'} marginBottom={'25px'} width={{ base: '85%', md: '66%', lg: '50%' }}>
            <Card
                size={'sm'}
                margin={'0 auto'}
                boxShadow={'0 1px 3px 0 rgba(0, 0, 0, 0.15),0 1px 2px 0 rgba(0, 0, 0, 0.06)'}
                marginBottom={'25px'}
            >
                <CardHeader paddingBottom={'2px'}>
                    <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                        Competition: {eventName}
                    </Text>
                </CardHeader>
                <CardBody>
                    <Stack divider={<StackDivider />} spacing={'2'}>
                        <Box textAlign={'center'}>
                            <Text fontSize={'md'} fontWeight={'semibold'}>
                                Team Number
                            </Text>
                            <Text fontSize={'md'} fontWeight={'medium'}>
                                {rtessIssue.teamNumber}
                            </Text>
                        </Box>
                        <Box textAlign={'center'}>
                            <Text fontSize={'md'} fontWeight={'semibold'}>
                                Team Name
                            </Text>
                            <Text fontSize={'md'} fontWeight={'medium'}>
                                {rtessIssue.teamName}
                            </Text>
                        </Box>
                    </Stack>
                </CardBody>
            </Card>

            <Card
                size={'sm'}
                margin={'0 auto'}
                boxShadow={'0 1px 3px 0 rgba(0, 0, 0, 0.15),0 1px 2px 0 rgba(0, 0, 0, 0.06)'}
                marginBottom={'25px'}
            >
                <CardBody>
                    <Stack divider={<StackDivider />} spacing={'2'}>
                        <Box textAlign={'center'}>
                            <Text fontSize={'md'} fontWeight={'semibold'}>
                                Reported By
                            </Text>
                            <Text fontSize={'md'} fontWeight={'medium'}>
                                {rtessIssue.submitter}
                            </Text>
                        </Box>
                        <Box textAlign={'center'}>
                            <Text fontSize={'md'} fontWeight={'semibold'}>
                                Resolved By
                            </Text>
                            <Text fontSize={'md'} fontWeight={'medium'}>
                                {rtessIssue.rtessMember || '-'}
                            </Text>
                        </Box>
                    </Stack>
                </CardBody>
            </Card>

            <Card
                size={'sm'}
                margin={'0 auto'}
                boxShadow={'0 1px 3px 0 rgba(0, 0, 0, 0.15),0 1px 2px 0 rgba(0, 0, 0, 0.06)'}
                marginBottom={'25px'}
            >
                <CardBody>
                    <Stack divider={<StackDivider />} spacing={'2'}>
                        <Box textAlign={'center'}>
                            <Text fontSize={'md'} fontWeight={'semibold'}>
                                Issue(s)
                            </Text>
                            <Text fontSize={'md'} fontWeight={'medium'}>
                                {rtessIssue.issue}
                            </Text>
                        </Box>
                        <Box textAlign={'center'}>
                            <Text fontSize={'md'} fontWeight={'semibold'}>
                                Initial Comment
                            </Text>
                            <Text fontSize={'md'} fontWeight={'medium'}>
                                {rtessIssue.problemComment}
                            </Text>
                        </Box>
                        <Box textAlign={'center'}>
                            <Text fontSize={'md'} fontWeight={'semibold'} marginBottom={'10px'}>
                                RTESS Comment
                            </Text>
                            <Textarea
                                isInvalid={
                                    rtessIssue.status === rtessIssuesStatus.resolved &&
                                    submitAttempted &&
                                    (!rtessIssue.solutionComment || rtessIssue.solutionComment.trim() === '')
                                }
                                onChange={(event) => {
                                    setRTESSIssue({ ...rtessIssue, solutionComment: event.target.value });
                                }}
                                value={rtessIssue.solutionComment || ''}
                                placeholder='Any comments from RTESS?'
                                w={'85%'}
                            ></Textarea>
                        </Box>
                        <Box textAlign={'center'}>
                            <Text fontSize={'md'} fontWeight={'semibold'} marginBottom={'5px'}>
                                Status
                            </Text>
                            <Flex justifyContent={'center'} alignItems={'center'} columnGap={'15px'}>
                                {statusOptions.map((status) => (
                                    <Button
                                        key={status.id}
                                        colorScheme={rtessIssue.status === status.status ? status.color : 'gray'}
                                        onClick={() => {
                                            setRTESSIssue({ ...rtessIssue, status: status.status });
                                        }}
                                    >
                                        {status.label}
                                    </Button>
                                ))}
                            </Flex>
                        </Box>
                    </Stack>
                </CardBody>
            </Card>
            <Center>
                <Button isLoading={submitting} _focus={{ outline: 'none' }} onClick={() => submit()}>
                    Submit
                </Button>
            </Center>
        </Box>
    );
}

export default RTESSIssuePage;

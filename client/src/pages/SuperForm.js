import { useMutation, useQuery } from '@apollo/client';
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Box,
    Button,
    Center,
    Checkbox,
    Flex,
    HStack,
    IconButton,
    Spinner,
    Text,
    Textarea,
    useToast,
    VStack,
} from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { GET_EVENT, GET_SUPERFORMS } from '../graphql/queries';
import { convertMatchKeyToString, deepEqual } from '../util/helperFunctions';
import { matchFormStatus } from '../util/helperConstants';
import { MdOutlineDoNotDisturbAlt } from 'react-icons/md';
import { UPDATE_SUPERFORMS } from '../graphql/mutations';
import CustomMinusButton from '../components/CustomMinusButton';
import CustomPlusButton from '../components/CustomPlusButton';
import { BsQuestionCircle } from 'react-icons/bs';
import { sum } from 'mathjs';

function SuperForm() {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    const cancelRef = useRef(null);
    const {
        eventKey: eventKeyParam,
        matchNumber: matchNumberParam,
        alliance: allianceParam,
        teamNumber1: teamNumber1Param,
        teamNumber2: teamNumber2Param,
        teamNumber3: teamNumber3Param,
    } = useParams();

    const [teamNumbers] = useState([teamNumber1Param, teamNumber2Param, teamNumber3Param]);
    const [teamNames, setTeamNames] = useState(null);
    const [eventName, setEventName] = useState(null);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [superFormDialog, setSuperFormDialog] = useState(false);
    const [loadResponse, setLoadResponse] = useState(null);
    const prevSuperFormData = useRef(null);
    const [superFormData, setSuperFormData] = useState(() => {
        let obj = { loading: true };
        for (const teamNumber of [teamNumber1Param, teamNumber2Param, teamNumber3Param]) {
            obj[teamNumber] = {
                defenseRating: 0,
                defenseAllocation: 0.25,
                quickness: 1,
                driverAwareness: 1,
                endComment: '',
                status: null,
                statusComment: '',
            };
        }
        return obj;
    });
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const { loading: loadingEvent, error: eventError } = useQuery(GET_EVENT, {
        fetchPolicy: 'network-only',
        variables: {
            key: eventKeyParam,
        },
        onError(err) {
            console.log(JSON.stringify(err, null, 2));
            setError('Apollo error, could not retrieve data on current event');
        },
        onCompleted({ getEvent: event }) {
            setEventName(event.name);
        },
    });

    useEffect(() => {
        if (localStorage.getItem('SuperFormData')) {
            let superForm = JSON.parse(localStorage.getItem('SuperFormData'));
            if (superForm.eventKeyParam === eventKeyParam && superForm.matchNumberParam === matchNumberParam && superForm.allianceParam === allianceParam) {
                setLoadResponse('Required');
                setSuperFormDialog(true);
            } else {
                setLoadResponse(false);
            }
        } else {
            setLoadResponse(false);
        }
    }, [eventKeyParam, matchNumberParam, allianceParam]);

    useEffect(() => {
        async function getTeamNames() {
            if (teamNumbers) {
                if (sum(teamNumbers) === 0) {
                    //Means this can only really happen if its a custom event
                    setTeamNames(['N/A', 'N/A', 'N/A']);
                } else {
                    let fetches = [];
                    for (let team of teamNumbers) {
                        fetches.push(fetch(`/blueAlliance/team/frc${team}/simple`));
                    }
                    let responses = await Promise.all(fetches).catch((error) => console.log(error));
                    let jsonResponses = await Promise.all(responses.map((response) => response.json())).catch((error) => console.log(error));
                    console.log(jsonResponses);
                    let teamNames = [];
                    for (let teamNumber of teamNumbers) {
                        let teamData = jsonResponses.find((team) => team.team_number === parseInt(teamNumber));
                        teamNames.push(teamData.nickname);
                    }
                    setTeamNames(teamNames);
                }
            }
        }
        getTeamNames();
    }, [teamNumbers, eventKeyParam]);

    const { loading: loadingSuperData, error: superDataError } = useQuery(GET_SUPERFORMS, {
        skip: loadResponse === null || loadResponse,
        fetchPolicy: 'network-only',
        variables: {
            eventKey: eventKeyParam,
            matchNumber: matchNumberParam,
            station: [`${allianceParam}1`, `${allianceParam}2`, `${allianceParam}3`],
            superStatus: [matchFormStatus.complete, matchFormStatus.noShow, matchFormStatus.followUp, matchFormStatus.inconclusive],
        },
        onError(err) {
            console.log(JSON.stringify(err, null, 2));
            setError(`Apollo error, could not retrieve match form`);
        },
        onCompleted({ getMatchForms: matchForms }) {
            let data = JSON.parse(JSON.stringify(superFormData));
            data.loading = false;
            for (const matchForm of matchForms) {
                data[matchForm.teamNumber] = {
                    defenseRating: matchForm.defenseRating,
                    defenseAllocation: matchForm.defenseAllocation,
                    quickness: matchForm.quickness,
                    driverAwareness: matchForm.driverAwareness,
                    endComment: matchForm.superEndComment,
                    status: matchForm.superStatus,
                    statusComment: matchForm.superStatusComment,
                };
            }
            prevSuperFormData.current = JSON.parse(JSON.stringify(data));
            setSuperFormData(data);
        },
    });

    useEffect(() => {
        if (prevSuperFormData.current !== null) {
            if (!deepEqual(prevSuperFormData.current, superFormData)) {
                localStorage.setItem('SuperFormData', JSON.stringify({ ...superFormData, eventKeyParam, matchNumberParam, allianceParam }));
            }
        }
        prevSuperFormData.current = JSON.parse(JSON.stringify(superFormData));
    }, [superFormData, eventKeyParam, matchNumberParam, allianceParam]);

    function isFollowOrNoShow(teamNumber) {
        return [matchFormStatus.followUp, matchFormStatus.noShow].includes(superFormData[teamNumber].status);
    }

    function isValid(teamNumber) {
        return superFormData[teamNumber].statusComment.trim() !== '';
    }

    const [updateSuperForms] = useMutation(UPDATE_SUPERFORMS, {
        onCompleted() {
            toast({
                title: 'Match Form Updated',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            if (location.state && location.state.previousRoute) {
                if (location.state.previousRoute === 'matches') {
                    navigate('/matches');
                } else if (location.state.previousRoute === 'team') {
                    navigate(`/team/${location.state.teamNumber}/super`);
                }
            } else {
                navigate('/');
            }
            setSubmitting(false);
            localStorage.removeItem('SuperFormData');
        },
        onError(err) {
            console.log(JSON.stringify(err, null, 2));
            toast({
                title: 'Apollo Error',
                description: 'Match form could not be updated',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            setSubmitting(false);
        },
    });

    function submit() {
        setSubmitAttempted(true);
        for (const teamNumber of teamNumbers) {
            if (isFollowOrNoShow(teamNumber) && !isValid(teamNumber)) {
                toast({
                    title: 'Missing fields',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
                return;
            }
        }
        setSubmitting(true);
        updateSuperForms({
            variables: {
                matchFormInputs: teamNumbers.map((teamNumber, index) => ({
                    eventKey: eventKeyParam,
                    eventName: eventName,
                    station: `${allianceParam}${index + 1}`,
                    matchNumber: matchNumberParam,
                    teamNumber: parseInt(teamNumber),
                    teamName: teamNames[index],
                    allianceNumbers: [teamNumbers[0], teamNumbers[1], teamNumbers[2]],
                    defenseRating: superFormData[teamNumber].defenseRating,
                    defenseAllocation: superFormData[teamNumber].defenseRating > 0 ? superFormData[teamNumber].defenseAllocation : 0,
                    quickness: superFormData[teamNumber].quickness,
                    driverAwareness: superFormData[teamNumber].driverAwareness,
                    superEndComment: superFormData[teamNumber].status === matchFormStatus.noShow ? '' : superFormData[teamNumber].endComment.trim(),
                    superStatus: superFormData[teamNumber].status || matchFormStatus.complete,
                    superStatusComment: isFollowOrNoShow(teamNumber) ? superFormData[teamNumber].statusComment.trim() : '',
                })),
            },
        });
    }

    if (error) {
        return (
            <Box textAlign={'center'} fontSize={'25px'} fontWeight={'medium'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
                {error}
            </Box>
        );
    }

    if (loadResponse === 'Required') {
        return (
            <AlertDialog
                closeOnEsc={false}
                closeOnOverlayClick={false}
                isOpen={superFormDialog}
                leastDestructiveRef={cancelRef}
                onClose={() => {
                    setSuperFormDialog(false);
                }}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent margin={0} w={{ base: '75%', md: '40%', lg: '30%' }} top='25%'>
                        <AlertDialogHeader color='black' fontSize='lg' fontWeight='bold'>
                            Unsaved Data
                        </AlertDialogHeader>
                        <AlertDialogBody>You have unsaved data for this super form. Would you like to load it, delete it, or pull data from the cloud?</AlertDialogBody>
                        <AlertDialogFooter>
                            <Button
                                onClick={() => {
                                    setSuperFormDialog(false);
                                    setLoadResponse(false);
                                    localStorage.removeItem('SuperFormData');
                                }}
                                _focus={{ outline: 'none', boxShadow: 'none' }}
                                colorScheme='red'
                            >
                                Delete
                            </Button>
                            <Button
                                colorScheme='yellow'
                                ml={3}
                                _focus={{ outline: 'none', boxShadow: 'none' }}
                                onClick={() => {
                                    setSuperFormDialog(false);
                                    setLoadResponse(false);
                                }}
                            >
                                Cloud
                            </Button>
                            <Button
                                colorScheme='blue'
                                ml={3}
                                _focus={{ outline: 'none', boxShadow: 'none' }}
                                onClick={() => {
                                    setSuperFormDialog(false);
                                    setLoadResponse(true);
                                    let matchForm = JSON.parse(localStorage.getItem('SuperFormData'));
                                    matchForm.loading = false;
                                    setSuperFormData(matchForm);
                                }}
                            >
                                Load
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        );
    }

    if (superFormData.loading || loadingSuperData || loadingEvent || (superDataError && eventError && error !== false) || teamNames === null || eventName === null) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Box margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
            <Center marginBottom={'35px'}>
                <Text textAlign={'center'} minW={'130px'} fontWeight={'bold'} fontSize={'110%'}>
                    {convertMatchKeyToString(matchNumberParam)} • {allianceParam === 'r' ? 'Red' : 'Blue'}
                </Text>
            </Center>
            {teamNumbers.map((teamNumber, index) => (
                <Box
                    position={'relative'}
                    key={teamNumber.toString() + index.toString()} // stupid solution but w/e
                    boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'}
                    borderRadius={'10px'}
                    padding={'10px'}
                    marginBottom={'30px'}
                >
                    <HStack position={'absolute'} right={'10px'} top={'8px'} spacing={'10px'}>
                        <IconButton
                            onClick={() => {
                                let teamData = { ...superFormData };
                                teamData[teamNumber].status = teamData[teamNumber].status === matchFormStatus.inconclusive ? null : matchFormStatus.inconclusive;
                                setSuperFormData(teamData);
                            }}
                            icon={<BsQuestionCircle />}
                            colorScheme={superFormData[teamNumber].status === matchFormStatus.inconclusive ? 'yellow' : 'black'}
                            variant={superFormData[teamNumber].status === matchFormStatus.inconclusive ? 'solid' : 'outline'}
                            _focus={{ outline: 'none' }}
                            size='sm'
                        />
                        <IconButton
                            onClick={() => {
                                let teamData = { ...superFormData };
                                teamData[teamNumber].status = teamData[teamNumber].status === matchFormStatus.noShow ? null : matchFormStatus.noShow;
                                setSuperFormData(teamData);
                            }}
                            icon={<MdOutlineDoNotDisturbAlt />}
                            colorScheme={superFormData[teamNumber].status === matchFormStatus.noShow ? 'red' : 'black'}
                            variant={superFormData[teamNumber].status === matchFormStatus.noShow ? 'solid' : 'outline'}
                            _focus={{ outline: 'none' }}
                            size='sm'
                        />
                    </HStack>
                    <Text marginBottom={'20px'} fontWeight={'bold'} fontSize={'110%'}>
                        Team Number: {teamNumber}
                    </Text>
                    <Flex marginBottom={'25px'} flexWrap={'wrap'} flexDirection={'row'} rowGap={'15px'}>
                        <VStack flex={'50%'}>
                            <Text minWidth={'95px'} maxWidth={'95px'} textAlign={'center'} fontWeight={'bold'} fontSize={'110%'}>
                                Defense Rating:
                            </Text>
                            <HStack>
                                <CustomMinusButton
                                    disabled={[matchFormStatus.noShow, matchFormStatus.inconclusive].includes(superFormData[teamNumber].status)}
                                    onClick={() => {
                                        let teamData = { ...superFormData };
                                        teamData[teamNumber].defenseRating = Math.max(teamData[teamNumber].defenseRating - 1, 0);
                                        setSuperFormData(teamData);
                                    }}
                                    fontSize={'20px'}
                                />
                                <Text color={[matchFormStatus.noShow, matchFormStatus.inconclusive].includes(superFormData[teamNumber].status) && 'gray.400'} textAlign={'center'} minWidth={'39px'}>
                                    {superFormData[teamNumber].defenseRating || 'None'}
                                </Text>
                                <CustomPlusButton
                                    disabled={[matchFormStatus.noShow, matchFormStatus.inconclusive].includes(superFormData[teamNumber].status)}
                                    onClick={() => {
                                        let teamData = { ...superFormData };
                                        teamData[teamNumber].defenseRating = Math.min(teamData[teamNumber].defenseRating + 1, 3);
                                        setSuperFormData(teamData);
                                    }}
                                    fontSize={'20px'}
                                />
                            </HStack>
                        </VStack>
                        <VStack flex={'50%'}>
                            <Text minWidth={'95px'} maxWidth={'95px'} textAlign={'center'} fontWeight={'bold'} fontSize={'110%'}>
                                Defense Allocation:
                            </Text>
                            <HStack>
                                <CustomMinusButton
                                    disabled={[matchFormStatus.noShow, matchFormStatus.inconclusive].includes(superFormData[teamNumber].status) || superFormData[teamNumber].defenseRating === 0}
                                    onClick={() => {
                                        let teamData = { ...superFormData };
                                        teamData[teamNumber].defenseAllocation = Math.max(teamData[teamNumber].defenseAllocation - 0.25, 0.25);
                                        setSuperFormData(teamData);
                                    }}
                                    fontSize={'20px'}
                                />
                                <Text
                                    color={
                                        ([matchFormStatus.noShow, matchFormStatus.inconclusive].includes(superFormData[teamNumber].status) || superFormData[teamNumber].defenseRating === 0) &&
                                        'gray.400'
                                    }
                                    textAlign={'center'}
                                    minWidth={'39px'}
                                >
                                    {superFormData[teamNumber].defenseAllocation * 100}%
                                </Text>
                                <CustomPlusButton
                                    disabled={[matchFormStatus.noShow, matchFormStatus.inconclusive].includes(superFormData[teamNumber].status) || superFormData[teamNumber].defenseRating === 0}
                                    onClick={() => {
                                        let teamData = { ...superFormData };
                                        teamData[teamNumber].defenseAllocation = Math.min(teamData[teamNumber].defenseAllocation + 0.25, 1.0);
                                        setSuperFormData(teamData);
                                    }}
                                    fontSize={'20px'}
                                />
                            </HStack>
                        </VStack>
                        <VStack flex={'50%'}>
                            <Center minHeight={'53px'} minWidth={'95px'} maxWidth={'95px'} textAlign={'center'} fontWeight={'bold'} fontSize={'110%'}>
                                Quickness:
                            </Center>
                            <HStack>
                                <CustomMinusButton
                                    disabled={[matchFormStatus.noShow, matchFormStatus.inconclusive].includes(superFormData[teamNumber].status)}
                                    onClick={() => {
                                        let teamData = { ...superFormData };
                                        teamData[teamNumber].quickness = Math.max(teamData[teamNumber].quickness - 1, 1);
                                        setSuperFormData(teamData);
                                    }}
                                    fontSize={'20px'}
                                />
                                <Text color={[matchFormStatus.noShow, matchFormStatus.inconclusive].includes(superFormData[teamNumber].status) && 'gray.400'} textAlign={'center'}>
                                    {superFormData[teamNumber].quickness}
                                </Text>
                                <CustomPlusButton
                                    disabled={[matchFormStatus.noShow, matchFormStatus.inconclusive].includes(superFormData[teamNumber].status)}
                                    onClick={() => {
                                        let teamData = { ...superFormData };
                                        teamData[teamNumber].quickness = Math.min(teamData[teamNumber].quickness + 1, 3);
                                        setSuperFormData(teamData);
                                    }}
                                    fontSize={'20px'}
                                />
                            </HStack>
                        </VStack>
                        <VStack flex={'50%'}>
                            <Text minWidth={'95px'} maxWidth={'95px'} textAlign={'center'} fontWeight={'bold'} fontSize={'110%'}>
                                Driver Awareness:
                            </Text>
                            <HStack>
                                <CustomMinusButton
                                    disabled={[matchFormStatus.noShow, matchFormStatus.inconclusive].includes(superFormData[teamNumber].status)}
                                    onClick={() => {
                                        let teamData = { ...superFormData };
                                        teamData[teamNumber].driverAwareness = Math.max(teamData[teamNumber].driverAwareness - 1, 1);
                                        setSuperFormData(teamData);
                                    }}
                                    fontSize={'20px'}
                                />
                                <Text color={[matchFormStatus.noShow, matchFormStatus.inconclusive].includes(superFormData[teamNumber].status) && 'gray.400'} textAlign={'center'}>
                                    {superFormData[teamNumber].driverAwareness}
                                </Text>
                                <CustomPlusButton
                                    disabled={[matchFormStatus.noShow, matchFormStatus.inconclusive].includes(superFormData[teamNumber].status)}
                                    onClick={() => {
                                        let teamData = { ...superFormData };
                                        teamData[teamNumber].driverAwareness = Math.min(teamData[teamNumber].driverAwareness + 1, 3);
                                        setSuperFormData(teamData);
                                    }}
                                    fontSize={'20px'}
                                />
                            </HStack>
                        </VStack>
                    </Flex>
                    {superFormData[teamNumber].status !== matchFormStatus.noShow && (
                        <React.Fragment>
                            <Text marginBottom={'10px'} fontWeight={'bold'} fontSize={'110%'}>
                                Ending Comment:
                            </Text>
                            <Center marginBottom={'25px'}>
                                <Textarea
                                    _focus={{ outline: 'none', boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px' }}
                                    onChange={(event) => {
                                        let teamData = { ...superFormData };
                                        teamData[teamNumber].endComment = event.target.value;
                                        setSuperFormData(teamData);
                                    }}
                                    value={superFormData[teamNumber].endComment}
                                    placeholder='Any ending comments'
                                    w={'85%'}
                                ></Textarea>
                            </Center>
                        </React.Fragment>
                    )}
                    {superFormData[teamNumber].status !== matchFormStatus.noShow && (
                        <Center marginBottom={'10px'}>
                            <Checkbox
                                //removes the blue outline on focus
                                css={`
                                    > span:first-of-type {
                                        box-shadow: unset;
                                    }
                                `}
                                colorScheme={'green'}
                                isChecked={superFormData[teamNumber].status === matchFormStatus.followUp}
                                onChange={() => {
                                    let teamData = { ...superFormData };
                                    teamData[teamNumber].status = teamData[teamNumber].status === matchFormStatus.followUp ? null : matchFormStatus.followUp;
                                    setSuperFormData(teamData);
                                }}
                            >
                                Mark For Follow Up
                            </Checkbox>
                        </Center>
                    )}
                    {isFollowOrNoShow(teamNumber) ? (
                        <Center marginBottom={'10px'}>
                            <Textarea
                                isInvalid={submitAttempted && superFormData[teamNumber].statusComment.trim() === ''}
                                _focus={{ outline: 'none', boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px' }}
                                onChange={(event) => {
                                    let teamData = { ...superFormData };
                                    teamData[teamNumber].statusComment = event.target.value;
                                    setSuperFormData(teamData);
                                }}
                                value={superFormData[teamNumber].statusComment}
                                placeholder={`What is the reason for the ${superFormData[teamNumber].status.toLowerCase()}?`}
                                w={'85%'}
                            ></Textarea>
                        </Center>
                    ) : null}
                </Box>
            ))}
            <Center>
                <Button isDisabled={submitting} _focus={{ outline: 'none' }} marginBottom={'20px'} marginTop={'0px'} onClick={() => submit()}>
                    Submit
                </Button>
            </Center>
        </Box>
    );
}

export default SuperForm;

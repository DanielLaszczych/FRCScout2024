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
    Spinner,
    Text,
    Textarea,
    useToast,
    VStack
} from '@chakra-ui/react';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { convertMatchKeyToString, deepEqual } from '../util/helperFunctions';
import { matchFormStatus } from '../util/helperConstants';
import CustomMinusButton from '../components/CustomMinusButton';
import CustomPlusButton from '../components/CustomPlusButton';
import { GlobalContext } from '../context/globalState';
import QRCode from 'react-qr-code';

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
        teamNumber3: teamNumber3Param
    } = useParams();
    const { offline } = useContext(GlobalContext);

    const [teamNumbers] = useState([teamNumber1Param, teamNumber2Param, teamNumber3Param]);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [superFormDialog, setSuperFormDialog] = useState(false);
    const [loadResponse, setLoadResponse] = useState(null);
    const prevSuperFormData = useRef(null);
    const [superFormData, setSuperFormData] = useState(() => {
        let obj = { loading: true };
        for (const teamNumber of [teamNumber1Param, teamNumber2Param, teamNumber3Param]) {
            obj[teamNumber] = {
                agility: 1,
                fieldAwareness: 1,
                superStatus: null,
                superStatusComment: ''
            };
        }
        return obj;
    });
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);

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
        if (loadResponse === false && superFormData.loading) {
            if (offline) {
                setSuperFormData({ ...superFormData, loading: false });
            } else {
                const headers = {
                    filters: JSON.stringify({
                        eventKey: eventKeyParam,
                        matchNumber: matchNumberParam,
                        station: [`${allianceParam}1`, `${allianceParam}2`, `${allianceParam}3`],
                        superStatus: [matchFormStatus.complete, matchFormStatus.noShow, matchFormStatus.followUp]
                    })
                };
                fetch('/matchForm/getMatchForms', {
                    headers: headers
                })
                    .then((response) => {
                        if (response.status === 200) {
                            return response.json();
                        } else {
                            throw new Error(response.statusText);
                        }
                    })
                    .then((data) => {
                        console.log(data);
                        let modified = { ...superFormData };
                        modified.loading = false;
                        for (const matchForm of data) {
                            modified[matchForm.teamNumber] = {
                                agility: matchForm.agility,
                                fieldAwareness: matchForm.fieldAwareness,
                                superStatus: matchForm.superStatus,
                                superStatusComment: matchForm.superStatusComment
                            };
                        }
                        setSuperFormData(modified);
                    })
                    .catch((error) => setError(error.message));
            }
        }
    }, [loadResponse, eventKeyParam, matchNumberParam, allianceParam, superFormData, offline]);

    useEffect(() => {
        if (prevSuperFormData.current !== null) {
            if (!deepEqual(prevSuperFormData.current, superFormData)) {
                localStorage.setItem('SuperFormData', JSON.stringify({ ...superFormData, eventKeyParam, matchNumberParam, allianceParam }));
            }
        }
        if (superFormData.loading === false) {
            prevSuperFormData.current = JSON.parse(JSON.stringify(superFormData));
        }
    }, [superFormData, eventKeyParam, matchNumberParam, allianceParam]);

    function isFollowOrNoShow(teamNumber) {
        return [matchFormStatus.followUp, matchFormStatus.noShow].includes(superFormData[teamNumber].superStatus);
    }

    function isValid(teamNumber) {
        return superFormData[teamNumber].superStatusComment.trim() !== '';
    }

    useEffect(() => {
        if (showQRCode) window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: 'smooth' });
    }, [showQRCode]);

    function submit() {
        setSubmitAttempted(true);
        for (const teamNumber of teamNumbers) {
            if (isFollowOrNoShow(teamNumber) && !isValid(teamNumber)) {
                toast({
                    title: 'Missing fields',
                    status: 'error',
                    duration: 3000,
                    isClosable: true
                });
                return;
            }
        }
        if (offline) {
            setShowQRCode(true);
            return;
        }
        setSubmitting(true);
        fetch('/matchForm/postSuperForm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
                teamNumbers.map((teamNumber, index) => ({
                    eventKey: eventKeyParam,
                    matchNumber: matchNumberParam,
                    station: `${allianceParam}${index + 1}`,
                    teamNumber: parseInt(teamNumber),
                    allianceNumbers: [teamNumbers[0], teamNumbers[1], teamNumbers[2]],
                    ...superFormData[teamNumber],
                    superStatus: superFormData[teamNumber].superStatus || matchFormStatus.complete,
                    superStatusComment: isFollowOrNoShow(teamNumber) ? superFormData[teamNumber].superStatusComment.trim() : ''
                }))
            )
        })
            .then((response) => {
                if (response.status === 200) {
                    toast({
                        title: 'Match Form Updated',
                        status: 'success',
                        duration: 3000,
                        isClosable: true
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
                } else {
                    throw new Error(response.statusText);
                }
            })
            .catch((error) => {
                console.log(error);
                toast({
                    title: 'Error',
                    description: 'Match form could not be submitted',
                    status: 'error',
                    duration: 3000,
                    isClosable: true
                });
                setSubmitting(false);
            });
    }

    function getQRValue() {
        return JSON.stringify(
            teamNumbers.map((teamNumber, index) => ({
                eventKey: eventKeyParam,
                matchNumber: matchNumberParam,
                station: `${allianceParam}${index + 1}`,
                teamNumber: parseInt(teamNumber),
                allianceNumbers: [teamNumbers[0], teamNumbers[1], teamNumbers[2]],
                ...superFormData[teamNumber],
                superStatus: superFormData[teamNumber].superStatus || matchFormStatus.complete,
                superStatusComment: isFollowOrNoShow(teamNumber) ? superFormData[teamNumber].superStatusComment.trim() : ''
            }))
        );
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
                            {!offline && (
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
                            )}
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

    if (superFormData.loading) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Box margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
            <Text textAlign={'center'} marginBottom={'10px'} fontWeight={'bold'} fontSize={'larger'}>
                {convertMatchKeyToString(matchNumberParam)} • {allianceParam === 'r' ? 'Red' : 'Blue'}
            </Text>
            {teamNumbers.map((teamNumber, index) => (
                <Box
                    key={teamNumber.toString() + index.toString()} // stupid solution but w/e
                    marginBottom={'15px'}
                >
                    <Text textAlign={'center'} fontWeight={'bold'} fontSize={'large'} borderBottom={'2px solid black'} margin={'0 auto'} marginBottom={'10px'} width={'112px'}>
                        {teamNumber}
                    </Text>
                    <Flex marginBottom={'20px'}>
                        <VStack flex={'50%'} gap={'5px'}>
                            <Center height={'48px'} width={'95px'} textAlign={'center'} fontWeight={'bold'}>
                                Agility:
                            </Center>
                            <HStack>
                                <CustomMinusButton
                                    disabled={superFormData[teamNumber].superStatus === matchFormStatus.noShow}
                                    onClick={() => {
                                        let teamData = { ...superFormData };
                                        teamData[teamNumber].agility = Math.max(teamData[teamNumber].agility - 1, 1);
                                        setSuperFormData(teamData);
                                    }}
                                    fontSize={'20px'}
                                />
                                <Text color={superFormData[teamNumber].superStatus === matchFormStatus.noShow && 'gray.400'} textAlign={'center'}>
                                    {superFormData[teamNumber].agility}
                                </Text>
                                <CustomPlusButton
                                    disabled={superFormData[teamNumber].superStatus === matchFormStatus.noShow}
                                    onClick={() => {
                                        let teamData = { ...superFormData };
                                        teamData[teamNumber].agility = Math.min(teamData[teamNumber].agility + 1, 3);
                                        setSuperFormData(teamData);
                                    }}
                                    fontSize={'20px'}
                                />
                            </HStack>
                        </VStack>
                        <VStack flex={'50%'} gap={'5px'}>
                            <Text width={'95px'} textAlign={'center'} fontWeight={'bold'}>
                                Field Awareness:
                            </Text>
                            <HStack>
                                <CustomMinusButton
                                    disabled={superFormData[teamNumber].superStatus === matchFormStatus.noShow}
                                    onClick={() => {
                                        let teamData = { ...superFormData };
                                        teamData[teamNumber].fieldAwareness = Math.max(teamData[teamNumber].fieldAwareness - 1, 1);
                                        setSuperFormData(teamData);
                                    }}
                                    fontSize={'20px'}
                                />
                                <Text color={superFormData[teamNumber].superStatus === matchFormStatus.noShow && 'gray.400'} textAlign={'center'}>
                                    {superFormData[teamNumber].fieldAwareness}
                                </Text>
                                <CustomPlusButton
                                    disabled={superFormData[teamNumber].superStatus === matchFormStatus.noShow}
                                    onClick={() => {
                                        let teamData = { ...superFormData };
                                        teamData[teamNumber].fieldAwareness = Math.min(teamData[teamNumber].fieldAwareness + 1, 3);
                                        setSuperFormData(teamData);
                                    }}
                                    fontSize={'20px'}
                                />
                            </HStack>
                        </VStack>
                    </Flex>
                    <HStack justifyContent={'center'} gap={'25px'} marginBottom={[matchFormStatus.followUp, matchFormStatus.noShow].includes(superFormData[teamNumber].superStatus) ? '15px' : '0px'}>
                        <Checkbox
                            //removes the blue outline on focus
                            // css={`
                            //     > span:first-of-type {
                            //         box-shadow: unset;
                            //     }
                            // `}
                            colorScheme={'green'}
                            isChecked={superFormData[teamNumber].superStatus === matchFormStatus.followUp}
                            onChange={() => {
                                let teamData = { ...superFormData };
                                teamData[teamNumber].superStatus = teamData[teamNumber].superStatus === matchFormStatus.followUp ? null : matchFormStatus.followUp;
                                setSuperFormData(teamData);
                            }}
                            width={'100px'}
                        >
                            Mark For Follow Up
                        </Checkbox>
                        <Checkbox
                            //removes the blue outline on focus
                            // css={`
                            //     > span:first-of-type {
                            //         box-shadow: unset;
                            //     }
                            // `}
                            colorScheme={'green'}
                            isChecked={superFormData[teamNumber].superStatus === matchFormStatus.noShow}
                            onChange={() => {
                                let teamData = { ...superFormData };
                                teamData[teamNumber].superStatus = teamData[teamNumber].superStatus === matchFormStatus.noShow ? null : matchFormStatus.noShow;
                                setSuperFormData(teamData);
                            }}
                            width={'100px'}
                        >
                            No Show
                        </Checkbox>
                    </HStack>
                    {isFollowOrNoShow(teamNumber) ? (
                        <Textarea
                            isInvalid={submitAttempted && superFormData[teamNumber].superStatusComment.trim() === ''}
                            _focus={{ outline: 'none', boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px' }}
                            onChange={(event) => {
                                let teamData = { ...superFormData };
                                teamData[teamNumber].superStatusComment = event.target.value;
                                setSuperFormData(teamData);
                            }}
                            value={superFormData[teamNumber].superStatusComment}
                            placeholder={`What is the reason for the ${superFormData[teamNumber].superStatus.toLowerCase()}?`}
                            margin={'0 auto'}
                        ></Textarea>
                    ) : null}
                </Box>
            ))}
            <Center>
                <Button isDisabled={submitting} _focus={{ outline: 'none' }} marginBottom={'20px'} marginTop={'0px'} onClick={() => submit()}>
                    Submit
                </Button>
            </Center>
            {showQRCode && (
                <Center margin={'10px 0px 40px 0px'}>
                    <QRCode value={getQRValue()} />
                </Center>
            )}
        </Box>
    );
}

export default SuperForm;

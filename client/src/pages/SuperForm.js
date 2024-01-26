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
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Text,
    Textarea,
    useDisclosure,
    useToast,
    VStack
} from '@chakra-ui/react';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { convertMatchKeyToString, deepEqual } from '../util/helperFunctions';
import { matchFormStatus } from '../util/helperConstants';
import { GlobalContext } from '../context/globalState';
import QRCode from 'react-qr-code';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';

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
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [teamNumbers] = useState([teamNumber1Param, teamNumber2Param, teamNumber3Param]);
    const [stations] = useState([`${allianceParam}1`, `${allianceParam}2`, `${allianceParam}3`]);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [superFormDialog, setSuperFormDialog] = useState(false);
    const [loadResponse, setLoadResponse] = useState(null);
    const prevSuperFormData = useRef(null);
    const [superFormData, setSuperFormData] = useState(() => {
        let obj = { loading: true };
        for (const station of stations) {
            obj[station] = {
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
                            modified[matchForm.station] = {
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

    function isFollowOrNoShow(station) {
        return [matchFormStatus.followUp, matchFormStatus.noShow].includes(superFormData[station].superStatus);
    }

    function isValid(station) {
        return superFormData[station].superStatusComment.trim() !== '';
    }

    function submit() {
        setSubmitAttempted(true);
        for (const station of stations) {
            if (isFollowOrNoShow(station) && !isValid(station)) {
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
            onOpen();
            return;
        }
        setSubmitting(true);
        fetch('/matchForm/postSuperForm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
                stations.map((station, index) => ({
                    ...superFormData[station],
                    eventKey: eventKeyParam,
                    matchNumber: matchNumberParam,
                    station: station,
                    teamNumber: parseInt(teamNumbers[index]),
                    allianceNumbers: [teamNumbers[0], teamNumbers[1], teamNumbers[2]],
                    superStatus: superFormData[station].superStatus || matchFormStatus.complete,
                    superStatusComment: isFollowOrNoShow(station) ? superFormData[station].superStatusComment.trim() : ''
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
        let map = {
            null: 'n',
            Complete: 'cp',
            'Follow Up': 'fu',
            'No Show': 'ns',
            Missing: 'ms' //Dont think this is ever needed
        };
        return [
            eventKeyParam,
            matchNumberParam,
            allianceParam,
            ...stations.map((station, index) =>
                [
                    teamNumbers[index],
                    superFormData[station].agility,
                    superFormData[station].fieldAwareness,
                    map[superFormData[station].superStatus || matchFormStatus.complete],
                    isFollowOrNoShow(station) ? (superFormData[station].superStatusComment.trim() === '' ? 'n' : superFormData[station].superStatusComment.trim()) : 'n'
                ].join('#')
            )
        ].join('$');
    }

    if (error) {
        return (
            <Box textAlign={'center'} fontSize={'lg'} fontWeight={'semibold'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
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
                    <AlertDialogContent width={{ base: '75%', md: '40%', lg: '30%' }} marginTop={'25dvh'}>
                        <AlertDialogHeader fontSize={'lg'} fontWeight={'semibold'}>
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
                                colorScheme='red'
                            >
                                Delete
                            </Button>
                            {!offline && (
                                <Button
                                    colorScheme='yellow'
                                    ml={3}
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
                                ref={cancelRef}
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
            <Text textAlign={'center'} marginBottom={'10px'} fontSize={'xl'} fontWeight={'semibold'}>
                {convertMatchKeyToString(matchNumberParam)} • {allianceParam === 'r' ? 'Red' : 'Blue'}
            </Text>
            {stations.map((station, index) => (
                <Box
                    key={station} // stupid solution but w/e
                    marginBottom={'15px'}
                >
                    <Text textAlign={'center'} fontSize={'lg'} fontWeight={'semibold'} borderBottom={'1px solid black'} margin={'0 auto'} marginBottom={'10px'} width={'112px'}>
                        {teamNumbers[index]}
                    </Text>
                    <Flex marginBottom={'20px'}>
                        <VStack flex={'50%'} gap={'5px'}>
                            <Center textAlign={'center'} fontSize={'lg'} fontWeight={'semibold'}>
                                Agility
                            </Center>
                            <HStack gap={'15px'}>
                                <IconButton
                                    isDisabled={superFormData[station].superStatus === matchFormStatus.noShow}
                                    onClick={() => {
                                        let teamData = { ...superFormData };
                                        teamData[station].agility = Math.max(teamData[station].agility - 1, 1);
                                        setSuperFormData(teamData);
                                    }}
                                    icon={<MinusIcon />}
                                    size={'md'}
                                    colorScheme={'red'}
                                />
                                <Text
                                    fontSize={'lg'}
                                    fontWeight={'semibold'}
                                    textAlign={'center'}
                                    minWidth={'10px'}
                                    color={superFormData[station].superStatus === matchFormStatus.noShow && 'gray.400'}
                                >
                                    {superFormData[station].agility}
                                </Text>
                                <IconButton
                                    isDisabled={superFormData[station].superStatus === matchFormStatus.noShow}
                                    onClick={() => {
                                        let teamData = { ...superFormData };
                                        teamData[station].agility = Math.min(teamData[station].agility + 1, 3);
                                        setSuperFormData(teamData);
                                    }}
                                    icon={<AddIcon />}
                                    size={'md'}
                                    colorScheme={'green'}
                                />
                            </HStack>
                        </VStack>
                        <VStack flex={'50%'} gap={'5px'}>
                            <Text textAlign={'center'} fontSize={'lg'} fontWeight={'semibold'}>
                                Field Aware
                            </Text>
                            <HStack gap={'15px'}>
                                <IconButton
                                    isDisabled={superFormData[station].superStatus === matchFormStatus.noShow}
                                    onClick={() => {
                                        let teamData = { ...superFormData };
                                        teamData[station].fieldAwareness = Math.max(teamData[station].fieldAwareness - 1, 1);
                                        setSuperFormData(teamData);
                                    }}
                                    icon={<MinusIcon />}
                                    size={'md'}
                                    colorScheme={'red'}
                                />
                                <Text
                                    fontSize={'lg'}
                                    fontWeight={'semibold'}
                                    textAlign={'center'}
                                    minWidth={'10px'}
                                    color={superFormData[station].superStatus === matchFormStatus.noShow && 'gray.400'}
                                >
                                    {superFormData[station].fieldAwareness}
                                </Text>
                                <IconButton
                                    isDisabled={superFormData[station].superStatus === matchFormStatus.noShow}
                                    onClick={() => {
                                        let teamData = { ...superFormData };
                                        teamData[station].fieldAwareness = Math.min(teamData[station].fieldAwareness + 1, 3);
                                        setSuperFormData(teamData);
                                    }}
                                    icon={<AddIcon />}
                                    size={'md'}
                                    colorScheme={'green'}
                                />
                            </HStack>
                        </VStack>
                    </Flex>
                    <HStack justifyContent={'center'} gap={'25px'} marginBottom={[matchFormStatus.followUp, matchFormStatus.noShow].includes(superFormData[station].superStatus) ? '15px' : '0px'}>
                        <Checkbox
                            colorScheme={'yellow'}
                            isChecked={superFormData[station].superStatus === matchFormStatus.followUp}
                            onChange={() => {
                                let teamData = { ...superFormData };
                                teamData[station].superStatus = teamData[station].superStatus === matchFormStatus.followUp ? null : matchFormStatus.followUp;
                                setSuperFormData(teamData);
                            }}
                            width={'100px'}
                        >
                            Mark For Follow Up
                        </Checkbox>
                        <Checkbox
                            colorScheme={'red'}
                            isChecked={superFormData[station].superStatus === matchFormStatus.noShow}
                            onChange={() => {
                                let teamData = { ...superFormData };
                                teamData[station].superStatus = teamData[station].superStatus === matchFormStatus.noShow ? null : matchFormStatus.noShow;
                                setSuperFormData(teamData);
                            }}
                            width={'100px'}
                        >
                            No Show
                        </Checkbox>
                    </HStack>
                    {isFollowOrNoShow(station) ? (
                        <Center>
                            <Textarea
                                isInvalid={submitAttempted && superFormData[station].superStatusComment.trim() === ''}
                                onChange={(event) => {
                                    let teamData = { ...superFormData };
                                    teamData[station].superStatusComment = event.target.value;
                                    setSuperFormData(teamData);
                                }}
                                value={superFormData[station].superStatusComment}
                                placeholder={`What is the reason for the ${superFormData[station].superStatus.toLowerCase()}?`}
                                width={'85%'}
                            />
                        </Center>
                    ) : null}
                </Box>
            ))}
            <Center>
                <Button isLoading={submitting} marginBottom={'15px'} onClick={() => submit()}>
                    Submit
                </Button>
            </Center>
            <Modal isOpen={isOpen} onClose={onClose} isCentered={true}>
                <ModalOverlay />
                <ModalContent width={{ base: '90%', lg: '50%' }} height={'75dvh'}>
                    <ModalHeader />
                    <ModalCloseButton />
                    <ModalBody margin={'0 auto'} height={'75dvh'}>
                        <QRCode value={getQRValue()} style={{ height: 'calc(75dvh - 64px)', width: '100%' }} />
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
}

export default SuperForm;

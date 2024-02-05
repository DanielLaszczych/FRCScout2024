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
    Grid,
    GridItem,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
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
    useToast
} from '@chakra-ui/react';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { convertMatchKeyToString, deepEqual } from '../util/helperFunctions';
import { matchFormStatus, teamPageTabs } from '../util/helperConstants';
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
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [stations] = useState([`${allianceParam}1`, `${allianceParam}2`, `${allianceParam}3`]);
    const [teamNumbers] = useState([teamNumber1Param, teamNumber2Param, teamNumber3Param]);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [superFormDialog, setSuperFormDialog] = useState(false);
    const [loadResponse, setLoadResponse] = useState(null);
    const [followUp, setFollowUp] = useState(false);
    const [noShow, setNoShow] = useState(false);
    const prevSuperFormData = useRef(null);
    const [superFormData, setSuperFormData] = useState(() => {
        let obj = { loading: true };
        for (let i = 0; i < stations.length; i++) {
            obj[stations[i]] = {
                teamNumber: teamNumbers[i],
                agility: null,
                fieldAwareness: null,
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
            if (
                superForm.eventKeyParam === eventKeyParam &&
                superForm.matchNumberParam === matchNumberParam &&
                superForm.allianceParam === allianceParam
            ) {
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
                        let modified = { ...superFormData };
                        modified.loading = false;
                        for (const matchForm of data) {
                            if (matchForm.superStatus === matchFormStatus.noShow) {
                                setNoShow(true);
                            }
                            if (matchForm.superStatus === matchFormStatus.followUp) {
                                setFollowUp(true);
                            }
                            modified[matchForm.station] = {
                                teamNumber: teamNumbers[parseInt(matchForm.station.charAt(1)) - 1],
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
    }, [loadResponse, eventKeyParam, matchNumberParam, allianceParam, superFormData, offline, teamNumbers]);

    useEffect(() => {
        if (prevSuperFormData.current !== null) {
            if (!deepEqual(prevSuperFormData.current, superFormData)) {
                localStorage.setItem(
                    'SuperFormData',
                    JSON.stringify({ ...superFormData, eventKeyParam, matchNumberParam, allianceParam })
                );
            }
        }
        if (superFormData.loading === false) {
            prevSuperFormData.current = JSON.parse(JSON.stringify(superFormData));
        }
    }, [superFormData, eventKeyParam, matchNumberParam, allianceParam]);

    function getTeamFromRank(rank, field) {
        for (const station of stations) {
            if (superFormData[station][field] === rank) {
                return superFormData[station].teamNumber;
            }
        }
        return null;
    }

    function setRank(rank, field, teamNumber) {
        let newData = { ...superFormData };
        let prevRank = null;
        let prevStation = null;
        for (const station of stations) {
            if (newData[station][field] === rank && newData[station].teamNumber !== teamNumber) {
                newData[station][field] = null;
                prevStation = station;
            } else if (newData[station].teamNumber === teamNumber) {
                prevRank = newData[station][field];
                newData[station][field] = rank;
            }
        }
        if (prevRank && prevStation) {
            newData[prevStation][field] = prevRank;
        }
        setSuperFormData(newData);
    }

    function isFollowOrNoShow(station) {
        return [matchFormStatus.followUp, matchFormStatus.noShow].includes(superFormData[station].superStatus);
    }

    function submit() {
        setSubmitAttempted(true);
        let agilityText = [];
        let fieldAwarenessText = [];
        let followUpText = null;
        for (const station of stations) {
            if (
                superFormData[station].superStatus === matchFormStatus.followUp &&
                superFormData[station].superStatusComment.trim() === ''
            ) {
                followUpText = 'Follow up comment';
            } else if (!isFollowOrNoShow(station)) {
                if (superFormData[station].agility === null) {
                    agilityText.push(superFormData[station].teamNumber);
                }
                if (superFormData[station].fieldAwareness === null) {
                    fieldAwarenessText.push(superFormData[station].teamNumber);
                }
            }
        }
        if (agilityText.length !== 0 || fieldAwarenessText.length !== 0 || followUpText) {
            toast({
                title: 'Missing fields',
                description: (
                    <Text whiteSpace={'pre-line'}>
                        {[
                            agilityText.length !== 0 ? 'Agility: ' + agilityText.join(', ') + '\n' : '',
                            fieldAwarenessText.length !== 0
                                ? 'Field Awareness: ' + fieldAwarenessText.join(', ') + '\n'
                                : '',
                            followUpText || ''
                        ].join('')}
                    </Text>
                ),
                status: 'error',
                duration: 3000,
                isClosable: true
            });
            return;
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
                stations.map((station) => ({
                    ...superFormData[station],
                    eventKey: eventKeyParam,
                    matchNumber: matchNumberParam,
                    station: station,
                    allianceNumbers: [teamNumbers[0], teamNumbers[1], teamNumbers[2]],
                    superStatus: superFormData[station].superStatus || matchFormStatus.complete,
                    superStatusComment:
                        superFormData[station].superStatus === matchFormStatus.followUp
                            ? superFormData[station].superStatusComment.trim()
                            : ''
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
                            navigate(`/team/${location.state.teamNumber}/${teamPageTabs.forms}`);
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
        return (
            '#' +
            [
                eventKeyParam,
                matchNumberParam,
                ...stations.map((station) =>
                    [
                        station,
                        superFormData[station].teamNumber,
                        superFormData[station].agility,
                        superFormData[station].fieldAwareness,
                        map[superFormData[station].superStatus || matchFormStatus.complete],
                        superFormData[station].superStatus === matchFormStatus.followUp
                            ? superFormData[station].superStatusComment.trim() === ''
                                ? 'n'
                                : superFormData[station].superStatusComment.trim()
                            : 'n'
                    ].join('#')
                )
            ].join('$')
        );
    }

    if (error) {
        return (
            <Box
                textAlign={'center'}
                fontSize={'lg'}
                fontWeight={'semibold'}
                margin={'0 auto'}
                width={{ base: '85%', md: '66%', lg: '50%' }}
            >
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
                        <AlertDialogBody>
                            You have unsaved data for this super form. Would you like to load it, delete it, or pull
                            data from the cloud?
                        </AlertDialogBody>
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
                                    for (const station of stations) {
                                        if (matchForm[station].superStatus === matchFormStatus.noShow) {
                                            setNoShow(true);
                                        }
                                        if (matchForm[station].superStatus === matchFormStatus.followUp) {
                                            setFollowUp(true);
                                        }
                                        matchForm[station].teamNumber = teamNumbers[parseInt(station.charAt(1)) - 1];
                                    }
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
        <Box margin={'0 auto'} width={{ base: '90%', md: '66%', lg: '40%' }}>
            <Text textAlign={'center'} marginBottom={'25px'} fontSize={'xl'} fontWeight={'semibold'}>
                {convertMatchKeyToString(matchNumberParam)} • {allianceParam === 'r' ? 'Red' : 'Blue'}
            </Text>
            <Grid
                templateColumns={'1fr 1fr 1fr 1fr'}
                borderLeft={'1px solid black'}
                borderTop={'1px solid black'}
                outline={'1px solid black'}
                marginBottom={'25px'}
            >
                <GridItem
                    fontSize={'md'}
                    fontWeight={'semibold'}
                    textAlign={'center'}
                    padding={'5px 0px'}
                    borderBottom={'1px solid black'}
                    borderRight={'1px solid black'}
                    backgroundColor={'gray.400'}
                >
                    Attribute
                </GridItem>
                {[...Array(3)].map((_, index) => (
                    <GridItem
                        key={index}
                        fontSize={'md'}
                        fontWeight={'semibold'}
                        textAlign={'center'}
                        padding={'5px 0px'}
                        borderBottom={'1px solid black'}
                        borderRight={'1px solid black'}
                        backgroundColor={'gray.400'}
                    >
                        {index + 1}
                        {index === 0 ? ' (Worst)' : index === 2 ? ' (Best)' : ''}
                    </GridItem>
                ))}
                <GridItem
                    padding={'10px 0px'}
                    borderBottom={'1px solid black'}
                    borderRight={'1px solid black'}
                    backgroundColor={'gray.200'}
                >
                    <Center height={'100%'} fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                        Agility
                    </Center>
                </GridItem>
                {[...Array(3)].map((_, index) => (
                    <GridItem
                        key={index}
                        padding={'10px 0px'}
                        borderBottom={'1px solid black'}
                        borderRight={'1px solid black'}
                        backgroundColor={'gray.200'}
                    >
                        <Center height={'100%'}>
                            <Menu placement={'bottom'} autoSelect={false}>
                                <MenuButton
                                    fontSize={'md'}
                                    fontWeight={'medium'}
                                    width={'60px'}
                                    padding={'0px'}
                                    as={Button}
                                    colorScheme='teal'
                                >
                                    <Box overflow={'hidden'} textOverflow={'ellipsis'}>
                                        {getTeamFromRank(index + 1, 'agility') || 'None'}
                                    </Box>
                                </MenuButton>
                                <MenuList minWidth={'fit-content'}>
                                    {teamNumbers.map((teamNumber) => (
                                        <MenuItem
                                            padding={'0.375rem 30px'}
                                            textAlign={'center'}
                                            justifyContent={'center'}
                                            key={teamNumber}
                                            isDisabled={stations.some(
                                                (station) =>
                                                    superFormData[station].teamNumber === teamNumber &&
                                                    [matchFormStatus.noShow].includes(
                                                        superFormData[station].superStatus
                                                    )
                                            )}
                                            textDecoration={
                                                stations.some(
                                                    (station) =>
                                                        superFormData[station].teamNumber === teamNumber &&
                                                        superFormData[station]['agility'] !== null
                                                ) && 'line-through'
                                            }
                                            onClick={() => {
                                                setRank(index + 1, 'agility', teamNumber);
                                            }}
                                        >
                                            {teamNumber}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </Menu>
                        </Center>
                    </GridItem>
                ))}
                <GridItem
                    padding={'10px 0px'}
                    borderBottom={'1px solid black'}
                    borderRight={'1px solid black'}
                    backgroundColor={'gray.200'}
                >
                    <Center height={'100%'} fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                        Field Aware.
                    </Center>
                </GridItem>
                {[...Array(3)].map((_, index) => (
                    <GridItem
                        key={index}
                        padding={'10px 0px'}
                        borderBottom={'1px solid black'}
                        borderRight={'1px solid black'}
                        backgroundColor={'gray.200'}
                    >
                        <Center height={'100%'}>
                            <Menu placement={'bottom'} autoSelect={false}>
                                <MenuButton
                                    fontSize={'md'}
                                    fontWeight={'medium'}
                                    width={'60px'}
                                    padding={'0px'}
                                    as={Button}
                                    colorScheme='teal'
                                >
                                    <Box overflow={'hidden'} textOverflow={'ellipsis'}>
                                        {getTeamFromRank(index + 1, 'fieldAwareness') || 'None'}
                                    </Box>
                                </MenuButton>
                                <MenuList minWidth={'fit-content'}>
                                    {teamNumbers.map((teamNumber) => (
                                        <MenuItem
                                            padding={'0.375rem 30px'}
                                            textAlign={'center'}
                                            justifyContent={'center'}
                                            key={teamNumber}
                                            isDisabled={stations.some(
                                                (station) =>
                                                    superFormData[station].teamNumber === teamNumber &&
                                                    [matchFormStatus.noShow].includes(
                                                        superFormData[station].superStatus
                                                    )
                                            )}
                                            textDecoration={
                                                stations.some(
                                                    (station) =>
                                                        superFormData[station].teamNumber === teamNumber &&
                                                        superFormData[station]['fieldAwareness'] !== null
                                                ) && 'line-through'
                                            }
                                            onClick={() => {
                                                setRank(index + 1, 'fieldAwareness', teamNumber);
                                            }}
                                        >
                                            {teamNumber}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </Menu>
                        </Center>
                    </GridItem>
                ))}
            </Grid>
            <Center>
                <Checkbox
                    colorScheme={'red'}
                    isChecked={noShow}
                    marginBottom={'15px'}
                    onChange={() => {
                        if (noShow) {
                            let newData = { ...superFormData };
                            for (const station of stations) {
                                if (newData[station].superStatus === matchFormStatus.noShow) {
                                    newData[station].superStatus = null;
                                }
                            }
                            setSuperFormData(newData);
                        }
                        setNoShow(!noShow);
                    }}
                >
                    No Show
                </Checkbox>
            </Center>
            <Flex justifyContent={'center'} columnGap={'30px'} marginBottom={noShow && '15px'}>
                {noShow &&
                    stations.map((station) => (
                        <Button
                            key={station}
                            colorScheme={superFormData[station].superStatus === matchFormStatus.noShow ? 'red' : 'gray'}
                            onClick={() => {
                                let newData = { ...superFormData };
                                if (newData[station].superStatus === matchFormStatus.noShow) {
                                    newData[station].superStatus = null;
                                } else {
                                    newData[station].superStatus = matchFormStatus.noShow;
                                    newData[station].agility = null;
                                    newData[station].fieldAwareness = null;
                                }
                                setSuperFormData(newData);
                            }}
                        >
                            {superFormData[station].teamNumber}
                        </Button>
                    ))}
            </Flex>
            <Center>
                <Checkbox
                    colorScheme={'yellow'}
                    isChecked={followUp}
                    marginBottom={'15px'}
                    onChange={() => {
                        if (followUp) {
                            let newData = { ...superFormData };
                            for (const station of stations) {
                                if (newData[station].superStatus === matchFormStatus.followUp) {
                                    newData[station].superStatus = null;
                                    newData[station].superStatusComment = '';
                                }
                            }
                            setSuperFormData(newData);
                        }
                        setFollowUp(!followUp);
                    }}
                >
                    Mark For Follow Up
                </Checkbox>
            </Center>
            <Flex justifyContent={'center'} columnGap={'30px'} marginBottom={followUp && '15px'}>
                {followUp &&
                    stations.map((station) => (
                        <Button
                            key={station}
                            colorScheme={
                                superFormData[station].superStatus === matchFormStatus.followUp ? 'yellow' : 'gray'
                            }
                            onClick={() => {
                                let prevFollowUpTeam = stations.find(
                                    (station) => superFormData[station].superStatus === matchFormStatus.followUp
                                );

                                let newData = { ...superFormData };
                                if (newData[station].superStatus === matchFormStatus.followUp) {
                                    newData[station].superStatus = null;
                                } else {
                                    newData[station].superStatus = matchFormStatus.followUp;
                                    if (prevFollowUpTeam) {
                                        newData[station].superStatusComment =
                                            superFormData[prevFollowUpTeam].superStatusComment;
                                    }
                                }
                                setSuperFormData(newData);
                            }}
                        >
                            {superFormData[station].teamNumber}
                        </Button>
                    ))}
            </Flex>
            {stations.some((station) => superFormData[station].superStatus === matchFormStatus.followUp) && (
                <Center marginTop={'15px'} marginBottom={'15px'}>
                    <Textarea
                        isInvalid={
                            submitAttempted &&
                            superFormData[
                                stations.find(
                                    (station) => superFormData[station].superStatus === matchFormStatus.followUp
                                )
                            ].superStatusComment.trim() === ''
                        }
                        onChange={(event) => {
                            // Wanted to use onBlur for this but there are some ways
                            // you can leave the page without triggering onBlur
                            let newData = { ...superFormData };
                            for (const station of stations) {
                                if (newData[station].superStatus === matchFormStatus.followUp) {
                                    newData[station].superStatusComment = event.target.value;
                                }
                            }
                            setSuperFormData(newData);
                        }}
                        value={
                            superFormData[
                                stations.find(
                                    (station) => superFormData[station].superStatus === matchFormStatus.followUp
                                )
                            ].superStatusComment
                        }
                        placeholder='What is the reason for the follow up?'
                        width={'85%'}
                    />
                </Center>
            )}
            <Center>
                <Button isLoading={submitting} marginTop={'10px'} marginBottom={'15px'} onClick={() => submit()}>
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

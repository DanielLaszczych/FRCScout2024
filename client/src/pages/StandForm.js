import React, { useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
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
    Slider,
    SliderFilledTrack,
    SliderMark,
    SliderThumb,
    SliderTrack,
    Spinner,
    Text,
    Textarea,
    VStack,
    useToast
} from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';
import { deepEqual, getValueByRange } from '../util/helperFunctions';
import { AUTO, ENDGAME, TELEOP, createHistoryManager } from '../util/historyManager';
import '../stylesheets/standformstyle.css';
import { matchFormStatus, scoutedField } from '../util/helperConstants';
import PreAutoRedField from '../images/PreAutoRedField.png';
import PreAutoBlueField from '../images/PreAutoBlueField.png';
import AutoRedField from '../images/AutoRedField.png';
import AutoBlueField from '../images/AutoBlueField.png';
import QRCode from 'react-qr-code';
import { GlobalContext } from '../context/globalState';
import { AiOutlineRotateRight } from 'react-icons/ai';
import { IoChevronForward } from 'react-icons/io5';
import { IoChevronBack } from 'react-icons/io5';

let sections = {
    preAuto: 'Pre-Auto',
    auto: 'Auto',
    teleop: 'Teleop',
    endGame: 'Endgame',
    closing: 'Closing'
};
let startingPositions = [
    [28, 35, uuidv4()],
    [60, 118, uuidv4()],
    [28, 200, uuidv4()],
    [28, 300, uuidv4()]
];
let preLoadedPieces = [
    { label: 'None', id: uuidv4() },
    { label: 'Note', id: uuidv4() }
];
let notePositions = [
    [31, 21, uuidv4()],
    [31, 103, uuidv4()],
    [31, 185, uuidv4()],
    [336, 5, uuidv4()],
    [336, 95, uuidv4()],
    [336, 185, uuidv4()],
    [336, 275, uuidv4()],
    [336, 365, uuidv4()]
];
let leaveAutoOptions = [
    { label: 'Yes', value: true, id: uuidv4() },
    { label: 'No', value: false, id: uuidv4() }
];
let defenseRatings = [
    { value: 0, id: uuidv4() },
    { value: 1, id: uuidv4() },
    { value: 2, id: uuidv4() },
    { value: 3, id: uuidv4() }
];
let defenseAllocations = [
    { label: '25%', value: 0.25, id: uuidv4() },
    { label: '50%', value: 0.5, id: uuidv4() },
    { label: '75%', value: 0.75, id: uuidv4() },
    { label: '100%', value: 1.0, id: uuidv4() }
];
let wasDefendedOptions = [
    { label: 'Yes', value: true, id: uuidv4() },
    { label: 'No', value: false, id: uuidv4() }
];
let climbTypes = [
    { label: 'No Attempt', color: 'blue', id: uuidv4() },
    { label: 'Success', color: 'green', id: uuidv4() },
    { label: 'Harmony', color: 'green', id: uuidv4() },
    { label: 'Fail', color: 'red', id: uuidv4() }
];
let loseCommOptions = [
    { label: 'Yes', value: true, color: 'red', id: uuidv4() },
    { label: 'No', value: false, color: 'green', id: uuidv4() }
];
let robotBreakOptions = [
    { label: 'Yes', value: true, color: 'red', id: uuidv4() },
    { label: 'No', value: false, color: 'green', id: uuidv4() }
];
let yellowCardOptions = [
    { label: 'Yes', value: true, color: 'red', id: uuidv4() },
    { label: 'No', value: false, color: 'green', id: uuidv4() }
];
let redCardOptions = [
    { label: 'Yes', value: true, color: 'red', id: uuidv4() },
    { label: 'No', value: false, color: 'green', id: uuidv4() }
];
let imageWidth = 435;
let imageHeight = 435;

function StandForm() {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    const { eventKey: eventKeyParam, matchNumber: matchNumberParam, station: stationParam, teamNumber: teamNumberParam } = useParams();
    const { offline } = useContext(GlobalContext);

    const cancelRef = useRef(null);

    const [activeSection, setActiveSection] = useState(sections.preAuto);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [standFormDialog, setStandFormDialog] = useState(false);
    const [fieldRotation, setFieldRotation] = useState(0);
    const [loadResponse, setLoadResponse] = useState(null);
    const prevStandFormData = useRef(null);
    const [standFormData, setStandFormData] = useState({
        startingPosition: null,
        preLoadedPiece: null,
        leftStart: null,
        autoTimeline: [],
        teleopGP: {
            intakeSource: 0,
            intakeGround: 0,
            ampScore: 0,
            speakerScore: 0,
            ampMiss: 0,
            speakerMiss: 0,
            ferry: 0,
            trap: 0
        },
        wasDefended: null,
        defenseRating: 0,
        defenseAllocation: 0.25,
        climb: null,
        loseCommunication: null,
        robotBreak: null,
        yellowCard: null,
        redCard: null,
        standComment: '',
        standStatus: null,
        standStatusComment: '',
        loading: true,
        history: {
            auto: {
                data: [],
                position: -1
            },
            teleop: {
                data: [],
                position: -1
            },
            endGame: {
                data: [],
                position: -1
            }
        }
    });
    const [error, setError] = useState(null);
    const [futureAlly, setFutureAlly] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [standFormManagers, setStandFormManagers] = useState(null);
    const [dimensionRatios, setDimensionRatios] = useState(null);
    const [whitespace, setWhitespace] = useState(null);
    const [preAutoImageSrc, setPreAutoImageSrc] = useState(null);
    const [autoImageSrc, setAutoImageSrc] = useState(null);
    const [showQRCode, setShowQRCode] = useState(false);
    const [maxContainerHeight, setMaxContainerHeight] = useState(null);

    useEffect(() => {
        if (stationParam.length !== 2 || !/[rb][123]/.test(stationParam)) {
            setError('Invalid station in the url');
            return;
        }
        if (!/[0-9]+$/.test(teamNumberParam)) {
            setError('Invalid team number in the url');
            return;
        }
        if (offline) {
            setFutureAlly(false);
        } else {
            fetch(`/blueAlliance/isFutureAlly/${eventKeyParam}/${teamNumberParam}/${matchNumberParam}/${false}`)
                .then((response) => response.json())
                .then((data) => {
                    setFutureAlly(data);
                })
                .catch((error) => {
                    setFutureAlly(false);
                });
        }
    }, [eventKeyParam, matchNumberParam, stationParam, teamNumberParam, offline]);

    useEffect(() => {
        if (localStorage.getItem('StandFormData')) {
            let standForm = JSON.parse(localStorage.getItem('StandFormData'));
            if (standForm.eventKeyParam === eventKeyParam && standForm.matchNumberParam === matchNumberParam && standForm.stationParam === stationParam) {
                setLoadResponse('Required');
                setStandFormDialog(true);
            } else {
                setLoadResponse(false);
            }
        } else {
            setLoadResponse(false);
        }
        if (localStorage.getItem('Field Rotation')) {
            let obj = JSON.parse(localStorage.getItem('Field Rotation'));
            if (stationParam.charAt(0) === 'r' && obj.red) {
                setFieldRotation(obj.red);
            } else if (obj.blue) {
                setFieldRotation(obj.blue);
            }
        }
    }, [eventKeyParam, matchNumberParam, stationParam]);

    useEffect(() => {
        // Only fetch stand form data if load response was false and are online
        if (loadResponse === false && standFormData.loading) {
            if (offline) {
                setStandFormData({ ...standFormData, loading: false });
            } else {
                const headers = {
                    filters: JSON.stringify({
                        eventKey: eventKeyParam,
                        matchNumber: matchNumberParam,
                        station: stationParam,
                        standStatus: [matchFormStatus.complete, matchFormStatus.noShow, matchFormStatus.followUp]
                    })
                };
                fetch('/matchForm/getMatchForm', {
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
                        if (!data) {
                            setStandFormData({ ...standFormData, loading: false });
                        } else {
                            data.loading = false;
                            setStandFormData(data);
                        }
                    })
                    .catch((error) => setError(error.message));
            }
        }
    }, [loadResponse, eventKeyParam, matchNumberParam, stationParam, standFormData, offline]);

    useEffect(() => {
        if (localStorage.getItem('Field Rotation')) {
            let oldObj = JSON.parse(localStorage.getItem('Field Rotation'));
            let obj = { red: stationParam.charAt(0) === 'r' ? fieldRotation : oldObj.red, blue: stationParam.charAt(0) === 'b' ? fieldRotation : oldObj.blue };
            localStorage.setItem('Field Rotation', JSON.stringify(obj));
        } else {
            let obj = { red: stationParam.charAt(0) === 'r' ? fieldRotation : null, blue: stationParam.charAt(0) === 'b' ? fieldRotation : null };
            localStorage.setItem('Field Rotation', JSON.stringify(obj));
        }
    }, [stationParam, fieldRotation]);

    useEffect(() => {
        if (prevStandFormData.current !== null) {
            if (!deepEqual(prevStandFormData.current, standFormData)) {
                localStorage.setItem('StandFormData', JSON.stringify({ ...standFormData, eventKeyParam, matchNumberParam, stationParam }));
            }
        }
        if (standFormData.loading === false) {
            prevStandFormData.current = JSON.parse(JSON.stringify(standFormData));
            if (standFormManagers === null) {
                setStandFormManagers({
                    auto: createHistoryManager(AUTO, setStandFormData, standFormData.history.auto),
                    teleop: createHistoryManager(TELEOP, setStandFormData, standFormData.history.teleop),
                    endGame: createHistoryManager(ENDGAME, setStandFormData, standFormData.history.endGame)
                });
            }
        }
    }, [standFormData, eventKeyParam, matchNumberParam, stationParam, standFormManagers]);

    function getImageVariables() {
        const viewportWidth = window.innerWidth;
        // const viewportHeight = window.innerHeight;

        // Calculate image dimensions based on screen size
        const maxWidth = viewportWidth * getValueByRange(viewportWidth); // Adjust the multiplier as needed
        const maxHeight = Math.min(imageHeight, Math.max(447 - 145, document.documentElement.clientHeight - 315));

        const screenAspectRatio = maxWidth / maxHeight;
        const imageAspectRatio = imageWidth / imageHeight;

        // Calculate the new dimensions to fit the screen while maintaining the aspect ratio
        let scaledWidth, scaledHeight;
        if (imageAspectRatio > screenAspectRatio) {
            // Original image has a wider aspect ratio, so add horizontal whitespace
            scaledWidth = maxWidth;
            scaledHeight = maxWidth / imageAspectRatio;

            // Overwriting this because there will never be horizontal whitespace
            // const extraHorizontalSpace = maxHeight - scaledHeight;
            // const whitespaceTop = extraHorizontalSpace / 2;
            // const whitespaceBottom = extraHorizontalSpace / 2;
            // setWhitespace({ top: whitespaceTop, bottom: whitespaceBottom, left: 0, right: 0 });
            setWhitespace({ top: 0, bottom: 0, left: 0, right: 0 });
        } else {
            // Original image has a taller aspect ratio, so add vertical whitespace
            scaledHeight = maxHeight;
            scaledWidth = maxHeight * imageAspectRatio;
            const extraVerticalSpace = maxWidth - scaledWidth;
            const whitespaceLeft = extraVerticalSpace / 2;
            const whitespaceRight = extraVerticalSpace / 2;
            setWhitespace({ top: 0, bottom: 0, left: whitespaceLeft, right: whitespaceRight });
        }

        setMaxContainerHeight(scaledHeight + 145);
        setDimensionRatios({ width: scaledWidth / imageWidth, height: scaledHeight / imageHeight });
    }

    useEffect(() => {
        const preAutoImg = new Image();
        const autoImg = new Image();
        preAutoImg.src = stationParam.charAt(0) === 'r' ? PreAutoRedField : PreAutoBlueField;
        autoImg.src = stationParam.charAt(0) === 'r' ? AutoRedField : AutoBlueField;

        preAutoImg.onload = () => {
            setPreAutoImageSrc(preAutoImg.src);
        };
        autoImg.onload = () => {
            setAutoImageSrc(autoImg.src);
        };

        getImageVariables();
        window.addEventListener('resize', getImageVariables);

        return () => window.removeEventListener('resize', getImageVariables);
    }, [stationParam]);

    function getPoint(pointX) {
        let mirror = 185;
        if (stationParam.charAt(0) === 'r') {
            // Calculate mirrored x-coordinate
            return 2 * mirror - pointX;
        } else {
            return pointX;
        }
    }

    function isFollowOrNoShow() {
        return [matchFormStatus.followUp, matchFormStatus.noShow].includes(standFormData.standStatus);
    }

    function validPreAuto() {
        return standFormData.startingPosition !== null && standFormData.preLoadedPiece !== null;
    }

    function validAuto() {
        return standFormData.leftStart !== null;
    }

    function validTele() {
        return standFormData.wasDefended !== null;
    }

    function validEndGame() {
        return standFormData.climb !== null && standFormData.loseCommunication !== null && standFormData.robotBreak !== null && standFormData.yellowCard !== null && standFormData.redCard !== null;
    }

    function validClosing() {
        return !isFollowOrNoShow() || standFormData.standStatusComment.trim() !== '';
    }

    function validateSection(section) {
        if (section === sections.preAuto) {
            return validPreAuto();
        } else if (section === sections.auto) {
            return validAuto();
        } else if (section === sections.teleop) {
            return validTele();
        } else if (section === sections.endGame) {
            return validEndGame();
        } else if (section === sections.closing) {
            return validClosing();
        } else {
            return true;
        }
    }

    function getQRValue() {
        return JSON.stringify({
            eventKey: eventKeyParam,
            matchNumber: matchNumberParam,
            station: stationParam,
            teamNumber: parseInt(teamNumberParam),
            ...standFormData,
            defenseAllocation: standFormData.defenseRating === 0 ? 0 : standFormData.defenseAllocation,
            standComment: standFormData.standComment.trim(),
            standStatus: standFormData.standStatus || matchFormStatus.complete,
            standStatusComment: isFollowOrNoShow() ? standFormData.standStatusComment.trim() : ''
        });
    }

    function submit() {
        setSubmitAttempted(true);
        if (!isFollowOrNoShow()) {
            let toastText = [];
            if (!validPreAuto()) {
                toastText.push('Pre-Auto');
            }
            if (!validAuto()) {
                toastText.push('Auto');
            }
            if (!validTele()) {
                toastText.push('Teleop');
            }
            if (!validEndGame()) {
                toastText.push('End Game');
            }
            if (toastText.length !== 0) {
                toast({
                    title: 'Missing fields at:',
                    description: toastText.join(', '),
                    status: 'error',
                    duration: 2000,
                    isClosable: true
                });
                return;
            }
        } else if (standFormData.standStatusComment.trim() === '') {
            toast({
                title: 'Missing fields',
                description: `Leave a ${standFormData.standStatus.toLowerCase()} comment`,
                status: 'error',
                duration: 3000,
                isClosable: true
            });
            return;
        }
        if (offline) {
            setShowQRCode(true);
            return;
        }
        setSubmitting(true);
        fetch('/matchForm/postStandForm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventKey: eventKeyParam,
                matchNumber: matchNumberParam,
                station: stationParam,
                teamNumber: parseInt(teamNumberParam),
                ...standFormData,
                defenseAllocation: standFormData.defenseRating === 0 ? 0 : standFormData.defenseAllocation,
                standComment: standFormData.standComment.trim(),
                standStatus: standFormData.standStatus || matchFormStatus.complete,
                standStatusComment: isFollowOrNoShow() ? standFormData.standStatusComment.trim() : ''
            })
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
                            navigate('/matches', { state: { scoutingError: location.state.scoutingError } });
                        } else if (location.state.previousRoute === 'team') {
                            navigate(`/team/${teamNumberParam}/stand`);
                        }
                    } else {
                        navigate('/');
                    }
                    setSubmitting(false);
                    localStorage.removeItem('StandFormData');
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

    function renderSection() {
        switch (activeSection) {
            case sections.preAuto:
                return (
                    <Box>
                        <Text
                            fontSize={'xl'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            marginBottom={'5px'}
                            color={submitAttempted && !isFollowOrNoShow() && !validateSection(activeSection) ? 'red' : 'default'}
                        >
                            {activeSection}
                        </Text>
                        <Box position={'relative'} style={{ transform: `rotate(${fieldRotation}deg)` }}>
                            {!preAutoImageSrc && (
                                <Center
                                    width={`${imageWidth * dimensionRatios.width}px`}
                                    height={`${imageHeight * dimensionRatios.height}px`}
                                    pos={'absolute'}
                                    backgroundColor={'white'}
                                    zIndex={2}
                                    left={'50%'}
                                    transform={'translate(-50%, 0%)'}
                                >
                                    <Spinner />
                                </Center>
                            )}
                            {startingPositions.map((position, index) => (
                                <Button
                                    zIndex={1}
                                    key={position[2]}
                                    position={'absolute'}
                                    left={`${whitespace.left + getPoint(position[0]) * dimensionRatios.width}px`}
                                    top={`${whitespace.top + position[1] * dimensionRatios.height}px`}
                                    width={`${65 * dimensionRatios.width}px`}
                                    height={`${65 * dimensionRatios.height}px`}
                                    style={{ transform: `rotate(${360 - fieldRotation}deg)`, transition: 'none' }}
                                    onClick={() => setStandFormData({ ...standFormData, startingPosition: index + 1 })}
                                    colorScheme={standFormData.startingPosition === index + 1 ? 'blue' : 'gray'}
                                    outline={standFormData.startingPosition === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                >
                                    {index + 1}
                                </Button>
                            ))}
                            {preAutoImageSrc && (
                                <img
                                    src={preAutoImageSrc}
                                    style={{ zIndex: 0, margin: '0 auto', maxHeight: `${Math.max(447 - 145, document.documentElement.clientHeight - 315)}px` }}
                                    alt={'Field Map'}
                                />
                            )}
                        </Box>
                        <Flex flexDir={'column'} rowGap={'15px'} marginTop={'15px'}>
                            <Button
                                margin={'0 auto'}
                                width={'75%'}
                                onClick={() => {
                                    let nextStatus = standFormData.standStatus === matchFormStatus.noShow ? null : matchFormStatus.noShow;
                                    setStandFormData({ ...standFormData, standStatus: nextStatus });
                                    if (nextStatus === matchFormStatus.noShow) {
                                        setActiveSection(sections.closing);
                                    }
                                }}
                                colorScheme={standFormData.standStatus === matchFormStatus.noShow ? 'red' : 'gray'}
                            >
                                No Show
                            </Button>
                            <HStack gap={0}>
                                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} flex={1 / 2}>
                                    Preloaded:
                                </Text>
                                <HStack flex={1 / 2} justifyContent={'center'} gap={'20px'}>
                                    {preLoadedPieces.map((piece) => (
                                        <Button
                                            key={piece.id}
                                            onClick={() => {
                                                if (piece.label === 'Note' && standFormData.preLoadedPiece !== 'Note') {
                                                    setStandFormData({ ...standFormData, preLoadedPiece: piece.label, autoTimeline: [{ piece: '0', scored: null }, ...standFormData.autoTimeline] });
                                                } else if (piece.label === 'None' && standFormData.preLoadedPiece === 'Note') {
                                                    standFormManagers.auto.removePreloadedEntry(standFormData);
                                                    setStandFormData({ ...standFormData, preLoadedPiece: piece.label, autoTimeline: standFormData.autoTimeline.slice(1) });
                                                } else {
                                                    setStandFormData({ ...standFormData, preLoadedPiece: piece.label });
                                                }
                                            }}
                                            colorScheme={standFormData.preLoadedPiece === piece.label ? 'blue' : 'gray'}
                                            outline={standFormData.preLoadedPiece === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                        >
                                            {piece.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                        </Flex>
                        <HStack marginTop={`${15 + maxContainerHeight - imageHeight * dimensionRatios.height - 145}px`} marginBottom={'15px'} gap={'15px'}>
                            <Button flex={2 / 3} leftIcon={<AiOutlineRotateRight />} onClick={() => setFieldRotation((fieldRotation + 90) % 360)}>
                                Rotate
                            </Button>
                            <Text fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'} flex={1 / 3}>
                                {teamNumberParam}
                            </Text>
                            {futureAlly ? (
                                <StarIcon
                                    position={'absolute'}
                                    left={'50%'}
                                    transform={'translate(-50%, 0%)'}
                                    zIndex={-1}
                                    opacity={1}
                                    // stroke={'black'}
                                    viewBox={'-1 -1 26 26'}
                                    fontSize={'xl'}
                                    color={'yellow.300'}
                                />
                            ) : null}
                            <Button flex={2 / 3} rightIcon={<IoChevronForward />} onClick={() => setActiveSection(sections.auto)}>
                                Auto
                            </Button>
                        </HStack>
                    </Box>
                );
            case sections.auto:
                return (
                    <Box>
                        <HStack justifyContent={'center'} gap={'30px'}>
                            <Button
                                colorScheme={'gray'}
                                onClick={() => {
                                    standFormManagers.auto.undo(standFormData);
                                }}
                                isDisabled={standFormManagers.auto.getPosition() === -1}
                                width={'100%'}
                                whiteSpace={'pre-line'}
                            >
                                {standFormManagers.auto.getPosition() === -1 ? 'Undo' : `Undo\n${standFormManagers.auto.getUndoNote()}`}
                            </Button>
                            <Button
                                colorScheme={'gray'}
                                onClick={() => {
                                    standFormManagers.auto.redo(standFormData);
                                }}
                                isDisabled={standFormManagers.auto.getPosition() === standFormManagers.auto.getHistoryLength() - 1}
                                width={'100%'}
                                whiteSpace={'pre-line'}
                            >
                                {standFormManagers.auto.getPosition() === standFormManagers.auto.getHistoryLength() - 1 ? 'Redo' : `Redo\n${standFormManagers.auto.getRedoNote()}`}
                            </Button>
                        </HStack>
                        <Text
                            fontSize={'xl'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            margin={'5px 0'}
                            color={submitAttempted && !isFollowOrNoShow() && !validateSection(activeSection) ? 'red' : 'default'}
                        >
                            {activeSection}:{' '}
                            {standFormData.autoTimeline.length === 0 ||
                            (standFormData.autoTimeline.slice(-1)[0].scored !== null && (standFormData.autoTimeline[0].piece !== '0' || standFormData.autoTimeline[0].scored !== null))
                                ? 'Intake'
                                : 'Scoring'}
                            {standFormData.autoTimeline.length > 0 && standFormData.autoTimeline[0].piece === '0' && standFormData.autoTimeline[0].scored === null ? '(Preloaded)' : ''}
                        </Text>
                        {standFormData.autoTimeline.length === 0 ||
                        (standFormData.autoTimeline.slice(-1)[0].scored !== null && (standFormData.autoTimeline[0].piece !== '0' || standFormData.autoTimeline[0].scored !== null)) ? (
                            <Box style={{ transform: `rotate(${fieldRotation}deg)` }}>
                                {!autoImageSrc && (
                                    <Center
                                        width={`${imageWidth * dimensionRatios.width}px`}
                                        height={`${imageHeight * dimensionRatios.height}px`}
                                        pos={'absolute'}
                                        backgroundColor={'white'}
                                        zIndex={2}
                                        left={'50%'}
                                        transform={'translate(-50%, 0%)'}
                                    >
                                        <Spinner />
                                    </Center>
                                )}
                                {notePositions.map((position, index) => (
                                    <Button
                                        zIndex={1}
                                        key={position[2]}
                                        position={'absolute'}
                                        left={`${whitespace.left + getPoint(position[0]) * dimensionRatios.width}px`}
                                        top={`${whitespace.top + position[1] * dimensionRatios.height}px`}
                                        width={`${65 * dimensionRatios.width}px`}
                                        height={`${65 * dimensionRatios.height}px`}
                                        style={{ transform: `rotate(${360 - fieldRotation}deg)`, transition: 'none' }}
                                        onClick={() => {
                                            standFormManagers.auto.doCommand(standFormData, (index + 1).toString());
                                        }}
                                        isDisabled={standFormData.autoTimeline.some((element) => element.piece === (index + 1).toString())}
                                        _disabled={{ backgroundColor: '#3182ce', textColor: 'white', _hover: { backgroundColor: '#3182ce' }, cursor: 'default' }}
                                    >
                                        {index + 1}
                                    </Button>
                                ))}
                                {autoImageSrc && (
                                    <img
                                        src={autoImageSrc}
                                        style={{ zIndex: 0, margin: '0 auto', maxHeight: `${Math.max(447 - 145, document.documentElement.clientHeight - 315)}px` }}
                                        alt={'Field Map'}
                                    />
                                )}
                            </Box>
                        ) : (
                            <Flex height={`${imageHeight * dimensionRatios.height}px`} flexDir={'column'} margin={'0 auto'} gap={'15px'}>
                                <Flex flex={1 / 2} gap={'15px'}>
                                    <Button
                                        colorScheme={'teal'}
                                        fontSize={'xl'}
                                        fontWeight={'bold'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        onClick={() => {
                                            standFormManagers.auto.doCommand(standFormData, scoutedField.ampScore.field);
                                        }}
                                    >
                                        Amp: {standFormData.autoTimeline.reduce((acc, element) => (element.scored === scoutedField.ampScore.field ? ++acc : acc), 0)}
                                    </Button>
                                    <Button
                                        colorScheme={'facebook'}
                                        fontSize={'xl'}
                                        fontWeight={'bold'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        onClick={() => {
                                            standFormManagers.auto.doCommand(standFormData, scoutedField.speakerScore.field);
                                        }}
                                    >
                                        Speaker: {standFormData.autoTimeline.reduce((acc, element) => (element.scored === scoutedField.speakerScore.field ? ++acc : acc), 0)}
                                    </Button>
                                </Flex>
                                <Flex flex={0.3} gap={'15px'}>
                                    <Button
                                        colorScheme={'pink'}
                                        fontSize={'xl'}
                                        fontWeight={'bold'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        onClick={() => {
                                            standFormManagers.auto.doCommand(standFormData, scoutedField.ampMiss.field);
                                        }}
                                    >
                                        Amp Miss: {standFormData.autoTimeline.reduce((acc, element) => (element.scored === scoutedField.ampMiss.field ? ++acc : acc), 0)}
                                    </Button>
                                    <Button
                                        colorScheme={'purple'}
                                        fontSize={'xl'}
                                        fontWeight={'bold'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        whiteSpace={'normal'}
                                        onClick={() => {
                                            standFormManagers.auto.doCommand(standFormData, scoutedField.speakerMiss.field);
                                        }}
                                    >
                                        Speaker Miss: {standFormData.autoTimeline.reduce((acc, element) => (element.scored === scoutedField.speakerMiss.field ? ++acc : acc), 0)}
                                    </Button>
                                </Flex>
                                <Button
                                    colorScheme={'yellow'}
                                    fontSize={'xl'}
                                    fontWeight={'bold'}
                                    flex={0.2}
                                    onClick={() => {
                                        standFormManagers.auto.doCommand(standFormData, scoutedField.intakeMiss.field);
                                    }}
                                >
                                    Intake Miss: {standFormData.autoTimeline.reduce((acc, element) => (element.scored === scoutedField.intakeMiss.field ? ++acc : acc), 0)}
                                </Button>
                            </Flex>
                        )}
                        <Flex flexDir={'column'} rowGap={'15px'} marginTop={'15px'}>
                            <HStack gap={0}>
                                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} flex={1 / 2}>
                                    Left starting zone:
                                </Text>
                                <HStack flex={1 / 2} justifyContent={'center'} gap={'20px'}>
                                    {leaveAutoOptions.map((option) => (
                                        <Button
                                            key={option.id}
                                            onClick={() => setStandFormData({ ...standFormData, leftStart: option.value })}
                                            colorScheme={standFormData.leftStart === option.value ? 'blue' : 'gray'}
                                            outline={standFormData.leftStart === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                        </Flex>
                        <HStack marginTop={`${15 + maxContainerHeight - imageHeight * dimensionRatios.height - 135}px`} marginBottom={'15px'} gap={'15px'}>
                            <Button flex={2 / 3} leftIcon={<IoChevronBack />} onClick={() => setActiveSection(sections.preAuto)}>
                                Pre-Auto
                            </Button>
                            <Text fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'} flex={1 / 3}>
                                {teamNumberParam}
                            </Text>
                            {futureAlly ? (
                                <StarIcon
                                    position={'absolute'}
                                    left={'50%'}
                                    transform={'translate(-50%, 0%)'}
                                    zIndex={-1}
                                    opacity={1}
                                    // stroke={'black'}
                                    viewBox={'-1 -1 26 26'}
                                    fontSize={'xl'}
                                    color={'yellow.300'}
                                />
                            ) : null}
                            <Button flex={2 / 3} rightIcon={<IoChevronForward />} onClick={() => setActiveSection(sections.teleop)}>
                                Teleop
                            </Button>
                        </HStack>
                    </Box>
                );
            case sections.teleop:
                return (
                    <Box>
                        <HStack justifyContent={'center'} gap={'30px'}>
                            <Button
                                colorScheme={'gray'}
                                onClick={() => {
                                    standFormManagers.teleop.undo(standFormData);
                                }}
                                isDisabled={standFormManagers.teleop.getPosition() === -1}
                                width={'100%'}
                                whiteSpace={'pre-line'}
                            >
                                {standFormManagers.teleop.getPosition() === -1 ? 'Undo' : `Undo\n${standFormManagers.teleop.getUndoNote()}`}
                            </Button>
                            <Button
                                colorScheme={'gray'}
                                onClick={() => {
                                    standFormManagers.teleop.redo(standFormData);
                                }}
                                isDisabled={standFormManagers.teleop.getPosition() === standFormManagers.teleop.getHistoryLength() - 1}
                                width={'100%'}
                                whiteSpace={'pre-line'}
                            >
                                {standFormManagers.teleop.getPosition() === standFormManagers.teleop.getHistoryLength() - 1 ? 'Redo' : `Redo\n${standFormManagers.teleop.getRedoNote()}`}
                            </Button>
                        </HStack>
                        <Text
                            fontSize={'xl'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            margin={'5px 0'}
                            color={submitAttempted && !isFollowOrNoShow() && !validateSection(activeSection) ? 'red' : 'default'}
                        >
                            {activeSection}:{' '}
                            {standFormData.teleopGP.intakeGround + standFormData.teleopGP.intakeSource ===
                            [
                                standFormData.teleopGP.ampScore,
                                standFormData.teleopGP.speakerScore,
                                standFormData.teleopGP.ampMiss,
                                standFormData.teleopGP.speakerMiss,
                                standFormData.teleopGP.ferry
                            ].reduce((partialSum, a) => partialSum + a, 0)
                                ? 'Intake'
                                : 'Scoring'}
                        </Text>
                        {standFormData.teleopGP.intakeGround + standFormData.teleopGP.intakeSource ===
                        [standFormData.teleopGP.ampScore, standFormData.teleopGP.speakerScore, standFormData.teleopGP.ampMiss, standFormData.teleopGP.speakerMiss, standFormData.teleopGP.ferry].reduce(
                            (partialSum, a) => partialSum + a,
                            0
                        ) ? (
                            <Flex height={`${maxContainerHeight - 215}px`} margin={'0 auto'} gap={'15px'}>
                                <Button
                                    colorScheme={'teal'}
                                    fontSize={'xl'}
                                    fontWeight={'bold'}
                                    flex={1 / 2}
                                    height={'100%'}
                                    onClick={() => {
                                        standFormManagers.teleop.doCommand(standFormData, scoutedField.intakeSource.field);
                                    }}
                                >
                                    Source: {standFormData.teleopGP.intakeSource}
                                </Button>
                                <Button
                                    colorScheme={'facebook'}
                                    fontSize={'xl'}
                                    fontWeight={'bold'}
                                    flex={1 / 2}
                                    height={'100%'}
                                    onClick={() => {
                                        standFormManagers.teleop.doCommand(standFormData, scoutedField.intakeGround.field);
                                    }}
                                >
                                    Ground: {standFormData.teleopGP.intakeGround}
                                </Button>
                            </Flex>
                        ) : (
                            <Flex height={`${maxContainerHeight - 215}px`} flexDir={'column'} margin={'0 auto'} gap={'15px'}>
                                <Flex flex={1 / 2} gap={'15px'}>
                                    <Button
                                        colorScheme={'teal'}
                                        fontSize={'xl'}
                                        fontWeight={'bold'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        onClick={() => {
                                            standFormManagers.teleop.doCommand(standFormData, scoutedField.ampScore.field);
                                        }}
                                    >
                                        Amp: {standFormData.teleopGP.ampScore}
                                    </Button>
                                    <Button
                                        colorScheme={'facebook'}
                                        fontSize={'xl'}
                                        fontWeight={'bold'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        onClick={() => {
                                            standFormManagers.teleop.doCommand(standFormData, scoutedField.speakerScore.field);
                                        }}
                                    >
                                        Speaker: {standFormData.teleopGP.speakerScore}
                                    </Button>
                                </Flex>
                                <Flex flex={0.3} gap={'15px'}>
                                    <Button
                                        colorScheme={'pink'}
                                        fontSize={'xl'}
                                        fontWeight={'bold'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        onClick={() => {
                                            standFormManagers.teleop.doCommand(standFormData, scoutedField.ampMiss.field);
                                        }}
                                    >
                                        Amp Miss: {standFormData.teleopGP.ampMiss}
                                    </Button>
                                    <Button
                                        colorScheme={'purple'}
                                        fontSize={'xl'}
                                        fontWeight={'bold'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        whiteSpace={'normal'}
                                        onClick={() => {
                                            standFormManagers.teleop.doCommand(standFormData, scoutedField.speakerMiss.field);
                                        }}
                                    >
                                        Speaker Miss: {standFormData.teleopGP.speakerMiss}
                                    </Button>
                                </Flex>
                                <Button
                                    colorScheme={'yellow'}
                                    fontSize={'xl'}
                                    fontWeight={'bold'}
                                    flex={0.2}
                                    onClick={() => {
                                        standFormManagers.teleop.doCommand(standFormData, scoutedField.ferry.field);
                                    }}
                                >
                                    Ferry: {standFormData.teleopGP.ferry}
                                </Button>
                            </Flex>
                        )}
                        <Flex flexDir={'column'} rowGap={'15px'} marginTop={'15px'}>
                            <HStack marginBottom={'20px'} gap={'15px'}>
                                <Flex flex={1 / 2} alignItems={'center'} flexDir={'column'} gap={'5px'}>
                                    <Text fontSize={'md'} fontWeight={'medium'}>
                                        Defense Rating
                                    </Text>
                                    <Slider
                                        min={0}
                                        max={3}
                                        step={1}
                                        value={standFormData.defenseRating}
                                        onChange={(value) => setStandFormData({ ...standFormData, defenseRating: value })}
                                        width={'75%'}
                                        focusThumbOnChange={false}
                                    >
                                        {defenseRatings.map((rating) => (
                                            <SliderMark key={rating.id} value={rating.value} marginTop={'5px'} marginLeft={rating.value ? '-3px' : '-17px'} fontSize={'sm'}>
                                                {rating.value || 'None'}
                                            </SliderMark>
                                        ))}
                                        <SliderTrack>
                                            <SliderFilledTrack />
                                        </SliderTrack>
                                        <SliderThumb boxSize={4} borderColor={'darkgreen'} />
                                    </Slider>
                                </Flex>
                                <Flex flex={1 / 2} alignItems={'center'} flexDir={'column'} gap={'5px'}>
                                    <Text fontSize={'md'} fontWeight={'medium'}>
                                        Defense Allocation
                                    </Text>
                                    <Slider
                                        min={0.25}
                                        max={1}
                                        step={0.25}
                                        value={standFormData.defenseAllocation}
                                        onChange={(value) => setStandFormData({ ...standFormData, defenseAllocation: value })}
                                        width={'75%'}
                                        isDisabled={standFormData.defenseRating === 0}
                                    >
                                        {defenseAllocations.map((allocation) => (
                                            <SliderMark key={allocation.id} value={allocation.value} marginTop={'5px'} marginLeft={'-9px'} fontSize={'sm'}>
                                                {allocation.label}
                                            </SliderMark>
                                        ))}
                                        <SliderTrack>
                                            <SliderFilledTrack />
                                        </SliderTrack>
                                        <SliderThumb boxSize={4} borderColor={'darkgreen'} />
                                    </Slider>
                                </Flex>
                            </HStack>
                            <HStack gap={0}>
                                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} flex={1 / 2}>
                                    Was Defended:
                                </Text>
                                <HStack flex={1 / 2} justifyContent={'center'} gap={'20px'}>
                                    {wasDefendedOptions.map((option) => (
                                        <Button
                                            key={option.id}
                                            onClick={() => setStandFormData({ ...standFormData, wasDefended: option.value })}
                                            colorScheme={standFormData.wasDefended === option.value ? 'blue' : 'gray'}
                                            outline={standFormData.wasDefended === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                        </Flex>
                        <HStack marginTop={`${15 + maxContainerHeight - (maxContainerHeight - 215) - 215}px`} marginBottom={'15px'} gap={'15px'}>
                            <Button flex={2 / 3} leftIcon={<IoChevronBack />} onClick={() => setActiveSection(sections.auto)}>
                                Auto
                            </Button>
                            <Text fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'} flex={1 / 3}>
                                {teamNumberParam}
                            </Text>
                            {futureAlly ? (
                                <StarIcon
                                    position={'absolute'}
                                    left={'50%'}
                                    transform={'translate(-50%, 0%)'}
                                    zIndex={-1}
                                    opacity={1}
                                    // stroke={'black'}
                                    viewBox={'-1 -1 26 26'}
                                    fontSize={'xl'}
                                    color={'yellow.300'}
                                />
                            ) : null}
                            <Button flex={2 / 3} rightIcon={<IoChevronForward />} onClick={() => setActiveSection(sections.endGame)}>
                                End Game
                            </Button>
                        </HStack>
                    </Box>
                );
            case sections.endGame:
                return (
                    <Box>
                        <HStack justifyContent={'center'} gap={'30px'}>
                            <Button
                                colorScheme={'gray'}
                                onClick={() => {
                                    standFormManagers.endGame.undo(standFormData);
                                }}
                                isDisabled={standFormManagers.endGame.getPosition() === -1}
                                width={'100%'}
                                whiteSpace={'pre-line'}
                            >
                                {standFormManagers.endGame.getPosition() === -1 ? 'Undo' : `Undo\n${standFormManagers.endGame.getUndoNote()}`}
                            </Button>
                            <Button
                                colorScheme={'gray'}
                                onClick={() => {
                                    standFormManagers.endGame.redo(standFormData);
                                }}
                                isDisabled={standFormManagers.endGame.getPosition() === standFormManagers.endGame.getHistoryLength() - 1}
                                width={'100%'}
                                whiteSpace={'pre-line'}
                            >
                                {standFormManagers.endGame.getPosition() === standFormManagers.endGame.getHistoryLength() - 1 ? 'Redo' : `Redo\n${standFormManagers.endGame.getRedoNote()}`}
                            </Button>
                        </HStack>
                        <Text
                            fontSize={'xl'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            margin={'5px 0'}
                            color={submitAttempted && !isFollowOrNoShow() && !validateSection(activeSection) ? 'red' : 'default'}
                        >
                            {activeSection}
                        </Text>
                        <Flex flexDir={'column'} rowGap={'15px'}>
                            <VStack gap={'5px'}>
                                <Text fontSize={'lg'} fontWeight={'semibold'}>
                                    Climb:
                                </Text>
                                <Flex columnGap={'10px'} width={'100%'} justifyContent={'center'}>
                                    {climbTypes.map((type) => (
                                        <Button
                                            key={type.id}
                                            onClick={() => setStandFormData({ ...standFormData, climb: type.label })}
                                            colorScheme={standFormData.climb === type.label ? type.color : 'gray'}
                                            flexGrow={0}
                                            whiteSpace={'normal'}
                                            outline={standFormData.climb === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                        >
                                            {type.label}
                                        </Button>
                                    ))}
                                </Flex>
                            </VStack>
                            <Button
                                colorScheme={'facebook'}
                                height={'60px'}
                                fontWeight={'bold'}
                                onClick={() => {
                                    standFormManagers.endGame.doCommand(standFormData, scoutedField.trap.field);
                                }}
                            >
                                Trap: {standFormData.teleopGP.trap}
                            </Button>
                            <HStack gap={0}>
                                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} flex={1 / 2}>
                                    Lost Comms:
                                </Text>
                                <HStack flex={1 / 2} justifyContent={'center'} gap={'20px'}>
                                    {loseCommOptions.map((option) => (
                                        <Button
                                            key={option.id}
                                            onClick={() => setStandFormData({ ...standFormData, loseCommunication: option.value })}
                                            colorScheme={standFormData.loseCommunication === option.value ? option.color : 'gray'}
                                            outline={standFormData.loseCommunication === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                            <HStack gap={0}>
                                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} flex={1 / 2}>
                                    Robot Broke:
                                </Text>
                                <HStack flex={1 / 2} justifyContent={'center'} gap={'20px'}>
                                    {robotBreakOptions.map((option) => (
                                        <Button
                                            key={option.id}
                                            onClick={() => setStandFormData({ ...standFormData, robotBreak: option.value })}
                                            colorScheme={standFormData.robotBreak === option.value ? option.color : 'gray'}
                                            outline={standFormData.robotBreak === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                            <HStack gap={0}>
                                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} flex={1 / 2}>
                                    Yellow Card:
                                </Text>
                                <HStack flex={1 / 2} justifyContent={'center'} gap={'20px'}>
                                    {yellowCardOptions.map((option) => (
                                        <Button
                                            key={option.id}
                                            onClick={() => setStandFormData({ ...standFormData, yellowCard: option.value })}
                                            colorScheme={standFormData.yellowCard === option.value ? option.color : 'gray'}
                                            outline={standFormData.yellowCard === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                            <HStack gap={0}>
                                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} flex={1 / 2}>
                                    Red Card:
                                </Text>
                                <HStack flex={1 / 2} justifyContent={'center'} gap={'20px'}>
                                    {redCardOptions.map((option) => (
                                        <Button
                                            key={option.id}
                                            onClick={() => setStandFormData({ ...standFormData, redCard: option.value })}
                                            colorScheme={standFormData.redCard === option.value ? option.color : 'gray'}
                                            outline={standFormData.redCard === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                        </Flex>
                        <HStack marginTop={`${Math.max(15, 15 + maxContainerHeight - 447)}px`} marginBottom={'15px'} gap={'15px'}>
                            <Button flex={2 / 3} leftIcon={<IoChevronBack />} onClick={() => setActiveSection(sections.teleop)}>
                                Teleop
                            </Button>
                            <Text fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'} flex={1 / 3}>
                                {teamNumberParam}
                            </Text>
                            {futureAlly ? (
                                <StarIcon
                                    position={'absolute'}
                                    left={'50%'}
                                    transform={'translate(-50%, 0%)'}
                                    zIndex={-1}
                                    opacity={1}
                                    // stroke={'black'}
                                    viewBox={'-1 -1 26 26'}
                                    fontSize={'xl'}
                                    color={'yellow.300'}
                                />
                            ) : null}
                            <Button flex={2 / 3} rightIcon={<IoChevronForward />} onClick={() => setActiveSection(sections.closing)}>
                                Closing
                            </Button>
                        </HStack>
                    </Box>
                );
            case sections.closing:
                return (
                    <Box>
                        <Text fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'} marginBottom={'5px'} color={submitAttempted && !validateSection(activeSection) ? 'red' : 'default'}>
                            {activeSection}
                        </Text>
                        <Flex flexDir={'column'} rowGap={'15px'}>
                            <Center>
                                <Textarea
                                    onChange={(event) => setStandFormData({ ...standFormData, standComment: event.target.value })}
                                    value={standFormData.standComment}
                                    placeholder='Only write comments you think are VITAL!'
                                />
                            </Center>
                            {standFormData.standStatus !== matchFormStatus.noShow && (
                                <Center>
                                    <Checkbox
                                        colorScheme={'yellow'}
                                        isChecked={standFormData.standStatus === matchFormStatus.followUp}
                                        onChange={() => setStandFormData({ ...standFormData, standStatus: standFormData.standStatus === matchFormStatus.followUp ? null : matchFormStatus.followUp })}
                                    >
                                        Mark For Follow Up
                                    </Checkbox>
                                </Center>
                            )}
                            {isFollowOrNoShow() ? (
                                <Center>
                                    <Textarea
                                        isInvalid={submitAttempted && standFormData.standStatusComment.trim() === ''}
                                        onChange={(event) => setStandFormData({ ...standFormData, standStatusComment: event.target.value })}
                                        value={standFormData.standStatusComment}
                                        placeholder={`What is the reason for the ${standFormData.standStatus.toLowerCase()}?`}
                                        outline={standFormData.standStatusComment.trim() === '' && submitAttempted && isFollowOrNoShow() ? '2px solid red' : 'none'}
                                    />
                                </Center>
                            ) : null}
                            {showQRCode && (
                                <Center margin={'0px 0px 0px 0px'}>
                                    <QRCode value={getQRValue()} size={maxContainerHeight - 115 - 15 - (standFormData.standStatus !== matchFormStatus.noShow && 39) - (isFollowOrNoShow() && 95)} />
                                </Center>
                            )}
                        </Flex>
                        <HStack
                            marginTop={`${
                                15 +
                                maxContainerHeight -
                                115 -
                                (standFormData.standStatus !== matchFormStatus.noShow && 39) -
                                (isFollowOrNoShow() && 95) -
                                (showQRCode && maxContainerHeight - 115 - (standFormData.standStatus !== matchFormStatus.noShow && 39) - (isFollowOrNoShow() && 95))
                            }px`}
                            marginBottom={'15px'}
                            gap={'15px'}
                        >
                            <Button flex={2 / 3} leftIcon={<IoChevronBack />} onClick={() => setActiveSection(sections.endGame)}>
                                End Game
                            </Button>
                            <Text fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'} flex={1 / 3}>
                                {teamNumberParam}
                            </Text>
                            {futureAlly ? (
                                <StarIcon
                                    position={'absolute'}
                                    left={'50%'}
                                    transform={'translate(-50%, 0%)'}
                                    zIndex={-1}
                                    opacity={1}
                                    // stroke={'black'}
                                    viewBox={'-1 -1 26 26'}
                                    fontSize={'xl'}
                                    color={'yellow.300'}
                                />
                            ) : null}
                            <Button flex={2 / 3} isDisabled={submitting} onClick={() => submit()}>
                                Submit
                            </Button>
                        </HStack>
                    </Box>
                );
            default:
                return null;
        }
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
                isOpen={standFormDialog}
                leastDestructiveRef={cancelRef}
                onClose={() => {
                    setStandFormDialog(false);
                }}
                autoFocus={false}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent margin={0} w={{ base: '75%', md: '40%', lg: '30%' }} top='25%'>
                        <AlertDialogHeader fontSize={'lg'} fontWeight={'semibold'}>
                            Unsaved Data
                        </AlertDialogHeader>
                        <AlertDialogBody>You have unsaved data for this stand form. Would you like to load it, delete it, or pull data from the cloud?</AlertDialogBody>
                        <AlertDialogFooter>
                            <Button
                                onClick={() => {
                                    setStandFormDialog(false);
                                    setLoadResponse(false);
                                    localStorage.removeItem('StandFormData');
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
                                        setStandFormDialog(false);
                                        setLoadResponse(false);
                                    }}
                                >
                                    Cloud
                                </Button>
                            )}
                            <Button
                                colorScheme='blue'
                                ml={3}
                                onClick={() => {
                                    setStandFormDialog(false);
                                    setLoadResponse(true);
                                    let matchForm = JSON.parse(localStorage.getItem('StandFormData'));
                                    matchForm.loading = false;
                                    setStandFormData(matchForm);
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

    if (standFormData.loading || whitespace === null || dimensionRatios === null || maxContainerHeight === null || standFormManagers === null || futureAlly === null) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Box margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
            {renderSection()}
        </Box>
    );
}

export default StandForm;

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
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from '@chakra-ui/icons';
import { deepEqual, getValueByRange } from '../util/helperFunctions';
import { AUTO_PIECE, AUTO_SCORE, TELEOP_INCREMENT, createCommandManager } from '../util/commandManager';
import '../stylesheets/standformstyle.css';
import { matchFormStatus } from '../util/helperConstants';
import PreAutoRedField from '../images/PreAutoRedField.png';
import PreAutoBlueField from '../images/PreAutoBlueField.png';
import AutoRedField from '../images/AutoRedField.png';
import AutoBlueField from '../images/AutoBlueField.png';
import QRCode from 'react-qr-code';
import { GlobalContext } from '../context/globalState';
import { AiOutlineRotateRight } from 'react-icons/ai';

let sections = {
    preAuto: { main: 'Pre-Auto' },
    auto: { main: 'Auto', subsections: { intake: 'Intake', score: 'Scoring' } },
    teleop: { main: 'Teleop', subsections: { intake: 'Intake', score: 'Scoring' } },
    endGame: { main: 'Endgame' },
    closing: { main: 'Closing' }
};
let startingPositions = [
    // 28, 35
    [0, 0, uuidv4()],
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
    { label: 'No Attempt', id: uuidv4() },
    { label: 'Success', id: uuidv4() },
    { label: 'Fail', id: uuidv4() }
];
let loseCommOptions = [
    { label: 'Yes', value: true, id: uuidv4() },
    { label: 'No', value: false, id: uuidv4() }
];
let robotBreakOptions = [
    { label: 'Yes', value: true, id: uuidv4() },
    { label: 'No', value: false, id: uuidv4() }
];
let yellowCardOptions = [
    { label: 'Yes', value: true, id: uuidv4() },
    { label: 'No', value: false, id: uuidv4() }
];
let redCardOptions = [
    { label: 'Yes', value: true, id: uuidv4() },
    { label: 'No', value: false, id: uuidv4() }
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

    const [activeSection, setActiveSection] = useState({
        section: sections.preAuto.main,
        subsection: null,
        lastAutoSection: sections.auto.subsections.intake,
        lastTeleopSection: sections.teleop.subsections.intake
    });
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
            groundIntake: 0,
            sourceIntake: 0,
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
        loading: true
    });
    const [error, setError] = useState(null);
    const [futureAlly, setFutureAlly] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [standFormAutoManager] = useState(createCommandManager());
    const [standFormTeleManager] = useState(createCommandManager());
    const [standFormEndManager] = useState(createCommandManager());
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
        }
    }, [standFormData, eventKeyParam, matchNumberParam, stationParam]);

    function getImageVariables() {
        const viewportWidth = window.innerWidth;
        // const viewportHeight = window.innerHeight;

        // Calculate image dimensions based on screen size
        const maxWidth = viewportWidth * getValueByRange(viewportWidth); // Adjust the multiplier as needed
        const maxHeight = Math.min(imageHeight, document.documentElement.clientHeight - 313.8);

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

        setMaxContainerHeight(scaledHeight + 143.8);
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
        if (section === sections.preAuto.main) {
            return validPreAuto();
        } else if (section === sections.auto.main) {
            return validAuto();
        } else if (section === sections.teleop.main) {
            return validTele();
        } else if (section === sections.endGame.main) {
            return validEndGame();
        } else if (section === sections.closing.main) {
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
        switch (activeSection.section) {
            case sections.preAuto.main:
                return (
                    <Box>
                        <Text
                            fontWeight={'bold'}
                            fontSize={'larger'}
                            textAlign={'center'}
                            marginBottom={'5px'}
                            color={submitAttempted && !isFollowOrNoShow() && !validateSection(activeSection.section) ? 'red' : 'black'}
                        >
                            Pre-Auto
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
                                    colorScheme={standFormData.startingPosition === index + 1 ? 'green' : 'gray'}
                                    outline={standFormData.startingPosition === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                >
                                    {index + 1}
                                </Button>
                            ))}
                            {preAutoImageSrc && (
                                <img src={preAutoImageSrc} style={{ zIndex: 0, margin: '0 auto', maxHeight: `${document.documentElement.clientHeight - 313.8}px` }} alt={'Field Map'} />
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
                                        setActiveSection({ ...activeSection, section: sections.closing.main });
                                    }
                                }}
                                colorScheme={standFormData.standStatus === matchFormStatus.noShow ? 'red' : 'gray'}
                            >
                                No Show
                            </Button>
                            <HStack gap={0}>
                                <Text fontWeight={'bold'} textAlign={'center'} flex={1 / 2}>
                                    Preloaded:
                                </Text>
                                <HStack flex={1 / 2} justifyContent={'center'} gap={'20px'}>
                                    {preLoadedPieces.map((piece) => (
                                        <Button
                                            key={piece.id}
                                            onClick={() => setStandFormData({ ...standFormData, preLoadedPiece: piece.label })}
                                            colorScheme={standFormData.preLoadedPiece === piece.label ? 'green' : 'gray'}
                                            outline={standFormData.preLoadedPiece === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                        >
                                            {piece.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                        </Flex>
                        <HStack marginTop={`${15 + maxContainerHeight - imageHeight * dimensionRatios.height - 143.8}px`} marginBottom={'15px'} gap={'15px'}>
                            <Button flex={2 / 3} wordBreak={'break-word'} whiteSpace={'none'} leftIcon={<AiOutlineRotateRight />} onClick={() => setFieldRotation((fieldRotation + 90) % 360)}>
                                Rotate
                            </Button>
                            <Text fontWeight={'bold'} fontSize={'larger'} textAlign={'center'} flex={1 / 3}>
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
                                    fontSize={'60px'}
                                    color={'yellow.300'}
                                />
                            ) : null}
                            <Button
                                flex={2 / 3}
                                rightIcon={<ChevronRightIcon />}
                                onClick={() => setActiveSection({ ...activeSection, section: sections.auto.main, subsection: activeSection.lastAutoSection })}
                            >
                                Auto
                            </Button>
                        </HStack>
                    </Box>
                );
            case sections.auto.main:
                return (
                    <Box>
                        <HStack justifyContent={'center'} gap={'30px'}>
                            <Button
                                colorScheme={'gray'}
                                onClick={() => {
                                    standFormAutoManager.undo(standFormData);
                                    let nextSubsection = activeSection.subsection === sections.auto.subsections.intake ? sections.auto.subsections.score : sections.auto.subsections.intake;
                                    setActiveSection({
                                        ...activeSection,
                                        subsection: nextSubsection,
                                        lastAutoSection: nextSubsection
                                    });
                                }}
                                isDisabled={standFormAutoManager.getPosition() === 0}
                                width={'100%'}
                                whiteSpace={'pre-line'}
                            >
                                {standFormAutoManager.getPosition() === 0 ? 'Undo' : `Undo\n${standFormAutoManager.getUndoNote()}`}
                            </Button>
                            <Button
                                colorScheme={'gray'}
                                onClick={() => {
                                    standFormAutoManager.redo(standFormData);
                                    let nextSubsection = activeSection.subsection === sections.auto.subsections.intake ? sections.auto.subsections.score : sections.auto.subsections.intake;
                                    setActiveSection({
                                        ...activeSection,
                                        subsection: nextSubsection,
                                        lastAutoSection: nextSubsection
                                    });
                                }}
                                isDisabled={standFormAutoManager.getPosition() === standFormAutoManager.getHistoryLength() - 1}
                                width={'100%'}
                                whiteSpace={'pre-line'}
                            >
                                {standFormAutoManager.getPosition() === standFormAutoManager.getHistoryLength() - 1 ? 'Redo' : `Redo\n${standFormAutoManager.getRedoNote()}`}
                            </Button>
                        </HStack>
                        <Text
                            fontWeight={'bold'}
                            fontSize={'larger'}
                            textAlign={'center'}
                            margin={'5px 0'}
                            color={submitAttempted && !isFollowOrNoShow() && !validateSection(activeSection.section) ? 'red' : 'black'}
                        >
                            {activeSection.section}: {activeSection.subsection}
                        </Text>
                        {activeSection.subsection === sections.auto.subsections.intake ? (
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
                                            standFormAutoManager.doCommand(AUTO_PIECE, standFormData, setStandFormData, index + 1);
                                            setActiveSection({ ...activeSection, subsection: sections.auto.subsections.score, lastAutoSection: sections.auto.subsections.score });
                                        }}
                                        isDisabled={standFormData.autoTimeline.some((element) => element.piece === index + 1)}
                                        _disabled={{ backgroundColor: '#38A169', textColor: 'white', _hover: { backgroundColor: '#38A169' }, cursor: 'default' }}
                                    >
                                        {index + 1}
                                    </Button>
                                ))}
                                {autoImageSrc && <img src={autoImageSrc} style={{ zIndex: 0, margin: '0 auto', maxHeight: `${document.documentElement.clientHeight - 313.8}px` }} alt={'Field Map'} />}
                            </Box>
                        ) : (
                            <Flex width={`${imageWidth * dimensionRatios.width}px`} height={`${imageHeight * dimensionRatios.height}px`} flexDir={'column'} margin={'0 auto'} gap={'15px'}>
                                <Flex flex={1 / 2} gap={'15px'}>
                                    <Button
                                        colorScheme={'teal'}
                                        fontWeight={'bold'}
                                        fontSize={'larger'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        onClick={() => {
                                            standFormAutoManager.doCommand(AUTO_SCORE, standFormData, setStandFormData, 'amp', 'Amp');
                                            setActiveSection({ ...activeSection, subsection: sections.auto.subsections.intake, lastAutoSection: sections.auto.subsections.intake });
                                        }}
                                    >
                                        Amp - {standFormData.autoTimeline.reduce((acc, element) => (element.scored === 'amp' ? ++acc : acc), 0)}
                                    </Button>
                                    <Button
                                        colorScheme={'facebook'}
                                        fontWeight={'bold'}
                                        fontSize={'larger'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        onClick={() => {
                                            standFormAutoManager.doCommand(AUTO_SCORE, standFormData, setStandFormData, 'speaker', 'Speaker');
                                            setActiveSection({ ...activeSection, subsection: sections.auto.subsections.intake, lastAutoSection: sections.auto.subsections.intake });
                                        }}
                                    >
                                        Speaker - {standFormData.autoTimeline.reduce((acc, element) => (element.scored === 'speaker' ? ++acc : acc), 0)}
                                    </Button>
                                </Flex>
                                <Flex flex={0.3} gap={'15px'}>
                                    <Button
                                        colorScheme={'pink'}
                                        fontWeight={'bold'}
                                        fontSize={'larger'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        onClick={() => {
                                            standFormAutoManager.doCommand(AUTO_SCORE, standFormData, setStandFormData, 'amp_miss', 'Amp Miss');
                                            setActiveSection({ ...activeSection, subsection: sections.auto.subsections.intake, lastAutoSection: sections.auto.subsections.intake });
                                        }}
                                    >
                                        Amp Miss - {standFormData.autoTimeline.reduce((acc, element) => (element.scored === 'amp_miss' ? ++acc : acc), 0)}
                                    </Button>
                                    <Button
                                        colorScheme={'purple'}
                                        fontWeight={'bold'}
                                        fontSize={'larger'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        whiteSpace={'normal'}
                                        onClick={() => {
                                            standFormAutoManager.doCommand(AUTO_SCORE, standFormData, setStandFormData, 'speaker_miss', 'Speaker Miss');
                                            setActiveSection({ ...activeSection, subsection: sections.auto.subsections.intake, lastAutoSection: sections.auto.subsections.intake });
                                        }}
                                    >
                                        Speaker Miss - {standFormData.autoTimeline.reduce((acc, element) => (element.scored === 'speaker_miss' ? ++acc : acc), 0)}
                                    </Button>
                                </Flex>
                                <Button
                                    colorScheme={'yellow'}
                                    fontWeight={'bold'}
                                    fontSize={'larger'}
                                    flex={0.2}
                                    onClick={() => {
                                        standFormAutoManager.doCommand(AUTO_SCORE, standFormData, setStandFormData, 'intake_miss', 'Intake Miss');
                                        setActiveSection({ ...activeSection, subsection: sections.auto.subsections.intake, lastAutoSection: sections.auto.subsections.intake });
                                    }}
                                >
                                    Intake Miss - {standFormData.autoTimeline.reduce((acc, element) => (element.scored === 'intake_miss' ? ++acc : acc), 0)}
                                </Button>
                            </Flex>
                        )}
                        <Flex flexDir={'column'} rowGap={'15px'} marginTop={'15px'}>
                            <HStack gap={0}>
                                <Text fontWeight={'bold'} textAlign={'center'} flex={1 / 2}>
                                    Left starting zone:
                                </Text>
                                <HStack flex={1 / 2} justifyContent={'center'} gap={'20px'}>
                                    {leaveAutoOptions.map((option) => (
                                        <Button
                                            key={option.id}
                                            onClick={() => setStandFormData({ ...standFormData, leftStart: option.value })}
                                            colorScheme={standFormData.leftStart === option.value ? 'green' : 'gray'}
                                            outline={standFormData.leftStart === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                        </Flex>
                        <HStack marginTop={`${15 + maxContainerHeight - imageHeight * dimensionRatios.height - 133.8}px`} marginBottom={'15px'} gap={'15px'}>
                            <Button flex={2 / 3} leftIcon={<ChevronLeftIcon />} onClick={() => setActiveSection({ ...activeSection, section: sections.preAuto.main, subsection: null })}>
                                Pre-Auto
                            </Button>
                            <Text fontWeight={'bold'} fontSize={'larger'} textAlign={'center'} flex={1 / 3}>
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
                                    fontSize={'60px'}
                                    color={'yellow.300'}
                                />
                            ) : null}
                            <Button
                                flex={2 / 3}
                                rightIcon={<ChevronRightIcon />}
                                onClick={() => setActiveSection({ ...activeSection, section: sections.teleop.main, subsection: activeSection.lastTeleopSection })}
                            >
                                Teleop
                            </Button>
                        </HStack>
                    </Box>
                );
            case sections.teleop.main:
                return (
                    <Box>
                        <HStack justifyContent={'center'} gap={'30px'}>
                            <Button
                                colorScheme={'gray'}
                                onClick={() => {
                                    standFormTeleManager.undo(standFormData);
                                    let nextSubsection = activeSection.subsection === sections.teleop.subsections.intake ? sections.teleop.subsections.score : sections.teleop.subsections.intake;
                                    setActiveSection({
                                        ...activeSection,
                                        subsection: nextSubsection,
                                        lastTeleopSection: nextSubsection
                                    });
                                }}
                                isDisabled={standFormTeleManager.getPosition() === 0}
                                width={'100%'}
                                whiteSpace={'pre-line'}
                            >
                                {standFormTeleManager.getPosition() === 0 ? 'Undo' : `Undo\n${standFormTeleManager.getUndoNote()}`}
                            </Button>
                            <Button
                                colorScheme={'gray'}
                                onClick={() => {
                                    standFormTeleManager.redo(standFormData);
                                    let nextSubsection = activeSection.subsection === sections.teleop.subsections.intake ? sections.teleop.subsections.score : sections.teleop.subsections.intake;
                                    setActiveSection({
                                        ...activeSection,
                                        subsection: nextSubsection,
                                        lastTeleopSection: nextSubsection
                                    });
                                }}
                                isDisabled={standFormTeleManager.getPosition() === standFormTeleManager.getHistoryLength() - 1}
                                width={'100%'}
                                whiteSpace={'pre-line'}
                            >
                                {standFormTeleManager.getPosition() === standFormTeleManager.getHistoryLength() - 1 ? 'Redo' : `Redo\n${standFormTeleManager.getRedoNote()}`}
                            </Button>
                        </HStack>
                        <Text
                            fontWeight={'bold'}
                            fontSize={'larger'}
                            textAlign={'center'}
                            margin={'5px 0'}
                            color={submitAttempted && !isFollowOrNoShow() && !validateSection(activeSection.section) ? 'red' : 'black'}
                        >
                            {activeSection.section}: {activeSection.subsection}
                        </Text>
                        {activeSection.subsection === sections.teleop.subsections.intake ? (
                            <Flex width={`${imageWidth * dimensionRatios.width}px`} height={`${maxContainerHeight - 213.8}px`} margin={'0 auto'} gap={'15px'}>
                                <Button
                                    colorScheme={'teal'}
                                    fontWeight={'bold'}
                                    fontSize={'larger'}
                                    flex={1 / 2}
                                    height={'100%'}
                                    onClick={() => {
                                        standFormTeleManager.doCommand(TELEOP_INCREMENT, standFormData, setStandFormData, 'sourceIntake', 'Source');
                                        setActiveSection({ ...activeSection, subsection: sections.teleop.subsections.score, lastTeleopSection: sections.teleop.subsections.score });
                                    }}
                                >
                                    Source - {standFormData.teleopGP.sourceIntake}
                                </Button>
                                <Button
                                    colorScheme={'facebook'}
                                    fontWeight={'bold'}
                                    fontSize={'larger'}
                                    flex={1 / 2}
                                    height={'100%'}
                                    onClick={() => {
                                        standFormTeleManager.doCommand(TELEOP_INCREMENT, standFormData, setStandFormData, 'groundIntake', 'Ground');
                                        setActiveSection({ ...activeSection, subsection: sections.teleop.subsections.score, lastTeleopSection: sections.teleop.subsections.score });
                                    }}
                                >
                                    Ground - {standFormData.teleopGP.groundIntake}
                                </Button>
                            </Flex>
                        ) : (
                            <Flex width={`${imageWidth * dimensionRatios.width}px`} height={`${maxContainerHeight - 213.8}px`} flexDir={'column'} margin={'0 auto'} gap={'15px'}>
                                <Flex flex={1 / 2} gap={'15px'}>
                                    <Button
                                        colorScheme={'teal'}
                                        fontWeight={'bold'}
                                        fontSize={'larger'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        onClick={() => {
                                            standFormTeleManager.doCommand(TELEOP_INCREMENT, standFormData, setStandFormData, 'ampScore', 'Amp');
                                            setActiveSection({ ...activeSection, subsection: sections.teleop.subsections.intake, lastTeleopSection: sections.teleop.subsections.intake });
                                        }}
                                    >
                                        Amp - {standFormData.teleopGP.ampScore}
                                    </Button>
                                    <Button
                                        colorScheme={'facebook'}
                                        fontWeight={'bold'}
                                        fontSize={'larger'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        onClick={() => {
                                            standFormTeleManager.doCommand(TELEOP_INCREMENT, standFormData, setStandFormData, 'speakerScore', 'Speaker');
                                            setActiveSection({ ...activeSection, subsection: sections.teleop.subsections.intake, lastTeleopSection: sections.teleop.subsections.intake });
                                        }}
                                    >
                                        Speaker - {standFormData.teleopGP.speakerScore}
                                    </Button>
                                </Flex>
                                <Flex flex={0.3} gap={'15px'}>
                                    <Button
                                        colorScheme={'pink'}
                                        fontWeight={'bold'}
                                        fontSize={'larger'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        onClick={() => {
                                            standFormTeleManager.doCommand(TELEOP_INCREMENT, standFormData, setStandFormData, 'ampMiss', 'Amp Miss');
                                            setActiveSection({ ...activeSection, subsection: sections.teleop.subsections.intake, lastTeleopSection: sections.teleop.subsections.intake });
                                        }}
                                    >
                                        Amp Miss - {standFormData.teleopGP.ampMiss}
                                    </Button>
                                    <Button
                                        colorScheme={'purple'}
                                        fontWeight={'bold'}
                                        fontSize={'larger'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        whiteSpace={'normal'}
                                        onClick={() => {
                                            standFormTeleManager.doCommand(TELEOP_INCREMENT, standFormData, setStandFormData, 'speakerTele', 'Speaker Miss');
                                            setActiveSection({ ...activeSection, subsection: sections.teleop.subsections.intake, lastTeleopSection: sections.teleop.subsections.intake });
                                        }}
                                    >
                                        Speaker Miss - {standFormData.teleopGP.speakerMiss}
                                    </Button>
                                </Flex>
                                <Button
                                    colorScheme={'yellow'}
                                    fontWeight={'bold'}
                                    fontSize={'larger'}
                                    flex={0.2}
                                    onClick={() => {
                                        standFormTeleManager.doCommand(TELEOP_INCREMENT, standFormData, setStandFormData, 'ferry', 'Ferry');
                                        setActiveSection({ ...activeSection, subsection: sections.teleop.subsections.intake, lastTeleopSection: sections.teleop.subsections.intake });
                                    }}
                                >
                                    Ferry - {standFormData.teleopGP.ferry}
                                </Button>
                            </Flex>
                        )}
                        <Flex flexDir={'column'} rowGap={'15px'} marginTop={'15px'}>
                            <HStack marginBottom={'20px'}>
                                <Flex flex={1 / 2} alignItems={'center'} flexDir={'column'} gap={'5px'}>
                                    <Center fontWeight={'bold'} textAlign={'center'}>
                                        Defense Rating
                                    </Center>
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
                                    <Text fontWeight={'bold'} textAlign={'center'}>
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
                                <Text fontWeight={'bold'} textAlign={'center'} flex={1 / 2}>
                                    Was Defended:
                                </Text>
                                <HStack flex={1 / 2} justifyContent={'center'} gap={'20px'}>
                                    {wasDefendedOptions.map((option) => (
                                        <Button
                                            key={option.id}
                                            onClick={() => setStandFormData({ ...standFormData, wasDefended: option.value })}
                                            colorScheme={standFormData.wasDefended === option.value ? 'green' : 'gray'}
                                            outline={standFormData.wasDefended === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                        </Flex>
                        <HStack marginTop={`${15 + maxContainerHeight - (maxContainerHeight - 213.8) - 213.8}px`} marginBottom={'15px'} gap={'15px'}>
                            <Button
                                flex={2 / 3}
                                leftIcon={<ChevronLeftIcon />}
                                onClick={() =>
                                    setActiveSection({
                                        ...activeSection,
                                        section: sections.auto.main,
                                        subsection: activeSection.lastAutoSection
                                    })
                                }
                            >
                                Auto
                            </Button>
                            <Text fontWeight={'bold'} fontSize={'larger'} textAlign={'center'} flex={1 / 3}>
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
                                    fontSize={'60px'}
                                    color={'yellow.300'}
                                />
                            ) : null}
                            <Button flex={2 / 3} rightIcon={<ChevronRightIcon />} onClick={() => setActiveSection({ ...activeSection, section: sections.endGame.main, subsection: null })}>
                                End Game
                            </Button>
                        </HStack>
                    </Box>
                );
            case sections.endGame.main:
                return (
                    <Box>
                        <HStack justifyContent={'center'} gap={'30px'}>
                            <Button
                                colorScheme={'gray'}
                                onClick={() => {
                                    standFormEndManager.undo(standFormData);
                                }}
                                isDisabled={standFormEndManager.getPosition() === 0}
                                width={'100%'}
                                whiteSpace={'pre-line'}
                            >
                                {standFormEndManager.getPosition() === 0 ? 'Undo' : `Undo\n${standFormEndManager.getUndoNote()}`}
                            </Button>
                            <Button
                                colorScheme={'gray'}
                                onClick={() => {
                                    standFormEndManager.redo(standFormData);
                                }}
                                isDisabled={standFormEndManager.getPosition() === standFormEndManager.getHistoryLength() - 1}
                                width={'100%'}
                                whiteSpace={'pre-line'}
                            >
                                {standFormEndManager.getPosition() === standFormEndManager.getHistoryLength() - 1 ? 'Redo' : `Redo\n${standFormEndManager.getRedoNote()}`}
                            </Button>
                        </HStack>
                        <Text
                            fontWeight={'bold'}
                            fontSize={'larger'}
                            textAlign={'center'}
                            margin={'5px 0'}
                            color={submitAttempted && !isFollowOrNoShow() && !validateSection(activeSection.section) ? 'red' : 'black'}
                        >
                            End Game
                        </Text>
                        <Flex flexDir={'column'} rowGap={'15px'}>
                            <VStack gap={'5px'}>
                                <Text fontWeight={'bold'}>Climb:</Text>
                                <HStack gap={'15px'}>
                                    {climbTypes.map((type) => (
                                        <Button
                                            key={type.id}
                                            onClick={() => setStandFormData({ ...standFormData, climb: type.label })}
                                            colorScheme={standFormData.climb === type.label ? 'green' : 'gray'}
                                            flex={1 / 3}
                                            whiteSpace={'normal'}
                                            outline={standFormData.climb === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                        >
                                            {type.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </VStack>
                            <Button
                                colorScheme={'facebook'}
                                height={'60px'}
                                fontWeight={'bold'}
                                onClick={() => {
                                    standFormEndManager.doCommand(TELEOP_INCREMENT, standFormData, setStandFormData, 'trap', 'Trap');
                                }}
                            >
                                Trap - {standFormData.teleopGP.trap}
                            </Button>
                            <HStack gap={0}>
                                <Text fontWeight={'bold'} textAlign={'center'} flex={1 / 2}>
                                    Lose Communication:
                                </Text>
                                <HStack flex={1 / 2} justifyContent={'center'} gap={'20px'}>
                                    {loseCommOptions.map((option) => (
                                        <Button
                                            key={option.id}
                                            onClick={() => setStandFormData({ ...standFormData, loseCommunication: option.value })}
                                            colorScheme={standFormData.loseCommunication === option.value ? 'green' : 'gray'}
                                            outline={standFormData.loseCommunication === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                            <HStack gap={0}>
                                <Text fontWeight={'bold'} textAlign={'center'} flex={1 / 2}>
                                    Robot Broke:
                                </Text>
                                <HStack flex={1 / 2} justifyContent={'center'} gap={'20px'}>
                                    {robotBreakOptions.map((option) => (
                                        <Button
                                            key={option.id}
                                            onClick={() => setStandFormData({ ...standFormData, robotBreak: option.value })}
                                            colorScheme={standFormData.robotBreak === option.value ? 'green' : 'gray'}
                                            outline={standFormData.robotBreak === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                            <HStack gap={0}>
                                <Text fontWeight={'bold'} textAlign={'center'} flex={1 / 2}>
                                    Yellow Card:
                                </Text>
                                <HStack flex={1 / 2} justifyContent={'center'} gap={'20px'}>
                                    {yellowCardOptions.map((option) => (
                                        <Button
                                            key={option.id}
                                            onClick={() => setStandFormData({ ...standFormData, yellowCard: option.value })}
                                            colorScheme={standFormData.yellowCard === option.value ? 'green' : 'gray'}
                                            outline={standFormData.yellowCard === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                            <HStack gap={0}>
                                <Text fontWeight={'bold'} textAlign={'center'} flex={1 / 2}>
                                    Red Card:
                                </Text>
                                <HStack flex={1 / 2} justifyContent={'center'} gap={'20px'}>
                                    {redCardOptions.map((option) => (
                                        <Button
                                            key={option.id}
                                            onClick={() => setStandFormData({ ...standFormData, redCard: option.value })}
                                            colorScheme={standFormData.redCard === option.value ? 'green' : 'gray'}
                                            outline={standFormData.redCard === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                        </Flex>
                        <HStack marginTop={`${15 + maxContainerHeight - 442.8}px`} marginBottom={'15px'} gap={'15px'}>
                            <Button
                                flex={2 / 3}
                                leftIcon={<ChevronLeftIcon />}
                                onClick={() =>
                                    setActiveSection({
                                        ...activeSection,
                                        section: sections.teleop.main,
                                        subsection: activeSection.lastTeleopSection
                                    })
                                }
                            >
                                Teleop
                            </Button>
                            <Text fontWeight={'bold'} fontSize={'larger'} textAlign={'center'} flex={1 / 3}>
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
                                    fontSize={'60px'}
                                    color={'yellow.300'}
                                />
                            ) : null}
                            <Button flex={2 / 3} rightIcon={<ChevronRightIcon />} onClick={() => setActiveSection({ ...activeSection, section: sections.closing.main, subsection: null })}>
                                Closing
                            </Button>
                        </HStack>
                    </Box>
                );
            case sections.closing.main:
                return (
                    <Box>
                        <Text fontWeight={'bold'} fontSize={'larger'} textAlign={'center'} marginBottom={'5px'} color={submitAttempted && !validateSection(activeSection.section) ? 'red' : 'black'}>
                            Closing
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
                                        colorScheme={'green'}
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
                                <Center margin={'10px 0px 20px 0px'}>
                                    <QRCode value={getQRValue()} size={`${maxContainerHeight - 182.8 - (isFollowOrNoShow() && 95)}px`} />
                                </Center>
                            )}
                        </Flex>
                        <HStack
                            marginTop={`${15 + maxContainerHeight - 152.8 - (isFollowOrNoShow() && 95) - (showQRCode && maxContainerHeight + 45 - 182.8 - (isFollowOrNoShow() && 95))}px`}
                            marginBottom={'15px'}
                            gap={'15px'}
                        >
                            <Button flex={2 / 3} leftIcon={<ChevronLeftIcon />} onClick={() => setActiveSection({ ...activeSection, section: sections.endGame.main })}>
                                End Game
                            </Button>
                            <Text fontWeight={'bold'} fontSize={'larger'} textAlign={'center'} flex={1 / 3}>
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
                                    fontSize={'60px'}
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
                isOpen={standFormDialog}
                leastDestructiveRef={cancelRef}
                onClose={() => {
                    setStandFormDialog(false);
                }}
                autoFocus={false}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent margin={0} w={{ base: '75%', md: '40%', lg: '30%' }} top='25%'>
                        <AlertDialogHeader color='black' fontSize='lg' fontWeight='bold'>
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

    if (standFormData.loading || whitespace === null || dimensionRatios === null || maxContainerHeight === null || futureAlly === null) {
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

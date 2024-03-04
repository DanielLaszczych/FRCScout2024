import React, { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
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
    Icon,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Slider,
    SliderFilledTrack,
    SliderMark,
    SliderThumb,
    SliderTrack,
    Spinner,
    Text,
    Textarea,
    VStack,
    useDisclosure,
    useToast
} from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';
import { checksum, deepEqual, getValueByRange } from '../util/helperFunctions';
import { AUTO, ENDGAME, TELEOP, createHistoryManager } from '../util/historyManager';
import '../stylesheets/standformstyle.css';
import { matchFormStatus, gamePieceFields, teamPageTabs } from '../util/helperConstants';
import PreAutoRedField from '../images/PreAutoRedField.png';
import PreAutoBlueField from '../images/PreAutoBlueField.png';
import AutoRedField from '../images/AutoRedField.png';
import AutoBlueField from '../images/AutoBlueField.png';
import QRCode from 'react-qr-code';
import { GlobalContext } from '../context/globalState';
import { AiOutlineRotateRight } from 'react-icons/ai';
import { IoChevronForward, IoChevronBack } from 'react-icons/io5';
import { LuDonut } from 'react-icons/lu';
import { AuthContext } from '../context/auth';

let sections = {
    preAuto: { label: 'Pre-Auto', spaceUsed: 100 + 35 + 110 + 85 },
    auto: { label: 'Auto', spaceUsed: 100 + 40 + 40 + 55 + 85 },
    teleop: { label: 'Teleop', spaceUsed: 100 + 40 + 40 + 135 + 85 },
    endGame: { label: 'Endgame', spaceUsed: 100 + 40 + 40 + 157 + 85 },
    closing: { label: 'Closing', spaceUsed: 100 + 35 + 339 + 85 }
};
let startingPositions = [
    [28, 35, uuidv4()],
    [60, 118, uuidv4()],
    [28, 200, uuidv4()],
    [28, 300, uuidv4()]
];
let preloadedPieces = [
    { label: 'None', id: uuidv4() },
    { label: 'Note', id: uuidv4() }
];
let autoStartingPositions = [
    [20, 31, uuidv4()],
    [45, 107, uuidv4()],
    [20, 185, uuidv4()],
    [20, 280, uuidv4()]
];
let notePositions = [
    [119, 31, uuidv4()],
    [119, 107, uuidv4()],
    [119, 185, uuidv4()],
    [405, 5, uuidv4()],
    [405, 95, uuidv4()],
    [405, 185, uuidv4()],
    [405, 275, uuidv4()],
    [405, 365, uuidv4()]
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
    { label: 'Fail', color: 'red', id: uuidv4() }
];
let climbLocations = [
    { label: 'Center', color: 'blue', id: uuidv4() },
    { label: 'Side', color: 'blue', id: uuidv4() }
];
let parkOptions = [
    { label: 'Yes', value: true, color: 'green', id: uuidv4() },
    { label: 'No', value: false, color: 'red', id: uuidv4() }
];
let lostCommOptions = [
    { label: 'Yes', value: true, color: 'red', id: uuidv4() },
    { label: 'No', value: false, color: 'green', id: uuidv4() }
];
let robotBrokeOptions = [
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
let imageDimensions = {
    preAuto: {
        width: 435,
        height: 435
    },
    auto: {
        width: 503,
        height: 436
    }
};

function StandForm() {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    const {
        eventKey: eventKeyParam,
        matchNumber: matchNumberParam,
        station: stationParam,
        teamNumber: teamNumberParam
    } = useParams();
    const { offline } = useContext(GlobalContext);
    const { user } = useContext(AuthContext);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const cancelRef = useRef(null);

    const [activeSection, setActiveSection] = useState(sections.preAuto);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [standFormDialog, setStandFormDialog] = useState(false);
    const [fieldRotation, setFieldRotation] = useState(0);
    const [loadResponse, setLoadResponse] = useState(null);
    const prevStandFormData = useRef(null);
    const [standFormData, setStandFormData] = useState({
        startingPosition: null,
        preloadedPiece: null,
        leftStart: null,
        autoTimeline: [],
        teleopGP: {
            intakeSource: 0,
            intakeGround: 0,
            intakePreloaded: 0,
            ampScore: 0,
            speakerScore: 0,
            ampMiss: 0,
            speakerMiss: 0,
            ferry: 0,
            trap: 0
        },
        wasDefended: null,
        defenseRating: 0,
        defenseAllocation: 0,
        climb: {
            attempt: null,
            location: null,
            harmony: null,
            park: null
        },
        lostCommunication: null,
        robotBroke: null,
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
    const [imageDimensionRatios, setImageDimensionRatios] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [heightDimensions, setHeightDimensions] = useState({ availableScoringSpace: null, max: null });

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
            if (
                standForm.eventKeyParam === eventKeyParam &&
                standForm.matchNumberParam === matchNumberParam &&
                standForm.stationParam === stationParam
            ) {
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
                fetch(`/${matchNumberParam.startsWith('pm') ? 'practiceForm' : 'matchForm'}/getMatchForm`, {
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
            let obj = {
                red: stationParam.charAt(0) === 'r' ? fieldRotation : oldObj.red,
                blue: stationParam.charAt(0) === 'b' ? fieldRotation : oldObj.blue
            };
            localStorage.setItem('Field Rotation', JSON.stringify(obj));
        } else {
            let obj = {
                red: stationParam.charAt(0) === 'r' ? fieldRotation : null,
                blue: stationParam.charAt(0) === 'b' ? fieldRotation : null
            };
            localStorage.setItem('Field Rotation', JSON.stringify(obj));
        }
    }, [stationParam, fieldRotation]);

    useEffect(() => {
        if (prevStandFormData.current !== null) {
            if (!deepEqual(prevStandFormData.current, standFormData)) {
                localStorage.setItem(
                    'StandFormData',
                    JSON.stringify({ ...standFormData, eventKeyParam, matchNumberParam, stationParam })
                );
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

    useLayoutEffect(() => {
        setImageLoaded(false);
    }, [activeSection]);

    function getHeightDimensions() {
        let availableSpace = document.documentElement.clientHeight;
        return {
            availableScoringSpace: Math.min(
                imageDimensions.preAuto.height + sections.preAuto.spaceUsed - sections.teleop.spaceUsed,
                Math.max(availableSpace - sections.teleop.spaceUsed, 200)
            ),
            max: Math.min(availableSpace, imageDimensions.preAuto.height + sections.preAuto.spaceUsed)
        };
    }

    const resizeMaxContainerHeight = useCallback(() => {
        setHeightDimensions(getHeightDimensions());
    }, []);

    const getImageVariables = useCallback(() => {
        const viewportWidth = window.innerWidth;
        // const viewportHeight = window.innerHeight;

        let maxWidth = viewportWidth * getValueByRange(viewportWidth);
        let maxHeight;
        if (activeSection.label === sections.preAuto.label) {
            maxHeight = getHeightDimensions().max - sections.preAuto.spaceUsed;
        } else {
            if (fieldRotation % 180 !== 0) {
                maxHeight = maxWidth;
                maxWidth = getHeightDimensions().availableScoringSpace;
            } else {
                maxHeight = getHeightDimensions().availableScoringSpace;
            }
        }

        let newDimensionsRatios = {};
        for (const imageKey in imageDimensions) {
            let imageWidth = imageDimensions[imageKey].width;
            let imageHeight = imageDimensions[imageKey].height;

            let screenAspectRatio = maxWidth / maxHeight;
            let imageAspectRatio = imageWidth / imageHeight;

            let scaledWidth, scaledHeight;
            if (imageAspectRatio > screenAspectRatio) {
                // Original image has a wider aspect ratio, so add horizontal whitespace
                scaledWidth = maxWidth;
                scaledHeight = maxWidth / imageAspectRatio;

                // Commenting this because we will never white space because we
                // position inside the image
                // const extraHorizontalSpace = maxHeight - scaledHeight;
                // const whitespaceTop = extraHorizontalSpace / 2;
                // const whitespaceBottom = extraHorizontalSpace / 2;
                // setWhitespace({ top: whitespaceTop, bottom: whitespaceBottom, left: 0, right: 0 });
            } else {
                // Original image has a taller aspect ratio, so add vertical whitespace
                scaledHeight = maxHeight;
                scaledWidth = maxHeight * imageAspectRatio;

                // Commenting this because we will never white space because we
                // position inside the image
                // const extraVerticalSpace = maxWidth - scaledWidth;
                // const whitespaceLeft = extraVerticalSpace / 2;
                // const whitespaceRight = extraVerticalSpace / 2;
                // setWhitespace({ top: 0, bottom: 0, left: whitespaceLeft, right: whitespaceRight });
            }

            // Calculate the new dimensions to fit the screen while maintaining the aspect ratio
            newDimensionsRatios[imageKey] = { width: scaledWidth / imageWidth, height: scaledHeight / imageHeight };
        }
        setImageDimensionRatios(newDimensionsRatios);
    }, [activeSection, fieldRotation]);

    useEffect(() => {
        getImageVariables();
        resizeMaxContainerHeight();
        window.addEventListener('resize', getImageVariables);
        window.addEventListener('resize', resizeMaxContainerHeight);

        return () => {
            window.removeEventListener('resize', getImageVariables);
            window.removeEventListener('resize', resizeMaxContainerHeight);
        };
    }, [resizeMaxContainerHeight, getImageVariables]);

    useEffect(() => {
        if (standFormData.defenseRating !== 0 && standFormData.defenseAllocation === 0) {
            setStandFormData({ ...standFormData, defenseAllocation: 0.25 });
        } else if (standFormData.defenseRating === 0 && standFormData.defenseAllocation > 0) {
            setStandFormData({ ...standFormData, defenseAllocation: 0 });
        }
    }, [standFormData.defenseRating, standFormData.defenseAllocation, standFormData]);

    function getPoint(pointX) {
        let mirror;
        if (activeSection.label === sections.preAuto.label) {
            mirror = 185;
        } else {
            mirror = 217;
        }
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
        return standFormData.startingPosition !== null && standFormData.preloadedPiece !== null;
    }

    function validAuto() {
        return standFormData.leftStart !== null;
    }

    function validTele() {
        return standFormData.wasDefended !== null;
    }

    function validEndGame() {
        return (
            standFormData.climb.attempt !== null &&
            (standFormData.climb.attempt === 'Success'
                ? standFormData.climb.location !== null && standFormData.climb.harmony !== null
                : standFormData.climb.park !== null)
        );
    }

    function validClosing() {
        return (
            standFormData.lostCommunication !== null &&
            standFormData.robotBroke !== null &&
            standFormData.yellowCard !== null &&
            standFormData.redCard !== null &&
            (!isFollowOrNoShow() || standFormData.standStatusComment.trim() !== '')
        );
    }

    function validateSection(section) {
        if (section.label === sections.preAuto.label) {
            return validPreAuto();
        } else if (section.label === sections.auto.label) {
            return validAuto();
        } else if (section.label === sections.teleop.label) {
            return validTele();
        } else if (section.label === sections.endGame.label) {
            return validEndGame();
        } else if (section.label === sections.closing.label) {
            return validClosing();
        } else {
            return true;
        }
    }

    function getQRValue() {
        let map = {
            null: 'n',
            true: 't',
            false: 'f',
            'No Attempt': 'na',
            Success: 'sc',
            Fail: 'fl',
            Complete: 'cp',
            'Follow Up': 'fu',
            'No Show': 'ns',
            Missing: 'ms' //Dont think this is ever needed
        };
        // I listed all the fields just as insurance that everything will always be in this order
        let data = [
            eventKeyParam,
            matchNumberParam,
            stationParam,
            parseInt(teamNumberParam),
            user.displayName,
            standFormData.startingPosition === null ? 'n' : standFormData.startingPosition,
            standFormData.preloadedPiece === null ? 'n' : map[standFormData.preloadedPiece === 'Note'],
            map[standFormData.leftStart],
            standFormData.autoTimeline.length === 0
                ? 'n'
                : standFormData.autoTimeline
                      .map((element) => [element.piece, element.scored ? gamePieceFields[element.scored].short : 'n'])
                      .flat()
                      .join('#'),
            standFormData.teleopGP.intakeSource,
            standFormData.teleopGP.intakeGround,
            standFormData.teleopGP.ampScore,
            standFormData.teleopGP.speakerScore,
            standFormData.teleopGP.ampMiss,
            standFormData.teleopGP.speakerMiss,
            standFormData.teleopGP.ferry,
            standFormData.teleopGP.trap,
            map[standFormData.wasDefended],
            standFormData.defenseRating,
            standFormData.defenseAllocation,
            map[standFormData.climb.attempt],
            standFormData.climb.location === null ? 'n' : standFormData.climb.location.charAt(0).toLowerCase(),
            standFormData.climb.harmony === null ? 'n' : standFormData.climb.harmony,
            map[standFormData.climb.park],
            map[standFormData.lostCommunication],
            map[standFormData.robotBroke],
            map[standFormData.yellowCard],
            map[standFormData.redCard],
            standFormData.standStatus === matchFormStatus.noShow
                ? 'n'
                : standFormData.standComment.trim() === ''
                ? 'n'
                : standFormData.standComment.trim(),
            map[standFormData.standStatus || matchFormStatus.complete],
            isFollowOrNoShow()
                ? standFormData.standStatusComment.trim() === ''
                    ? 'n'
                    : standFormData.standStatusComment.trim()
                : 'n',
            standFormData.history.auto.data.length === 0
                ? 'n'
                : standFormData.history.auto.data
                      .map((element) => (isNaN(element) ? gamePieceFields[element].short : element))
                      .join('#'),
            standFormData.history.auto.position,
            standFormData.history.teleop.data.length === 0
                ? 'n'
                : standFormData.history.teleop.data
                      .map((element) => (isNaN(element) ? gamePieceFields[element].short : element))
                      .join('#'),
            standFormData.history.teleop.position,
            standFormData.history.endGame.data.length === 0
                ? 'n'
                : standFormData.history.endGame.data
                      .map((element) => (isNaN(element) ? gamePieceFields[element].short : element))
                      .join('#'),
            standFormData.history.endGame.position
        ].join('$');

        return '#stand$' + data + '$' + checksum(data);
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
            if (!validClosing()) {
                toastText.push('Closing');
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
            onOpen();
            return;
        }
        setSubmitting(true);
        fetch(`/${matchNumberParam.startsWith('pm') ? 'practiceForm' : 'matchForm'}/postStandForm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...standFormData,
                eventKey: eventKeyParam,
                matchNumber: matchNumberParam,
                station: stationParam,
                teamNumber: parseInt(teamNumberParam),
                standComment:
                    standFormData.standStatus === matchFormStatus.noShow ? '' : standFormData.standComment.trim(),
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
                            navigate(`/team/${teamNumberParam}/${teamPageTabs.forms}`);
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
        switch (activeSection.label) {
            case sections.preAuto.label:
                return (
                    <Box>
                        <Text
                            fontSize={'xl'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            marginBottom={'5px'}
                            color={
                                submitAttempted && !isFollowOrNoShow() && !validateSection(activeSection)
                                    ? 'red'
                                    : 'default'
                            }
                        >
                            {activeSection.label}
                        </Text>
                        <Center
                            margin={'0 auto'}
                            width={`${imageDimensions.preAuto.width * imageDimensionRatios.preAuto.width}px`}
                            height={`${imageDimensions.preAuto.height * imageDimensionRatios.preAuto.height}px`}
                            position={'relative'}
                            style={{ transform: `rotate(${fieldRotation}deg)` }}
                        >
                            <Spinner position={'absolute'} visibility={!imageLoaded ? 'visible' : 'hidden'} />
                            <img
                                src={stationParam.charAt(0) === 'r' ? PreAutoRedField : PreAutoBlueField}
                                alt={'Field Map'}
                                style={{
                                    visibility: imageLoaded ? 'visible' : 'hidden',
                                    maxHeight: `${heightDimensions.max - activeSection.spaceUsed}px`
                                }}
                                onLoad={() => setImageLoaded(true)}
                            />
                            {startingPositions.map((position, index) => (
                                <Button
                                    key={position[2]}
                                    position={'absolute'}
                                    visibility={imageLoaded ? 'visible' : 'hidden'}
                                    left={`${getPoint(position[0]) * imageDimensionRatios.preAuto.width}px`}
                                    top={`${position[1] * imageDimensionRatios.preAuto.height}px`}
                                    width={`${65 * imageDimensionRatios.preAuto.width}px`}
                                    height={`${65 * imageDimensionRatios.preAuto.height}px`}
                                    style={{ transform: `rotate(${360 - fieldRotation}deg)`, transition: 'none' }}
                                    onClick={() => setStandFormData({ ...standFormData, startingPosition: index + 1 })}
                                    colorScheme={standFormData.startingPosition === index + 1 ? 'blue' : 'gray'}
                                    outline={
                                        standFormData.startingPosition === null &&
                                        submitAttempted &&
                                        !isFollowOrNoShow()
                                            ? '2px solid red'
                                            : 'none'
                                    }
                                >
                                    {index + 1}
                                </Button>
                            ))}
                        </Center>
                        <Flex flexDir={'column'} rowGap={'15px'} marginTop={'15px'}>
                            <Button
                                margin={'0 auto'}
                                width={'75%'}
                                onClick={() => {
                                    let nextStatus =
                                        standFormData.standStatus === matchFormStatus.noShow
                                            ? null
                                            : matchFormStatus.noShow;
                                    setStandFormData({ ...standFormData, standStatus: nextStatus });
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
                                    {preloadedPieces.map((piece) => (
                                        <Button
                                            key={piece.id}
                                            onClick={() => {
                                                if (piece.label === 'Note' && standFormData.preloadedPiece !== 'Note') {
                                                    setStandFormData({
                                                        ...standFormData,
                                                        preloadedPiece: piece.label,
                                                        autoTimeline: [
                                                            { piece: '0', scored: null },
                                                            ...standFormData.autoTimeline
                                                        ]
                                                    });
                                                } else if (
                                                    piece.label === 'None' &&
                                                    standFormData.preloadedPiece === 'Note'
                                                ) {
                                                    let newData =
                                                        standFormManagers.auto.removePreloadedEntry(standFormData);
                                                    setStandFormData({
                                                        ...newData,
                                                        preloadedPiece: piece.label,
                                                        autoTimeline: newData.autoTimeline.slice(1)
                                                    });
                                                } else {
                                                    setStandFormData({ ...standFormData, preloadedPiece: piece.label });
                                                }
                                            }}
                                            colorScheme={standFormData.preloadedPiece === piece.label ? 'blue' : 'gray'}
                                            outline={
                                                standFormData.preloadedPiece === null &&
                                                submitAttempted &&
                                                !isFollowOrNoShow()
                                                    ? '2px solid red'
                                                    : 'none'
                                            }
                                        >
                                            {piece.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                        </Flex>
                        <HStack
                            marginTop={`${
                                15 +
                                heightDimensions.max -
                                imageDimensions.preAuto.height * imageDimensionRatios.preAuto.height -
                                activeSection.spaceUsed
                            }px`}
                            marginBottom={'30px'}
                            gap={'15px'}
                        >
                            <Button
                                flex={2 / 3}
                                leftIcon={<AiOutlineRotateRight />}
                                onClick={() => setFieldRotation((fieldRotation + 90) % 360)}
                                variant={'outline'}
                                colorScheme={'black'}
                            >
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
                            <Button
                                flex={2 / 3}
                                rightIcon={<IoChevronForward />}
                                onClick={() => setActiveSection(sections.auto)}
                                variant={'outline'}
                                colorScheme={'black'}
                            >
                                Auto
                            </Button>
                        </HStack>
                    </Box>
                );
            case sections.auto.label:
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
                                {standFormManagers.auto.getPosition() === -1
                                    ? 'Undo'
                                    : `Undo\n${standFormManagers.auto.getUndoNote()}`}
                            </Button>
                            <Button
                                colorScheme={'gray'}
                                onClick={() => {
                                    standFormManagers.auto.redo(standFormData);
                                }}
                                isDisabled={
                                    standFormManagers.auto.getPosition() ===
                                    standFormManagers.auto.getHistoryLength() - 1
                                }
                                width={'100%'}
                                whiteSpace={'pre-line'}
                            >
                                {standFormManagers.auto.getPosition() === standFormManagers.auto.getHistoryLength() - 1
                                    ? 'Redo'
                                    : `Redo\n${standFormManagers.auto.getRedoNote()}`}
                            </Button>
                        </HStack>
                        <Text
                            fontSize={'xl'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            margin={'5px 0'}
                            color={
                                submitAttempted && !isFollowOrNoShow() && !validateSection(activeSection)
                                    ? 'red'
                                    : 'default'
                            }
                        >
                            {activeSection.label}:{' '}
                            {standFormData.autoTimeline.length === 0 ||
                            (standFormData.autoTimeline.slice(-1)[0].scored !== null &&
                                (standFormData.autoTimeline[0].piece !== '0' ||
                                    standFormData.autoTimeline[0].scored !== null))
                                ? 'Intake'
                                : 'Scoring'}
                            {standFormData.autoTimeline.length > 0 &&
                            standFormData.autoTimeline[0].piece === '0' &&
                            standFormData.autoTimeline[0].scored === null
                                ? ' (Preloaded)'
                                : ''}
                        </Text>
                        {standFormData.autoTimeline.length === 0 ||
                        (standFormData.autoTimeline.slice(-1)[0].scored !== null &&
                            (standFormData.autoTimeline[0].piece !== '0' ||
                                standFormData.autoTimeline[0].scored !== null)) ? (
                            <Center
                                margin={'0 auto'}
                                width={`${imageDimensions.auto.width * imageDimensionRatios.auto.width}px`}
                                height={`${heightDimensions.availableScoringSpace}px`}
                                position={'relative'}
                                style={{ transform: `rotate(${fieldRotation}deg)` }}
                            >
                                <Spinner position={'absolute'} visibility={!imageLoaded ? 'visible' : 'hidden'} />

                                <img
                                    src={stationParam.charAt(0) === 'r' ? AutoRedField : AutoBlueField}
                                    alt={'Field Map'}
                                    style={{
                                        visibility: imageLoaded ? 'visible' : 'hidden',
                                        maxHeight: `${heightDimensions.availableScoringSpace}px`,
                                        objectFit: 'contain',
                                        margin: '0 auto'
                                    }}
                                    onLoad={() => setImageLoaded(true)}
                                />
                                {standFormData.startingPosition !== null && (
                                    <Flex
                                        position={'absolute'}
                                        visibility={imageLoaded ? 'visible' : 'hidden'}
                                        left={`${
                                            getPoint(autoStartingPositions[standFormData.startingPosition - 1][0]) *
                                            imageDimensionRatios.auto.width
                                        }px`}
                                        top={`${
                                            (heightDimensions.availableScoringSpace -
                                                imageDimensions.auto.height * imageDimensionRatios.auto.height) /
                                                2 +
                                            autoStartingPositions[standFormData.startingPosition - 1][1] *
                                                imageDimensionRatios.auto.height
                                        }px`}
                                        width={`${65 * imageDimensionRatios.auto.width}px`}
                                        height={`${65 * imageDimensionRatios.auto.height}px`}
                                        backgroundColor={'gray.500'}
                                        textColor={'white'}
                                        justifyContent={'center'}
                                        alignItems={'center'}
                                        borderRadius={'5px'}
                                    >
                                        Start
                                    </Flex>
                                )}
                                {notePositions.map((position, index) => (
                                    <Button
                                        key={position[2]}
                                        position={'absolute'}
                                        visibility={imageLoaded ? 'visible' : 'hidden'}
                                        left={`${getPoint(position[0]) * imageDimensionRatios.auto.width}px`}
                                        top={`${
                                            (heightDimensions.availableScoringSpace -
                                                imageDimensions.auto.height * imageDimensionRatios.auto.height) /
                                                2 +
                                            position[1] * imageDimensionRatios.auto.height
                                        }px`}
                                        width={`${65 * imageDimensionRatios.auto.width}px`}
                                        height={`${65 * imageDimensionRatios.auto.height}px`}
                                        style={{ transform: `rotate(${360 - fieldRotation}deg)`, transition: 'none' }}
                                        onClick={() => {
                                            standFormManagers.auto.doCommand(standFormData, (index + 1).toString());
                                        }}
                                        isDisabled={standFormData.autoTimeline.some(
                                            (element) => element.piece === (index + 1).toString()
                                        )}
                                        _disabled={{
                                            backgroundColor: 'purple.600',
                                            textColor: 'white',
                                            _hover: { backgroundColor: 'purple.600' },
                                            cursor: 'default'
                                        }}
                                    >
                                        <Icon as={LuDonut} boxSize={6} color={'orange'} />
                                    </Button>
                                ))}
                            </Center>
                        ) : (
                            <Flex
                                height={`${heightDimensions.availableScoringSpace}px`}
                                flexDir={'column'}
                                margin={'0 auto'}
                                gap={'15px'}
                            >
                                <Flex flex={1 / 2} gap={'15px'}>
                                    <Button
                                        colorScheme={'teal'}
                                        fontSize={'xl'}
                                        fontWeight={'bold'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        onClick={() => {
                                            standFormManagers.auto.doCommand(
                                                standFormData,
                                                gamePieceFields.ampScore.field
                                            );
                                        }}
                                    >
                                        Amp:{' '}
                                        {standFormData.autoTimeline.reduce(
                                            (acc, element) =>
                                                element.scored === gamePieceFields.ampScore.field ? ++acc : acc,
                                            0
                                        )}
                                    </Button>
                                    <Button
                                        colorScheme={'facebook'}
                                        fontSize={'xl'}
                                        fontWeight={'bold'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        onClick={() => {
                                            standFormManagers.auto.doCommand(
                                                standFormData,
                                                gamePieceFields.speakerScore.field
                                            );
                                        }}
                                    >
                                        Speaker:{' '}
                                        {standFormData.autoTimeline.reduce(
                                            (acc, element) =>
                                                element.scored === gamePieceFields.speakerScore.field ? ++acc : acc,
                                            0
                                        )}
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
                                            standFormManagers.auto.doCommand(
                                                standFormData,
                                                gamePieceFields.ampMiss.field
                                            );
                                        }}
                                    >
                                        Amp Miss:{' '}
                                        {standFormData.autoTimeline.reduce(
                                            (acc, element) =>
                                                element.scored === gamePieceFields.ampMiss.field ? ++acc : acc,
                                            0
                                        )}
                                    </Button>
                                    <Button
                                        colorScheme={'purple'}
                                        fontSize={'xl'}
                                        fontWeight={'bold'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        whiteSpace={'normal'}
                                        onClick={() => {
                                            standFormManagers.auto.doCommand(
                                                standFormData,
                                                gamePieceFields.speakerMiss.field
                                            );
                                        }}
                                    >
                                        Speaker Miss:{' '}
                                        {standFormData.autoTimeline.reduce(
                                            (acc, element) =>
                                                element.scored === gamePieceFields.speakerMiss.field ? ++acc : acc,
                                            0
                                        )}
                                    </Button>
                                </Flex>
                                <Button
                                    colorScheme={'yellow'}
                                    fontSize={'xl'}
                                    fontWeight={'bold'}
                                    flex={0.2}
                                    onClick={() => {
                                        standFormManagers.auto.doCommand(
                                            standFormData,
                                            gamePieceFields.intakeMiss.field
                                        );
                                    }}
                                    isDisabled={
                                        standFormData.autoTimeline.length > 0 &&
                                        standFormData.autoTimeline[0].piece === '0' &&
                                        standFormData.autoTimeline[0].scored === null
                                    }
                                >
                                    Intake Miss:{' '}
                                    {standFormData.autoTimeline.reduce(
                                        (acc, element) =>
                                            element.scored === gamePieceFields.intakeMiss.field ? ++acc : acc,
                                        0
                                    )}
                                </Button>
                            </Flex>
                        )}
                        <Flex flexDir={'column'} marginTop={'15px'}>
                            <HStack gap={0}>
                                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} flex={1 / 2}>
                                    Left starting zone:
                                </Text>
                                <HStack flex={1 / 2} justifyContent={'center'} gap={'20px'}>
                                    {leaveAutoOptions.map((option) => (
                                        <Button
                                            key={option.id}
                                            onClick={() =>
                                                setStandFormData({ ...standFormData, leftStart: option.value })
                                            }
                                            colorScheme={standFormData.leftStart === option.value ? 'blue' : 'gray'}
                                            outline={
                                                standFormData.leftStart === null &&
                                                submitAttempted &&
                                                !isFollowOrNoShow()
                                                    ? '2px solid red'
                                                    : 'none'
                                            }
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                        </Flex>
                        <HStack
                            marginTop={`${
                                15 +
                                heightDimensions.max -
                                heightDimensions.availableScoringSpace -
                                activeSection.spaceUsed
                            }px`}
                            marginBottom={'30px'}
                            gap={'15px'}
                        >
                            <Button
                                flex={2 / 3}
                                leftIcon={<IoChevronBack />}
                                onClick={() => setActiveSection(sections.preAuto)}
                                variant={'outline'}
                                colorScheme={'black'}
                            >
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
                            <Button
                                flex={2 / 3}
                                rightIcon={<IoChevronForward />}
                                onClick={() => setActiveSection(sections.teleop)}
                                variant={'outline'}
                                colorScheme={'black'}
                            >
                                Teleop
                            </Button>
                        </HStack>
                    </Box>
                );
            case sections.teleop.label:
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
                                {standFormManagers.teleop.getPosition() === -1
                                    ? 'Undo'
                                    : `Undo\n${standFormManagers.teleop.getUndoNote()}`}
                            </Button>
                            <Button
                                colorScheme={'gray'}
                                onClick={() => {
                                    standFormManagers.teleop.redo(standFormData);
                                }}
                                isDisabled={
                                    standFormManagers.teleop.getPosition() ===
                                    standFormManagers.teleop.getHistoryLength() - 1
                                }
                                width={'100%'}
                                whiteSpace={'pre-line'}
                            >
                                {standFormManagers.teleop.getPosition() ===
                                standFormManagers.teleop.getHistoryLength() - 1
                                    ? 'Redo'
                                    : `Redo\n${standFormManagers.teleop.getRedoNote()}`}
                            </Button>
                        </HStack>
                        <Text
                            fontSize={'xl'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            margin={'5px 0'}
                            color={
                                submitAttempted && !isFollowOrNoShow() && !validateSection(activeSection)
                                    ? 'red'
                                    : 'default'
                            }
                        >
                            {activeSection.label}:{' '}
                            {[
                                standFormData.teleopGP.intakeSource,
                                standFormData.teleopGP.intakeGround,
                                standFormData.teleopGP.intakePreloaded
                            ].reduce((partialSum, a) => partialSum + a, 0) ===
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
                        {[
                            standFormData.teleopGP.intakeSource,
                            standFormData.teleopGP.intakeGround,
                            standFormData.teleopGP.intakePreloaded
                        ].reduce((partialSum, a) => partialSum + a, 0) ===
                        [
                            standFormData.teleopGP.ampScore,
                            standFormData.teleopGP.speakerScore,
                            standFormData.teleopGP.ampMiss,
                            standFormData.teleopGP.speakerMiss,
                            standFormData.teleopGP.ferry
                        ].reduce((partialSum, a) => partialSum + a, 0) ? (
                            <Flex
                                height={`${heightDimensions.availableScoringSpace}px`}
                                margin={'0 auto'}
                                flexDir={'column'}
                                gap={'15px'}
                            >
                                <Flex flex={0.8} gap={'15px'}>
                                    <Button
                                        colorScheme={'teal'}
                                        fontSize={'xl'}
                                        fontWeight={'bold'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        onClick={() => {
                                            standFormManagers.teleop.doCommand(
                                                standFormData,
                                                gamePieceFields.intakeSource.field
                                            );
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
                                            standFormManagers.teleop.doCommand(
                                                standFormData,
                                                gamePieceFields.intakeGround.field
                                            );
                                        }}
                                    >
                                        Ground: {standFormData.teleopGP.intakeGround}
                                    </Button>
                                </Flex>
                                <Button
                                    colorScheme={'yellow'}
                                    fontSize={'xl'}
                                    fontWeight={'bold'}
                                    height={'100%'}
                                    flex={0.2}
                                    onClick={() => {
                                        standFormManagers.teleop.doCommand(
                                            standFormData,
                                            gamePieceFields.intakePreloaded.field
                                        );
                                    }}
                                    isDisabled={standFormData.teleopGP.intakePreloaded}
                                >
                                    Preloaded
                                </Button>
                            </Flex>
                        ) : (
                            <Flex
                                height={`${heightDimensions.availableScoringSpace}px`}
                                flexDir={'column'}
                                margin={'0 auto'}
                                gap={'15px'}
                            >
                                <Flex flex={1 / 2} gap={'15px'}>
                                    <Button
                                        colorScheme={'teal'}
                                        fontSize={'xl'}
                                        fontWeight={'bold'}
                                        flex={1 / 2}
                                        height={'100%'}
                                        onClick={() => {
                                            standFormManagers.teleop.doCommand(
                                                standFormData,
                                                gamePieceFields.ampScore.field
                                            );
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
                                            standFormManagers.teleop.doCommand(
                                                standFormData,
                                                gamePieceFields.speakerScore.field
                                            );
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
                                            standFormManagers.teleop.doCommand(
                                                standFormData,
                                                gamePieceFields.ampMiss.field
                                            );
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
                                            standFormManagers.teleop.doCommand(
                                                standFormData,
                                                gamePieceFields.speakerMiss.field
                                            );
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
                                        standFormManagers.teleop.doCommand(standFormData, gamePieceFields.ferry.field);
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
                                        onChange={(value) =>
                                            setStandFormData({ ...standFormData, defenseRating: value })
                                        }
                                        width={'75%'}
                                        focusThumbOnChange={false}
                                    >
                                        {defenseRatings.map((rating) => (
                                            <SliderMark
                                                key={rating.id}
                                                value={rating.value}
                                                marginTop={'5px'}
                                                marginLeft={rating.value ? '-3px' : '-17px'}
                                                fontSize={'sm'}
                                            >
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
                                        onChange={(value) =>
                                            setStandFormData({ ...standFormData, defenseAllocation: value })
                                        }
                                        width={'75%'}
                                        isDisabled={standFormData.defenseRating === 0}
                                    >
                                        {defenseAllocations.map((allocation) => (
                                            <SliderMark
                                                key={allocation.id}
                                                value={allocation.value}
                                                marginTop={'5px'}
                                                marginLeft={'-9px'}
                                                fontSize={'sm'}
                                            >
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
                                            onClick={() =>
                                                setStandFormData({ ...standFormData, wasDefended: option.value })
                                            }
                                            colorScheme={standFormData.wasDefended === option.value ? 'blue' : 'gray'}
                                            outline={
                                                standFormData.wasDefended === null &&
                                                submitAttempted &&
                                                !isFollowOrNoShow()
                                                    ? '2px solid red'
                                                    : 'none'
                                            }
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                        </Flex>
                        <HStack
                            marginTop={`${Math.max(
                                15,
                                15 +
                                    heightDimensions.max -
                                    heightDimensions.availableScoringSpace -
                                    activeSection.spaceUsed
                            )}px`}
                            marginBottom={'30px'}
                            gap={'15px'}
                        >
                            <Button
                                flex={2 / 3}
                                leftIcon={<IoChevronBack />}
                                onClick={() => setActiveSection(sections.auto)}
                                variant={'outline'}
                                colorScheme={'black'}
                            >
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
                            <Button
                                flex={2 / 3}
                                rightIcon={<IoChevronForward />}
                                onClick={() => setActiveSection(sections.endGame)}
                                variant={'outline'}
                                colorScheme={'black'}
                            >
                                End Game
                            </Button>
                        </HStack>
                    </Box>
                );
            case sections.endGame.label:
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
                                {standFormManagers.endGame.getPosition() === -1
                                    ? 'Undo'
                                    : `Undo\n${standFormManagers.endGame.getUndoNote()}`}
                            </Button>
                            <Button
                                colorScheme={'gray'}
                                onClick={() => {
                                    standFormManagers.endGame.redo(standFormData);
                                }}
                                isDisabled={
                                    standFormManagers.endGame.getPosition() ===
                                    standFormManagers.endGame.getHistoryLength() - 1
                                }
                                width={'100%'}
                                whiteSpace={'pre-line'}
                            >
                                {standFormManagers.endGame.getPosition() ===
                                standFormManagers.endGame.getHistoryLength() - 1
                                    ? 'Redo'
                                    : `Redo\n${standFormManagers.endGame.getRedoNote()}`}
                            </Button>
                        </HStack>
                        <Text
                            fontSize={'xl'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            margin={'5px 0'}
                            color={
                                submitAttempted && !isFollowOrNoShow() && !validateSection(activeSection)
                                    ? 'red'
                                    : 'default'
                            }
                        >
                            {activeSection.label}
                        </Text>
                        <Flex flexDir={'column'} rowGap={'15px'}>
                            <VStack gap={'5px'}>
                                <Text fontSize={'lg'} fontWeight={'semibold'}>
                                    Climb
                                </Text>
                                <Flex columnGap={'10px'} width={'100%'} justifyContent={'center'}>
                                    {climbTypes.map((type) => (
                                        <Button
                                            flex={1 / 3}
                                            key={type.id}
                                            onClick={() => {
                                                let location = standFormData.climb.location;
                                                let harmony = standFormData.climb.harmony;
                                                let park = standFormData.climb.park;
                                                if (type.label !== 'Success') {
                                                    location = null;
                                                    harmony = null;
                                                } else {
                                                    park = null;
                                                }
                                                setStandFormData({
                                                    ...standFormData,
                                                    climb: {
                                                        attempt: type.label,
                                                        location: location,
                                                        harmony: harmony,
                                                        park: park
                                                    }
                                                });
                                            }}
                                            colorScheme={
                                                standFormData.climb.attempt === type.label ? type.color : 'gray'
                                            }
                                            whiteSpace={'normal'}
                                            outline={
                                                standFormData.climb.attempt === null &&
                                                submitAttempted &&
                                                !isFollowOrNoShow()
                                                    ? '2px solid red'
                                                    : 'none'
                                            }
                                        >
                                            {type.label}
                                        </Button>
                                    ))}
                                </Flex>
                            </VStack>
                            {standFormData.climb.attempt === 'Success' && (
                                <VStack gap={'5px'}>
                                    <Text fontSize={'lg'} fontWeight={'semibold'}>
                                        Location
                                    </Text>
                                    <Flex columnGap={'10px'} width={'100%'} justifyContent={'center'}>
                                        {climbLocations.map((location) => (
                                            <Button
                                                flex={1 / 3}
                                                key={location.id}
                                                onClick={() =>
                                                    setStandFormData({
                                                        ...standFormData,
                                                        climb: { ...standFormData.climb, location: location.label }
                                                    })
                                                }
                                                colorScheme={
                                                    standFormData.climb.location === location.label
                                                        ? location.color
                                                        : 'gray'
                                                }
                                                whiteSpace={'normal'}
                                                outline={
                                                    standFormData.climb.attempt === 'Success' &&
                                                    standFormData.climb.location === null &&
                                                    submitAttempted &&
                                                    !isFollowOrNoShow()
                                                        ? '2px solid red'
                                                        : 'none'
                                                }
                                            >
                                                {location.label}
                                            </Button>
                                        ))}
                                    </Flex>
                                </VStack>
                            )}
                            {standFormData.climb.attempt === 'Success' && (
                                <VStack gap={'5px'}>
                                    <Text fontSize={'lg'} fontWeight={'semibold'}>
                                        Harmony
                                    </Text>
                                    <Flex columnGap={'10px'} width={'100%'} justifyContent={'center'}>
                                        {[0, 1, 2].map((harmonyNumber) => (
                                            <Button
                                                flex={1 / 3}
                                                key={harmonyNumber}
                                                onClick={() =>
                                                    setStandFormData({
                                                        ...standFormData,
                                                        climb: { ...standFormData.climb, harmony: harmonyNumber }
                                                    })
                                                }
                                                colorScheme={
                                                    standFormData.climb.harmony === harmonyNumber ? 'blue' : 'gray'
                                                }
                                                whiteSpace={'normal'}
                                                outline={
                                                    standFormData.climb.attempt === 'Success' &&
                                                    standFormData.climb.harmony === null &&
                                                    submitAttempted &&
                                                    !isFollowOrNoShow()
                                                        ? '2px solid red'
                                                        : 'none'
                                                }
                                            >
                                                {harmonyNumber === 0 ? 'No Harmony' : `+${harmonyNumber} Harmony`}
                                            </Button>
                                        ))}
                                    </Flex>
                                </VStack>
                            )}
                            {['No Attempt', 'Fail'].includes(standFormData.climb.attempt) && (
                                <VStack gap={'5px'}>
                                    <Text fontSize={'lg'} fontWeight={'semibold'}>
                                        Park
                                    </Text>
                                    <Flex columnGap={'10px'} width={'100%'} justifyContent={'center'}>
                                        {parkOptions.map((park) => (
                                            <Button
                                                flex={1 / 3}
                                                key={park.id}
                                                onClick={() =>
                                                    setStandFormData({
                                                        ...standFormData,
                                                        climb: { ...standFormData.climb, park: park.value }
                                                    })
                                                }
                                                colorScheme={
                                                    standFormData.climb.park === park.value ? park.color : 'gray'
                                                }
                                                whiteSpace={'normal'}
                                                outline={
                                                    ['No Attempt', 'Fail'].includes(standFormData.climb.attempt) &&
                                                    standFormData.climb.park === null &&
                                                    submitAttempted &&
                                                    !isFollowOrNoShow()
                                                        ? '2px solid red'
                                                        : 'none'
                                                }
                                            >
                                                {park.label}
                                            </Button>
                                        ))}
                                    </Flex>
                                </VStack>
                            )}
                            <Button
                                colorScheme={'facebook'}
                                height={'60px'}
                                fontWeight={'bold'}
                                isDisabled={standFormData.teleopGP.trap === 3}
                                key={'Trap'}
                                marginTop={'10px'}
                                onClick={() => {
                                    standFormManagers.endGame.doCommand(standFormData, gamePieceFields.trap.field);
                                }}
                            >
                                Trap: {standFormData.teleopGP.trap}
                                {standFormData.teleopGP.trap === 3 && ' (Max)'}
                            </Button>
                        </Flex>
                        <HStack
                            marginTop={`${Math.max(
                                15,
                                15 +
                                    heightDimensions.max -
                                    activeSection.spaceUsed -
                                    (standFormData.climb.attempt === 'Success' ? 174 : 0) -
                                    (['No Attempt', 'Fail'].includes(standFormData.climb.attempt) ? 87 : 0)
                            )}px`}
                            marginBottom={'30px'}
                            gap={'15px'}
                        >
                            <Button
                                flex={2 / 3}
                                leftIcon={<IoChevronBack />}
                                onClick={() => setActiveSection(sections.teleop)}
                                variant={'outline'}
                                colorScheme={'black'}
                            >
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
                            <Button
                                flex={2 / 3}
                                rightIcon={<IoChevronForward />}
                                onClick={() => setActiveSection(sections.closing)}
                                variant={'outline'}
                                colorScheme={'black'}
                            >
                                Closing
                            </Button>
                        </HStack>
                    </Box>
                );
            case sections.closing.label:
                return (
                    <Box>
                        <Text
                            fontSize={'xl'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            marginBottom={'5px'}
                            color={submitAttempted && !validateSection(activeSection) ? 'red' : 'default'}
                        >
                            {activeSection.label}
                        </Text>
                        <Flex flexDir={'column'} rowGap={'15px'}>
                            <HStack gap={0}>
                                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} flex={1 / 2}>
                                    Lost Comms:
                                </Text>
                                <HStack flex={1 / 2} justifyContent={'center'} gap={'20px'}>
                                    {lostCommOptions.map((option) => (
                                        <Button
                                            key={option.id}
                                            onClick={() =>
                                                setStandFormData({ ...standFormData, lostCommunication: option.value })
                                            }
                                            colorScheme={
                                                standFormData.lostCommunication === option.value ? option.color : 'gray'
                                            }
                                            outline={
                                                standFormData.lostCommunication === null &&
                                                submitAttempted &&
                                                !isFollowOrNoShow()
                                                    ? '2px solid red'
                                                    : 'none'
                                            }
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
                                    {robotBrokeOptions.map((option) => (
                                        <Button
                                            key={option.id}
                                            onClick={() =>
                                                setStandFormData({ ...standFormData, robotBroke: option.value })
                                            }
                                            colorScheme={
                                                standFormData.robotBroke === option.value ? option.color : 'gray'
                                            }
                                            outline={
                                                standFormData.robotBroke === null &&
                                                submitAttempted &&
                                                !isFollowOrNoShow()
                                                    ? '2px solid red'
                                                    : 'none'
                                            }
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
                                            onClick={() =>
                                                setStandFormData({ ...standFormData, yellowCard: option.value })
                                            }
                                            colorScheme={
                                                standFormData.yellowCard === option.value ? option.color : 'gray'
                                            }
                                            outline={
                                                standFormData.yellowCard === null &&
                                                submitAttempted &&
                                                !isFollowOrNoShow()
                                                    ? '2px solid red'
                                                    : 'none'
                                            }
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
                                            onClick={() =>
                                                setStandFormData({ ...standFormData, redCard: option.value })
                                            }
                                            colorScheme={standFormData.redCard === option.value ? option.color : 'gray'}
                                            outline={
                                                standFormData.redCard === null && submitAttempted && !isFollowOrNoShow()
                                                    ? '2px solid red'
                                                    : 'none'
                                            }
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                            {standFormData.standStatus !== matchFormStatus.noShow && (
                                <Center>
                                    <Textarea
                                        onChange={(event) =>
                                            setStandFormData({ ...standFormData, standComment: event.target.value })
                                        }
                                        value={standFormData.standComment}
                                        placeholder='Only write comments you think are VITAL!'
                                    />
                                </Center>
                            )}
                            {standFormData.standStatus !== matchFormStatus.noShow && (
                                <Center>
                                    <Checkbox
                                        colorScheme={'yellow'}
                                        isChecked={standFormData.standStatus === matchFormStatus.followUp}
                                        onChange={() =>
                                            setStandFormData({
                                                ...standFormData,
                                                standStatus:
                                                    standFormData.standStatus === matchFormStatus.followUp
                                                        ? null
                                                        : matchFormStatus.followUp
                                            })
                                        }
                                    >
                                        Mark For Follow Up
                                    </Checkbox>
                                </Center>
                            )}
                            {isFollowOrNoShow() ? (
                                <Center>
                                    <Textarea
                                        isInvalid={submitAttempted && standFormData.standStatusComment.trim() === ''}
                                        onChange={(event) =>
                                            setStandFormData({
                                                ...standFormData,
                                                standStatusComment: event.target.value
                                            })
                                        }
                                        value={standFormData.standStatusComment}
                                        placeholder={`What is the reason for the ${standFormData.standStatus.toLowerCase()}?`}
                                        outline={
                                            standFormData.standStatusComment.trim() === '' &&
                                            submitAttempted &&
                                            isFollowOrNoShow()
                                                ? '2px solid red'
                                                : 'none'
                                        }
                                    />
                                </Center>
                            ) : null}
                            <Modal isOpen={isOpen} onClose={onClose} isCentered={true}>
                                <ModalOverlay />
                                <ModalContent width={{ base: '90%', lg: '50%' }} height={'75dvh'}>
                                    <ModalHeader />
                                    <ModalCloseButton />
                                    <ModalBody margin={'0 auto'} height={'75dvh'}>
                                        <QRCode
                                            value={getQRValue()}
                                            style={{
                                                height: 'calc(75dvh)',
                                                width: '90%',
                                                position: 'absolute',
                                                top: '-20px',
                                                left: '50%',
                                                transform: 'translate(-50%, 0%)'
                                            }}
                                        />
                                        <Button
                                            position={'absolute'}
                                            bottom={'10px'}
                                            left={'50%'}
                                            transform={'translate(-50%, 0%)'}
                                            colorScheme='blue'
                                            as={Link}
                                            to={'/'}
                                        >
                                            Go Home
                                        </Button>
                                    </ModalBody>
                                </ModalContent>
                            </Modal>
                        </Flex>
                        <HStack
                            marginTop={`${Math.max(
                                15,
                                15 +
                                    heightDimensions.max -
                                    activeSection.spaceUsed -
                                    (standFormData.standStatus === matchFormStatus.followUp
                                        ? 95
                                        : standFormData.standStatus === matchFormStatus.noShow
                                        ? -39
                                        : 0)
                            )}px`}
                            marginBottom={'30px'}
                            gap={'15px'}
                        >
                            <Button
                                flex={2 / 3}
                                leftIcon={<IoChevronBack />}
                                onClick={() => setActiveSection(sections.endGame)}
                                variant={'outline'}
                                colorScheme={'black'}
                            >
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
                            <Button flex={2 / 3} isLoading={submitting} onClick={() => submit()} colorScheme={'green'}>
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
                isOpen={standFormDialog}
                leastDestructiveRef={cancelRef}
                onClose={() => {
                    setStandFormDialog(false);
                }}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent width={{ base: '75%', md: '40%', lg: '30%' }} marginTop={'25dvh'}>
                        <AlertDialogHeader fontSize={'lg'} fontWeight={'semibold'}>
                            Unsaved Data
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            You have unsaved data for this stand form. Would you like to load it, delete it, or pull
                            data from the cloud?
                        </AlertDialogBody>
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
                                ref={cancelRef}
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

    if (
        standFormData.loading ||
        imageDimensionRatios === null ||
        heightDimensions.max === null ||
        standFormManagers === null ||
        futureAlly === null
    ) {
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

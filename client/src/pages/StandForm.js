import React, { useCallback, useEffect, useRef, useState } from 'react';
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
    IconButton,
    Spinner,
    Text,
    Textarea,
    VStack,
    useDisclosure,
    useToast
} from '@chakra-ui/react';
import { AiOutlineRotateRight } from 'react-icons/ai';
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from '@chakra-ui/icons';
import { MdOutlineDoNotDisturbAlt } from 'react-icons/md';
import { deepEqual, getValueByRange } from '../util/helperFunctions';
import { AUTO_PIECE, createCommandManager } from '../util/commandManager';
import '../stylesheets/standformstyle.css';
import { matchFormStatus } from '../util/helperConstants';
import PreAutoRedField from '../images/PreAutoRedField.png';
import PreAutoBlueField from '../images/PreAutoBlueField.png';
import AutoRedField from '../images/AutoRedField.png';
import AutoBlueField from '../images/AutoBlueField.png';

let sections = {
    preAuto: 'Pre-Auto',
    auto: 'Auto',
    teleop: 'Teleop',
    endGame: 'End Game',
    closing: 'Closing'
};
let startingPositions = [
    [28, 35],
    [60, 118],
    [28, 200],
    [28, 300]
];
let notePositions = [
    [31, 21],
    [31, 103],
    [31, 185],
    [336, 0],
    [336, 90],
    [336, 185],
    [336, 280],
    [336, 370]
];
let preLoadedPieces = [
    { label: 'None', id: uuidv4() },
    { label: 'Note', id: uuidv4() }
];
let chargeTypesTele = [
    { label: 'No Attempt', id: uuidv4() },
    { label: 'Dock', id: uuidv4() },
    { label: 'Engage', id: uuidv4() },
    { label: 'Fail', id: uuidv4() }
];
let doResize;
let imageWidth = 435;
let imageHeight = 435;

function StandForm() {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    const { eventKey: eventKeyParam, matchNumber: matchNumberParam, station: stationParam, teamNumber: teamNumberParam } = useParams();

    const cancelRef = useRef(null);
    const prevWidth = useRef(window.innerWidth);

    const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
    const cancelAlertRef = useRef();

    const [activeSection, setActiveSection] = useState(sections.preAuto);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [standFormDialog, setStandFormDialog] = useState(false);
    const [fieldRotation, setFieldRotation] = useState(0);
    const [loadResponse, setLoadResponse] = useState(null);
    const prevStandFormData = useRef(null);
    const [standFormData, setStandFormData] = useState({
        startingPosition: null,
        preLoadedPiece: null,
        leaveStart: null,
        ampAuto: 0,
        speakerAuto: 0,
        autoTimeline: [],
        ampTele: 0,
        speakerTele: 0,
        trap: 0,
        stage: null,
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
    const [dimensionRatios, setDimensionRatios] = useState(null);
    const [whitespace, setWhitespace] = useState(null);
    const [preAutoImageSrc, setPreAutoImageSrc] = useState(null);
    const [autoImageSrc, setAutoImageSrc] = useState(null);

    useEffect(() => {
        if (stationParam.length !== 2 || !/[rb][123]/.test(stationParam)) {
            setError('Invalid station in the url');
            return;
        }
        if (!/[0-9]+$/.test(teamNumberParam)) {
            setError('Invalid team number in the url');
            return;
        }
        fetch(`/blueAlliance/isFutureAlly/${eventKeyParam}/${teamNumberParam}/${matchNumberParam}/${false}`)
            .then((response) => response.json())
            .then((data) => {
                setFutureAlly(data);
            })
            .catch((error) => {
                setFutureAlly(false);
            });
    }, [eventKeyParam, matchNumberParam, stationParam, teamNumberParam]);

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
        // Only fetch stand form data if load response was false
        if (loadResponse === false && standFormData.loading) {
            const headers = {
                filters: JSON.stringify({
                    eventKey: eventKeyParam,
                    matchNumber: matchNumberParam,
                    station: stationParam,
                    standStatus: [matchFormStatus.complete, matchFormStatus.noShow, matchFormStatus.followUp]
                })
            };

            fetch(`/matchForm/getStandForm`, {
                headers: headers
            })
                .then((response) => response.json())
                .then((data) => {
                    if (!data) {
                        let modified = JSON.parse(JSON.stringify(standFormData));
                        modified.loading = false;
                        prevStandFormData.current = modified;
                        setStandFormData(modified);
                    } else {
                        data.loading = false;
                        prevStandFormData.current = JSON.parse(JSON.stringify(data));
                        setStandFormData(data);
                    }
                })
                .catch((error) => setError(error.message));
        }
    }, [loadResponse, eventKeyParam, matchNumberParam, stationParam, standFormData]);

    // function calculateImageScale(imageSize) {
    //     let scale;
    //     let screenWidth = window.innerWidth;
    //     if (screenWidth < 768) {
    //         scale = 0.7;
    //     } else if (screenWidth < 992) {
    //         scale = 0.5;
    //     } else {
    //         scale = 0.2;
    //     }
    //     return (screenWidth / imageSize) * scale;
    // }

    // function calculateCircleRadius() {
    //     let scale;
    //     let screenWidth = window.innerWidth;
    //     if (screenWidth < 768) {
    //         scale = 0.8;
    //     } else if (screenWidth < 992) {
    //         scale = 0.5;
    //     } else {
    //         scale = 0.2;
    //     }
    //     return (screenWidth / 10) * scale;
    // }

    // function getCanvasDimensions(rotation) {
    //     if (rotation === 0 || rotation === Math.PI) {
    //         return { width: imageWidth, height: imageHeight };
    //     } else {
    //         return { width: imageHeight, height: imageWidth };
    //     }
    // }

    // const drawImage = useCallback(
    //     (point, rotation) => {
    //         const mainCanvasElement = mainCanvas.current;
    //         const secondCanvasElement = secondCanvas.current;
    //         if (mainCanvasElement !== null && secondCanvasElement !== null) {
    //             const mainCtx = mainCanvasElement.getContext('2d');
    //             const secondCtx = secondCanvasElement.getContext('2d');
    //             let scale = calculateImageScale(imageWidth);
    //             let dimensions = getCanvasDimensions(rotation);
    //             let width = dimensions.width;
    //             let height = dimensions.height;
    //             mainCanvasElement.width = width * scale;
    //             mainCanvasElement.height = height * scale;
    //             secondCanvasElement.width = width * scale;
    //             secondCanvasElement.height = height * scale;
    //             mainCtx.filter = 'brightness(0.65)';
    //             mainCtx.translate((width / 2) * scale, (height / 2) * scale);
    //             secondCtx.translate((width / 2) * scale, (height / 2) * scale);
    //             // mainCtx.setTransform(scale, 0, 0, scale, 207 * scale, 207 * scale); // sets scale and origin
    //             mainCtx.rotate(rotation);
    //             secondCtx.rotate(rotation);
    //             mainCtx.translate((-imageWidth / 2) * scale, (-imageHeight / 2) * scale);
    //             secondCtx.translate((-imageWidth / 2) * scale, (-imageHeight / 2) * scale);
    //             // mainCtx.drawImage(img, -207, -207);
    //             mainCtx.drawImage(allowableImage.current, 0, 0, imageWidth * scale, imageHeight * scale);
    //             secondCtx.drawImage(image.current, 0, 0, imageWidth * scale, imageHeight * scale);
    //             if (point.x && point.y) {
    //                 mainCtx.filter = 'brightness(1.00)';
    //                 mainCtx.lineWidth = '4';
    //                 mainCtx.strokeStyle = 'green';
    //                 mainCtx.beginPath();
    //                 // let pointX = (point.x - 207) * Math.cos(rotation) - (point.y - 207) * Math.sin(rotation) + 207;
    //                 // let pointY = (point.x - 207) * Math.sin(rotation) + (point.y - 207) * Math.cos(rotation) + 207;
    //                 mainCtx.arc(point.x * scale, point.y * scale, calculateCircleRadius(), 0, 2 * Math.PI);
    //                 mainCtx.stroke();
    //                 mainCtx.closePath();
    //             }
    //             if (swiper.current) {
    //                 swiper.current.swiper.update();
    //             }
    //             if (!initialDrawn) {
    //                 setInitialDrawn(true);
    //             }
    //         }
    //     },
    //     [initialDrawn]
    // );

    // const resizeCanvas = useCallback(() => {
    //     if (initialDrawn) {
    //         clearTimeout(doResize);
    //         if (window.innerWidth !== prevWidth.current) {
    //             prevWidth.current = window.innerWidth;
    //             doResize = setTimeout(() => drawImage(standFormData.startingPosition, rotations[fieldRotationIndex]), 250);
    //         }
    //     }
    // }, [drawImage, standFormData.startingPosition, fieldRotationIndex, initialDrawn]);

    // useEffect(() => {
    //     window.addEventListener('resize', resizeCanvas);

    //     return () => window.removeEventListener('resize', resizeCanvas);
    // }, [resizeCanvas]);

    useEffect(() => {
        // if (!standFormData.loading && futureAlly !== null && opposingAlliance !== null && imageLoaded && allowableImageLoaded && activeTab === sections.preAuto && eventName && teamName) {
        //     prevWidth.current = window.innerWidth;
        //     drawImage(standFormData.startingPosition, rotations[fieldRotationIndex]);
        // }
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
        prevStandFormData.current = JSON.parse(JSON.stringify(standFormData));
    }, [standFormData, eventKeyParam, matchNumberParam, stationParam]);

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

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Calculate image dimensions based on screen size
        const maxWidth = viewportWidth * getValueByRange(viewportWidth); // Adjust the multiplier as needed
        const maxHeight = (viewportHeight - 100) * 0.7; // Adjust the multiplier as needed
        console.log({ width: maxWidth, height: maxHeight });

        const screenAspectRatio = maxWidth / maxHeight;
        const imageAspectRatio = imageWidth / imageHeight;

        // Calculate the new dimensions to fit the screen while maintaining the aspect ratio
        let scaledWidth, scaledHeight;
        if (imageAspectRatio > screenAspectRatio) {
            // Original image has a wider aspect ratio, so add horizontal whitespace
            scaledWidth = maxWidth;
            scaledHeight = maxWidth / imageAspectRatio;
            const extraHorizontalSpace = maxHeight - scaledHeight;
            const whitespaceTop = extraHorizontalSpace / 2;
            const whitespaceBottom = extraHorizontalSpace / 2;
            setWhitespace({ top: whitespaceTop, bottom: whitespaceBottom, left: 0, right: 0 });
        } else {
            // Original image has a taller aspect ratio, so add vertical whitespace
            scaledHeight = maxHeight;
            scaledWidth = maxHeight * imageAspectRatio;
            const extraVerticalSpace = maxWidth - scaledWidth;
            const whitespaceLeft = extraVerticalSpace / 2;
            const whitespaceRight = extraVerticalSpace / 2;
            setWhitespace({ top: 0, bottom: 0, left: whitespaceLeft, right: whitespaceRight });
        }

        console.log({ newWidth: scaledWidth, newHeight: scaledHeight });
        setDimensionRatios({ width: scaledWidth / imageWidth, height: scaledHeight / imageHeight });
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

    // useEffect(() => {
    //     let img = new Image();
    //     let allowableImg = new Image();
    //     img.src = stationParam.charAt(0) === 'r' ? RedFieldNonAllowable : BlueFieldNonAllowable;
    //     allowableImg.src = stationParam.charAt(0) === 'r' ? RedFieldAllowable : BlueFieldAllowable;
    //     img.onload = () => {
    //         image.current = img;
    //         setImageLoaded(true);
    //     };
    //     allowableImg.onload = () => {
    //         allowableImage.current = allowableImg;
    //         let canvas = document.createElement('canvas');
    //         canvas.width = imageWidth;
    //         canvas.height = imageHeight;
    //         canvas.getContext('2d').drawImage(allowableImg, 0, 0, imageWidth, imageHeight);
    //         offSideCanvas.current = canvas;
    //         setAllowableImageLoaded(true);
    //     };

    //     //Dont know if this is necessary but just in case
    //     return () => {
    //         clearTimeout(doResize);
    //         clearTimeout(zeroScore);
    //         clearTimeout(doShake);
    //         wasHeldDown = false;
    //         touchIsInside = false;
    //     };
    // }, [stationParam]);

    // useEffect(() => {
    //     if (swiper.current) {
    //         if (standFormData.standStatus === matchFormStatus.noShow) {
    //             setActiveTab(tabs.closing);
    //             swiper.current.swiper.slideTo(Object.values(tabs).indexOf(tabs.closing));
    //         }
    //         swiper.current.swiper.update();
    //     }
    // }, [standFormData.standStatus]);

    // useEffect(() => {
    //     if (swiper.current) {
    //         swiper.current.swiper.update();
    //     }
    // }, [standFormData.chargeTele, standFormData.impairedCharge, standFormData.chargeAuto]);

    function isFollowOrNoShow() {
        return [matchFormStatus.followUp, matchFormStatus.noShow].includes(standFormData.standStatus);
    }

    function validPreAuto() {
        return standFormData.startingPosition !== null && standFormData.preLoadedPiece !== null;
    }

    function validAuto() {
        return standFormData.leaveStart !== null;
    }

    function validTele() {
        return true;
    }

    function validEndGame() {
        return standFormData.stage !== null;
    }

    function validClosing() {
        return standFormData.loseCommunication !== null && standFormData.robotBreak !== null && standFormData.yellowCard !== null && standFormData.redCard !== null;
    }

    function validateSections(section) {
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

    // const [updateStandForm] = useMutation(UPDATE_STANDFORM, {
    //     onCompleted() {
    //         toast({
    //             title: 'Match Form Updated',
    //             status: 'success',
    //             duration: 3000,
    //             isClosable: true
    //         });
    //         if (location.state && location.state.previousRoute) {
    //             if (location.state.previousRoute === 'matches') {
    //                 navigate('/matches', { state: { scoutingError: location.state.scoutingError } });
    //             } else if (location.state.previousRoute === 'team') {
    //                 navigate(`/team/${teamNumber}/stand`);
    //             }
    //         } else {
    //             navigate('/');
    //         }
    //         setSubmitting(false);
    //         localStorage.removeItem('StandFormData');
    //     },
    //     onError(err) {
    //         console.log(JSON.stringify(err, null, 2));
    //         toast({
    //             title: 'Apollo Error',
    //             description: 'Match form could not be updated',
    //             status: 'error',
    //             duration: 3000,
    //             isClosable: true
    //         });
    //         setSubmitting(false);
    //     }
    // });

    // function submit() {
    //     setSubmitAttempted(true);
    //     if (!isFollowOrNoShow()) {
    //         let toastText = [];
    //         if (!validPreAuto()) {
    //             toastText.push('Pre-Auto');
    //         }
    //         if (!validAuto()) {
    //             toastText.push('Auto');
    //         }
    //         if (!validTele()) {
    //             toastText.push('Teleop');
    //         }
    //         if (!validEndGame()) {
    //             toastText.push('End Game');
    //         }
    //         if (!validClosing()) {
    //             toastText.push('Closing');
    //         }
    //         if (toastText.length !== 0) {
    //             toast({
    //                 title: 'Missing fields at:',
    //                 description: toastText.join(', '),
    //                 status: 'error',
    //                 duration: 2000,
    //                 isClosable: true
    //             });
    //             return;
    //         }
    //     } else if (standFormData.standStatusComment.trim() === '') {
    //         toast({
    //             title: 'Missing fields',
    //             description: `Leave a ${standFormData.standStatus.toLowerCase()} comment`,
    //             status: 'error',
    //             duration: 3000,
    //             isClosable: true
    //         });
    //         return;
    //     }
    //     setSubmitting(true);
    //     updateStandForm({
    //         variables: {
    //             matchFormInput: {
    //                 eventKey: eventKeyParam,
    //                 eventName: eventName,
    //                 station: stationParam,
    //                 matchNumber: matchNumberParam,
    //                 teamNumber: parseInt(teamNumber),
    //                 teamName: teamName,
    //                 startingPosition: standFormData.startingPosition,
    //                 preLoadedPiece: standFormData.preLoadedPiece,
    //                 bottomAuto: standFormData.bottomAuto,
    //                 middleAuto: standFormData.middleAuto,
    //                 topAuto: standFormData.topAuto,
    //                 crossCommunity: standFormData.crossCommunity,
    //                 chargeAuto: standFormData.chargeAuto,
    //                 autoChargeComment: standFormData.autoChargeComment,
    //                 standAutoComment: standFormData.standAutoComment.trim(),
    //                 bottomTele: standFormData.bottomTele,
    //                 middleTele: standFormData.middleTele,
    //                 topTele: standFormData.topTele,
    //                 chargeTele: standFormData.chargeTele,
    //                 chargeComment: ['Dock', 'Impaired', 'Fail'].includes(standFormData.chargeTele) ? standFormData.chargeComment.trim() : '',
    //                 chargeRobotCount: standFormData.chargeTele === 'Dock' || standFormData.chargeTele === 'Engage' ? standFormData.chargeRobotCount : null,
    //                 impairedCharge: standFormData.impairedCharge,
    //                 impairedComment: standFormData.impairedCharge ? standFormData.impairedComment.trim() : '',
    //                 defendedBy: standFormData.defendedBy,
    //                 loseCommunication: standFormData.loseCommunication,
    //                 robotBreak: standFormData.robotBreak,
    //                 yellowCard: standFormData.yellowCard,
    //                 redCard: standFormData.redCard,
    //                 standEndComment: standFormData.standStatus === matchFormStatus.noShow ? '' : standFormData.standEndComment.trim(),
    //                 standStatus: standFormData.standStatus || matchFormStatus.complete,
    //                 standStatusComment: isFollowOrNoShow() ? standFormData.standStatusComment.trim() : ''
    //             }
    //         }
    //     });
    // }

    console.log(whitespace);

    function renderSection(section) {
        switch (section) {
            case sections.preAuto:
                return (
                    <Flex flex={1} flexDirection={'column'}>
                        <Flex flex={0.7} justifyContent={'center'} alignItems={'center'} position={'relative'} style={{ transform: `rotate(${fieldRotation}deg)` }} backgroundColor={'green'}>
                            {!preAutoImageSrc && (
                                <Center width={`${imageWidth * dimensionRatios.width}px`} height={`${imageHeight * dimensionRatios.height}px`} pos={'relative'} backgroundColor={'white'} zIndex={2}>
                                    <Spinner />
                                </Center>
                            )}
                            {startingPositions.map((position, index) => (
                                <Button
                                    zIndex={1}
                                    key={index}
                                    position={'absolute'}
                                    left={`${whitespace.left + getPoint(position[0]) * dimensionRatios.width}px`}
                                    top={`${whitespace.top + position[1] * dimensionRatios.height}px`}
                                    width={`${65 * dimensionRatios.width}px`}
                                    height={`${65 * dimensionRatios.height}px`}
                                    style={{ transform: `rotate(${360 - fieldRotation}deg)`, transition: 'none' }}
                                    onClick={() => setStandFormData({ ...standFormData, startingPosition: index + 1 })}
                                    colorScheme={standFormData.startingPosition === index + 1 ? 'green' : 'gray'}
                                >
                                    {index + 1}
                                </Button>
                            ))}
                            {preAutoImageSrc && <img src={preAutoImageSrc} style={{ zIndex: 0, objectFit: 'contain', height: 'calc((100vh - 100px) * 0.7)' }} alt={'Field Map'} />}
                        </Flex>
                        <Flex flex={0.3} flexDirection={'column'} rowGap={'15px'}>
                            <Center>
                                <Button
                                    width={'75%'}
                                    onClick={() => setStandFormData({ ...standFormData, standStatus: standFormData.standStatus === matchFormStatus.noShow ? null : matchFormStatus.noShow })}
                                    colorScheme={standFormData.standStatus === matchFormStatus.noShow ? 'red' : 'gray'}
                                >
                                    No Show
                                </Button>
                            </Center>
                            <HStack>
                                <Text fontWeight={'bold'} fontSize={'larger'} textAlign={'center'} flex={1 / 2}>
                                    Preloaded:
                                </Text>
                                <HStack flex={1 / 2} justifyContent={'center'} gap={'20px'}>
                                    {preLoadedPieces.map((piece) => (
                                        <Button
                                            key={piece.id}
                                            onClick={() => setStandFormData({ ...standFormData, preLoadedPiece: piece.label })}
                                            colorScheme={standFormData.preLoadedPiece === piece.label ? 'green' : 'gray'}
                                        >
                                            {piece.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                            <HStack>
                                <Button flex={2 / 3} wordBreak={'break-word'} whiteSpace={'none'} onClick={() => setFieldRotation((fieldRotation + 90) % 360)}>
                                    Switch Orientation
                                </Button>
                                <Text fontWeight={'bold'} fontSize={'larger'} textAlign={'center'} flex={1 / 3}>
                                    {teamNumberParam}
                                </Text>
                                <Button flex={2 / 3} onClick={() => setActiveSection(sections.auto)}>
                                    Proceed
                                </Button>
                            </HStack>
                        </Flex>
                    </Flex>
                );
            case sections.auto:
                return (
                    <Flex flex={1} flexDirection={'column'}>
                        <Flex flex={0.1} flexDir={'column'} position={'relative'} backgroundColor={'red'} justifyContent={'center'}>
                            <HStack justifyContent={'center'} gap={'30px'} width={'100%'}>
                                <Button
                                    outline={'none'}
                                    _focus={{ outline: 'none' }}
                                    colorScheme={'gray'}
                                    onClick={() => standFormAutoManager.undo(standFormData)}
                                    isDisabled={standFormAutoManager.getPosition() === 0}
                                    width={'40%'}
                                    whiteSpace={'pre-line'}
                                >
                                    {standFormAutoManager.getPosition() === 0 ? 'Undo' : `Undo\n${standFormAutoManager.getUndoNode()}`}
                                </Button>
                                <Button
                                    outline={'none'}
                                    _focus={{ outline: 'none' }}
                                    colorScheme={'gray'}
                                    onClick={() => standFormAutoManager.redo(standFormData)}
                                    isDisabled={standFormAutoManager.getPosition() === standFormAutoManager.getHistoryLength() - 1}
                                    width={'40%'}
                                    whiteSpace={'pre-line'}
                                >
                                    {standFormAutoManager.getPosition() === standFormAutoManager.getHistoryLength() - 1 ? 'Redo' : `Redo\n${standFormAutoManager.getRedoNote()}`}
                                </Button>
                            </HStack>
                            <Text
                                fontWeight={'bold'}
                                fontSize={'larger'}
                                position={whitespace?.top > 0 ? 'absolute' : 'relative'}
                                bottom={whitespace?.top > 0 ? 28.8 * -0.5 + whitespace.top * -0.5 : `-${(85.3 * 0.5 - 28.8) * 0.5}px`}
                                backgroundColor={'green'}
                                zIndex={2}
                                width={'100%'}
                                textAlign={'center'}
                            >
                                Intake
                            </Text>
                        </Flex>
                        <Flex backgroundColor={'yellow'} flex={0.7} justifyContent={'center'} alignItems={'center'} position={'relative'} style={{ transform: `rotate(${fieldRotation}deg)` }}>
                            {!autoImageSrc && (
                                <Center width={`${imageWidth * dimensionRatios.width}px`} height={`${imageHeight * dimensionRatios.height}px`} pos={'relative'} backgroundColor={'white'} zIndex={2}>
                                    <Spinner />
                                </Center>
                            )}
                            {notePositions.map((position, index) => (
                                <Button
                                    zIndex={1}
                                    key={index}
                                    position={'absolute'}
                                    left={`${whitespace.left + getPoint(position[0]) * dimensionRatios.width}px`}
                                    top={`${whitespace.top + position[1] * dimensionRatios.height}px`}
                                    width={`${65 * dimensionRatios.width}px`}
                                    height={`${65 * dimensionRatios.height}px`}
                                    style={{ transform: `rotate(${360 - fieldRotation}deg)`, transition: 'none' }}
                                    onClick={() => standFormAutoManager.doCommand(AUTO_PIECE, standFormData, setStandFormData, index + 1)}
                                    isDisabled={standFormData.autoTimeline.some((element) => element.piece === index + 1)}
                                    _disabled={{ backgroundColor: '#FAF089', _hover: { backgroundColor: '#FAF089' }, cursor: 'default' }}
                                >
                                    {index + 1}
                                </Button>
                            ))}
                            {autoImageSrc && <img src={autoImageSrc} style={{ zIndex: 0, objectFit: 'contain', height: 'calc((100vh - 100px) * 0.7)' }} alt={'Field Map'} />}
                        </Flex>
                        <Flex flex={0.2} flexDirection={'column'} rowGap={'15px'}>
                            <HStack>
                                <Text fontWeight={'bold'} textAlign={'center'} flex={1 / 2}>
                                    Left starting zone:
                                </Text>
                                <HStack flex={1 / 2} justifyContent={'center'} gap={'20px'}>
                                    {[
                                        { label: 'Yes', value: true },
                                        { label: 'No', value: false }
                                    ].map((element) => (
                                        <Button
                                            key={element.label}
                                            onClick={() => setStandFormData({ ...standFormData, leaveStart: element.value })}
                                            colorScheme={standFormData.leaveStart === element.value ? 'green' : 'gray'}
                                        >
                                            {element.label}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                            <HStack>
                                <Button flex={2 / 3} onClick={() => setActiveSection(sections.preAuto)}>
                                    Go back
                                </Button>
                                <Text fontWeight={'bold'} fontSize={'large'} textAlign={'center'} flex={1 / 3}>
                                    {teamNumberParam}
                                </Text>
                                <Button flex={2 / 3} onClick={() => setActiveSection(sections.teleop)}>
                                    Proceed
                                </Button>
                            </HStack>
                        </Flex>
                    </Flex>
                );
            case sections.teleop:
                return (
                    <Box minH={'calc(100vh - 200px)'}>
                        <Box boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'} borderRadius={'10px'} padding={'10px'} margin={'10px 10px 30px 10px'}>
                            <Center marginTop={'10px'} marginBottom={'10px'}>
                                <HStack spacing={'50px'}>
                                    <Button
                                        outline={'none'}
                                        _focus={{ outline: 'none' }}
                                        colorScheme={'gray'}
                                        onClick={() => standFormTeleManager.undo(standFormData)}
                                        isDisabled={standFormTeleManager.getPosition() === 0}
                                    >
                                        Undo
                                    </Button>
                                    <Button
                                        outline={'none'}
                                        _focus={{ outline: 'none' }}
                                        colorScheme={'gray'}
                                        onClick={() => standFormTeleManager.redo(standFormData)}
                                        isDisabled={standFormTeleManager.getPosition() === standFormTeleManager.getHistoryLength() - 1}
                                    >
                                        Redo
                                    </Button>
                                </HStack>
                            </Center>

                            {/* {['top', 'middle', 'bottom'].map((row) => (
                                <React.Fragment key={'tele' + row}>
                                    <Text marginBottom={'10px'} fontWeight={'bold'} fontSize={'110%'}>
                                        {row.charAt(0).toUpperCase() + row.slice(1)} Row:
                                    </Text>
                                    <Center marginBottom={row === 'bottom' ? '8px' : '20px'}>
                                        <HStack spacing={'0px'} columnGap={'20px'} position={'relative'}>
                                            <Box position={'absolute'} left={'-33%'} top={0}>
                                                <MissedButton
                                                    standFormData={standFormData}
                                                    setStandFormData={setStandFormData}
                                                    dataField={{ row: row, phase: 'Tele', field: 'coneMissed' }}
                                                    manager={standFormTeleManager}
                                                    max={Infinity}
                                                    shakeElement={shakeElement}
                                                    setShakeElement={setShakeElement}
                                                    mobileFlag={mobileFlag}
                                                    toast={toast}
                                                />
                                            </Box>
                                            <ScoringButton
                                                type={'Cone'}
                                                standFormData={standFormData}
                                                setStandFormData={setStandFormData}
                                                dataField={{ row: row, phase: 'Tele', field: 'coneScored' }}
                                                manager={standFormTeleManager}
                                                max={row === 'bottom' ? 9 : 6}
                                                shakeElement={shakeElement}
                                                setShakeElement={setShakeElement}
                                                mobileFlag={mobileFlag}
                                                toast={toast}
                                            />
                                            <ScoringButton
                                                type={'Cube'}
                                                standFormData={standFormData}
                                                setStandFormData={setStandFormData}
                                                dataField={{ row: row, phase: 'Tele', field: 'cubeScored' }}
                                                manager={standFormTeleManager}
                                                max={row === 'bottom' ? 9 : 3}
                                                shakeElement={shakeElement}
                                                setShakeElement={setShakeElement}
                                                mobileFlag={mobileFlag}
                                                toast={toast}
                                            />
                                            <Box position={'absolute'} right={'-33%'} top={0}>
                                                <MissedButton
                                                    standFormData={standFormData}
                                                    setStandFormData={setStandFormData}
                                                    dataField={{ row: row, phase: 'Tele', field: 'cubeMissed' }}
                                                    manager={standFormTeleManager}
                                                    max={Infinity}
                                                    shakeElement={shakeElement}
                                                    setShakeElement={setShakeElement}
                                                    mobileFlag={mobileFlag}
                                                    toast={toast}
                                                />
                                            </Box>
                                        </HStack>
                                    </Center>
                                </React.Fragment>
                            ))} */}
                        </Box>
                    </Box>
                );
            case sections.endGame:
                return (
                    <Box minH={'calc(100vh - 200px)'}>
                        <Box boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'} borderRadius={'10px'} padding={'10px'} margin={'10px 10px 30px 10px'}>
                            <Text marginBottom={'2px'} fontWeight={'bold'} fontSize={'110%'}>
                                Charge:
                            </Text>
                            <Center>
                                <Flex flexWrap={'wrap'} marginBottom={'calc(25px - 8px)'} justifyContent={'center'}>
                                    {chargeTypesTele.map((type) => (
                                        <Button
                                            outline={standFormData.chargeTele === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                            maxW={'100px'}
                                            minW={'100px'}
                                            margin={'8px'}
                                            key={type.id}
                                            _focus={{ outline: 'none' }}
                                            colorScheme={standFormData.chargeTele === type.label ? 'green' : 'gray'}
                                            onClick={() => setStandFormData({ ...standFormData, chargeTele: type.label })}
                                        >
                                            {type.label}
                                        </Button>
                                    ))}
                                </Flex>
                            </Center>
                            {(standFormData.chargeTele === 'Dock' || standFormData.chargeTele === 'Engage') && (
                                <React.Fragment>
                                    <Text marginBottom={'2px'} fontWeight={'bold'} fontSize={'110%'}>
                                        # on Charge Station:
                                    </Text>
                                    <Center>
                                        <Flex flexWrap={'wrap'} marginBottom={'calc(25px - 8px)'} justifyContent={'center'}>
                                            {[1, 2, 3].map((count) => (
                                                <Button
                                                    outline={standFormData.chargeRobotCount === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                                    maxW={'60px'}
                                                    minW={'60px'}
                                                    margin={'8px'}
                                                    key={count}
                                                    _focus={{ outline: 'none' }}
                                                    colorScheme={standFormData.chargeRobotCount === count ? 'green' : 'gray'}
                                                    onClick={() => setStandFormData({ ...standFormData, chargeRobotCount: count })}
                                                >
                                                    {count}
                                                </Button>
                                            ))}
                                        </Flex>
                                    </Center>
                                </React.Fragment>
                            )}
                            {['Dock', 'Impaired', 'Fail'].includes(standFormData.chargeTele) && (
                                <React.Fragment>
                                    <Text marginBottom={'10px'} fontWeight={'bold'} fontSize={'110%'}>
                                        Charge Comment:
                                    </Text>
                                    <Center marginBottom={'25px'}>
                                        <Textarea
                                            isInvalid={submitAttempted && standFormData.chargeComment.trim() === ''}
                                            _focus={{ outline: 'none', boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px' }}
                                            onChange={(event) => setStandFormData({ ...standFormData, chargeComment: event.target.value })}
                                            value={standFormData.chargeComment}
                                            placeholder={(() => {
                                                switch (standFormData.chargeTele) {
                                                    case 'Dock':
                                                        return 'Why was the robot not able to engage?';
                                                    case 'Impaired':
                                                        return 'How did the robot get impaired?';
                                                    case 'Fail':
                                                    default:
                                                        return 'How did the robot fail?';
                                                }
                                            })()}
                                            w={'85%'}
                                        ></Textarea>
                                    </Center>
                                </React.Fragment>
                            )}
                            <Text marginBottom={'10px'} fontWeight={'bold'} fontSize={'110%'}>
                                Disrupted Partner's Charge:
                            </Text>
                            <HStack marginBottom={standFormData.impairedCharge ? '25px' : '8px'} marginLeft={'25px'} spacing={'30px'}>
                                <Button
                                    outline={standFormData.impairedCharge === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                    _focus={{ outline: 'none' }}
                                    colorScheme={standFormData.impairedCharge === true ? 'green' : 'gray'}
                                    onClick={() => setStandFormData({ ...standFormData, impairedCharge: true })}
                                >
                                    Yes
                                </Button>
                                <Button
                                    outline={standFormData.impairedCharge === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                    _focus={{ outline: 'none' }}
                                    colorScheme={standFormData.impairedCharge === false ? 'green' : 'gray'}
                                    onClick={() => setStandFormData({ ...standFormData, impairedCharge: false })}
                                >
                                    No
                                </Button>
                            </HStack>
                            {standFormData.impairedCharge && (
                                <React.Fragment>
                                    <Text marginBottom={'10px'} fontWeight={'bold'} fontSize={'110%'}>
                                        Disrupted Comment:
                                    </Text>
                                    <Center marginBottom={'8px'}>
                                        <Textarea
                                            isInvalid={submitAttempted && standFormData.impairedComment.trim() === ''}
                                            _focus={{ outline: 'none', boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px' }}
                                            onChange={(event) => setStandFormData({ ...standFormData, impairedComment: event.target.value })}
                                            value={standFormData.impairedComment}
                                            placeholder={'How did the robot disrupt their alliance partners?'}
                                            w={'85%'}
                                        ></Textarea>
                                    </Center>
                                </React.Fragment>
                            )}
                        </Box>
                    </Box>
                );
            case sections.closing:
                return (
                    <Box minH={'calc(100vh - 200px)'}>
                        <Box boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'} borderRadius={'10px'} padding={'10px'} margin={'10px 10px 10px 10px'}>
                            <Text marginBottom={'2px'} fontWeight={'bold'} fontSize={'110%'}>
                                Defended By:
                            </Text>
                            {/* <Center>
                                <Flex flexWrap={'wrap'} justifyContent={'center'} marginBottom={`${25 - 8}px`}>
                                    {['None'].concat(opposingAlliance).map((team) => (
                                        <Button
                                            outline={standFormData.defendedBy === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                            maxW={'100px'}
                                            minW={'100px'}
                                            margin={'8px'}
                                            key={team}
                                            _focus={{ outline: 'none' }}
                                            colorScheme={standFormData.defendedBy === team ? 'green' : 'gray'}
                                            onClick={() => setStandFormData({ ...standFormData, defendedBy: team })}
                                        >
                                            {team}
                                        </Button>
                                    ))}
                                </Flex>
                            </Center> */}
                            <Text marginBottom={'10px'} fontWeight={'bold'} fontSize={'110%'}>
                                Lose Communication:
                            </Text>
                            <HStack marginBottom={'20px'} marginLeft={'25px'} spacing={'30px'}>
                                <Button
                                    _focus={{ outline: 'none' }}
                                    outline={standFormData.loseCommunication === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                    colorScheme={standFormData.loseCommunication === true ? 'green' : 'gray'}
                                    onClick={() => setStandFormData({ ...standFormData, loseCommunication: true })}
                                >
                                    Yes
                                </Button>
                                <Button
                                    _focus={{ outline: 'none' }}
                                    outline={standFormData.loseCommunication === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                    colorScheme={standFormData.loseCommunication === false ? 'green' : 'gray'}
                                    onClick={() => setStandFormData({ ...standFormData, loseCommunication: false })}
                                >
                                    No
                                </Button>
                            </HStack>
                            <Text marginBottom={'10px'} fontWeight={'bold'} fontSize={'110%'}>
                                Robot Broke:
                            </Text>
                            <HStack marginBottom={'20px'} marginLeft={'25px'} spacing={'30px'}>
                                <Button
                                    _focus={{ outline: 'none' }}
                                    outline={standFormData.robotBreak === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                    colorScheme={standFormData.robotBreak === true ? 'green' : 'gray'}
                                    onClick={() => setStandFormData({ ...standFormData, robotBreak: true })}
                                >
                                    Yes
                                </Button>
                                <Button
                                    _focus={{ outline: 'none' }}
                                    outline={standFormData.robotBreak === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                    colorScheme={standFormData.robotBreak === false ? 'green' : 'gray'}
                                    onClick={() => setStandFormData({ ...standFormData, robotBreak: false })}
                                >
                                    No
                                </Button>
                            </HStack>
                            <Text marginBottom={'10px'} fontWeight={'bold'} fontSize={'110%'}>
                                Yellow Card:
                            </Text>
                            <HStack marginBottom={'20px'} marginLeft={'25px'} spacing={'30px'}>
                                <Button
                                    _focus={{ outline: 'none' }}
                                    outline={standFormData.yellowCard === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                    colorScheme={standFormData.yellowCard === true ? 'green' : 'gray'}
                                    onClick={() => setStandFormData({ ...standFormData, yellowCard: true })}
                                >
                                    Yes
                                </Button>
                                <Button
                                    _focus={{ outline: 'none' }}
                                    outline={standFormData.yellowCard === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                    colorScheme={standFormData.yellowCard === false ? 'green' : 'gray'}
                                    onClick={() => setStandFormData({ ...standFormData, yellowCard: false })}
                                >
                                    No
                                </Button>
                            </HStack>
                            <Text marginBottom={'10px'} fontWeight={'bold'} fontSize={'110%'}>
                                Red Card:
                            </Text>
                            <HStack marginBottom={'20px'} marginLeft={'25px'} spacing={'30px'}>
                                <Button
                                    _focus={{ outline: 'none' }}
                                    outline={standFormData.redCard === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                    colorScheme={standFormData.redCard === true ? 'green' : 'gray'}
                                    onClick={() => setStandFormData({ ...standFormData, redCard: true })}
                                >
                                    Yes
                                </Button>
                                <Button
                                    _focus={{ outline: 'none' }}
                                    outline={standFormData.redCard === null && submitAttempted && !isFollowOrNoShow() ? '2px solid red' : 'none'}
                                    colorScheme={standFormData.redCard === false ? 'green' : 'gray'}
                                    onClick={() => setStandFormData({ ...standFormData, redCard: false })}
                                >
                                    No
                                </Button>
                            </HStack>
                            <Text marginBottom={'10px'} fontWeight={'bold'} fontSize={'110%'}>
                                Auto Comment:
                            </Text>
                            <Center marginBottom={'25px'}>
                                <Textarea
                                    _focus={{ outline: 'none', boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px' }}
                                    onChange={(event) => setStandFormData({ ...standFormData, standAutoComment: event.target.value })}
                                    value={standFormData.standAutoComment}
                                    placeholder='Any comments about auto'
                                    w={'85%'}
                                ></Textarea>
                            </Center>
                            {standFormData.standStatus !== matchFormStatus.noShow && (
                                <React.Fragment>
                                    <Text marginBottom={'10px'} fontWeight={'bold'} fontSize={'110%'}>
                                        Ending Comment:
                                    </Text>
                                    <Center marginBottom={'25px'}>
                                        <Textarea
                                            _focus={{ outline: 'none', boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px' }}
                                            onChange={(event) => setStandFormData({ ...standFormData, standEndComment: event.target.value })}
                                            value={standFormData.standEndComment}
                                            placeholder='Any ending comments'
                                            w={'85%'}
                                        ></Textarea>
                                    </Center>
                                </React.Fragment>
                            )}
                            {standFormData.standStatus !== matchFormStatus.noShow && (
                                <Center marginBottom={'10px'}>
                                    <Checkbox
                                        //removes the blue outline on focus
                                        css={`
                                            > span:first-of-type {
                                                box-shadow: unset;
                                            }
                                        `}
                                        colorScheme={'green'}
                                        isChecked={standFormData.standStatus === matchFormStatus.followUp}
                                        onChange={() => setStandFormData({ ...standFormData, standStatus: standFormData.standStatus === matchFormStatus.followUp ? null : matchFormStatus.followUp })}
                                    >
                                        Mark For Follow Up
                                    </Checkbox>
                                </Center>
                            )}
                            {isFollowOrNoShow() ? (
                                <Center marginBottom={'8px'}>
                                    <Textarea
                                        isInvalid={submitAttempted && standFormData.standStatusComment.trim() === ''}
                                        _focus={{ outline: 'none', boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px' }}
                                        onChange={(event) => setStandFormData({ ...standFormData, standStatusComment: event.target.value })}
                                        value={standFormData.standStatusComment}
                                        placeholder={`What is the reason for the ${standFormData.standStatus.toLowerCase()}?`}
                                        w={'85%'}
                                    ></Textarea>
                                </Center>
                            ) : null}
                        </Box>
                        <Center>
                            <Button isDisabled={submitting} _focus={{ outline: 'none' }} marginBottom={'20px'} marginTop={'20px'} onClick={() => console.log('submit')}>
                                Submit
                            </Button>
                        </Center>
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
                                    setStandFormDialog(false);
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

    if (standFormData.loading || whitespace === null || dimensionRatios === null || futureAlly === null) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Flex margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }} height={'calc(100vh - 100px)'}>
            {/* {futureAlly ? <StarIcon position={'absolute'} left={'10px'} top={'95px'} stroke={'black'} viewBox={'-1 -1 26 26'} fontSize={'30px'} color={'yellow.300'} /> : null} */}
            {renderSection(activeSection)}
        </Flex>
    );
}

// function ScoringButton({ type, standFormData, setStandFormData, dataField, manager, max, shakeElement, setShakeElement, mobileFlag, toast }) {
//     return (
//         <Center
//             className={shakeElement === JSON.stringify(dataField) && 'shake'}
//             userSelect={'none'}
//             cursor={'pointer'}
//             fontSize={'45px'}
//             backgroundColor={type === 'Cone' ? '#F7F03E' : '#BE4FB8'}
//             _hover={{ backgroundColor: type === 'Cone' ? '#EBE40A' : '#B342AD' }}
//             _active={{ backgroundColor: type === 'Cone' ? '#C5C340' : '#953790' }}
//             minW={{ base: '75px', md: '85px', lg: '106px' }}
//             minH={{ base: '75px', md: '90px', lg: '100px' }}
//             borderRadius={'10px'}
//             onMouseDown={() => {
//                 setShakeElement(null);
//                 clearTimeout(doShake);
//                 clearTimeout(zeroScore);
//                 wasHeldDown = false;
//                 touchIsInside = false;
//                 if (standFormData[`${dataField.row}${dataField.phase}`][dataField.field] > 0) {
//                     doShake = setTimeout(() => {
//                         setShakeElement(JSON.stringify(dataField));
//                         wasHeldDown = true;
//                     }, 500);
//                     zeroScore = setTimeout(() => {
//                         manager.doCommand(ZERO, standFormData, setStandFormData, dataField);
//                         wasHeldDown = true;
//                         toast({
//                             title: `Reset`,
//                             status: 'info',
//                             duration: 1000,
//                             isClosable: true
//                         });
//                     }, 2000);
//                 }
//             }}
//             onMouseOut={(event) => {
//                 if (mobileFlag) {
//                     event.preventDefault();
//                 } else {
//                     setShakeElement(null);
//                     clearTimeout(doShake);
//                     clearTimeout(zeroScore);
//                     wasHeldDown = false;
//                     touchIsInside = false;
//                 }
//             }}
//             onMouseUp={() => {
//                 if (!wasHeldDown) {
//                     manager.doCommand(INCREMENT, standFormData, setStandFormData, dataField, max);
//                 }
//                 setShakeElement(null);
//                 clearTimeout(doShake);
//                 clearTimeout(zeroScore);
//                 wasHeldDown = false;
//                 touchIsInside = false;
//             }}
//             onTouchStart={(event) => {
//                 event.preventDefault();
//                 setShakeElement(null);
//                 clearTimeout(doShake);
//                 clearTimeout(zeroScore);
//                 wasHeldDown = false;
//                 touchIsInside = true;
//                 if (standFormData[`${dataField.row}${dataField.phase}`][dataField.field] > 0) {
//                     doShake = setTimeout(() => {
//                         setShakeElement(JSON.stringify(dataField));
//                         wasHeldDown = true;
//                     }, 500);
//                     zeroScore = setTimeout(() => {
//                         manager.doCommand(ZERO, standFormData, setStandFormData, dataField);
//                         wasHeldDown = true;
//                         toast({
//                             title: `Reset`,
//                             status: 'info',
//                             duration: 1000,
//                             isClosable: true
//                         });
//                     }, 2000);
//                 }
//             }}
//             onTouchMove={(event) => {
//                 event.preventDefault();
//                 setShakeElement(null);
//                 clearTimeout(doShake);
//                 clearTimeout(zeroScore);
//                 wasHeldDown = false;
//                 touchIsInside = false;
//             }}
//             onTouchEnd={(event) => {
//                 event.preventDefault();
//                 if (!wasHeldDown && touchIsInside) {
//                     manager.doCommand(INCREMENT, standFormData, setStandFormData, dataField, max);
//                 }
//                 setShakeElement(null);
//                 clearTimeout(doShake);
//                 clearTimeout(zeroScore);
//                 wasHeldDown = false;
//                 touchIsInside = false;
//             }}
//         >
//             {standFormData[`${dataField.row}${dataField.phase}`][dataField.field]}
//         </Center>
//     );
// }

// function MissedButton({ standFormData, setStandFormData, dataField, manager, max, shakeElement, setShakeElement, mobileFlag, toast }) {
//     return (
//         <Center
//             className={shakeElement === JSON.stringify(dataField) && 'shake'}
//             userSelect={'none'}
//             cursor={'pointer'}
//             fontSize={'25px'}
//             backgroundColor={'red.400'}
//             _hover={{ backgroundColor: 'red.500' }}
//             _active={{ backgroundColor: 'red.600' }}
//             minW={{ base: '45px', md: '50px', lg: '60px' }}
//             minH={{ base: '35px', md: '40px', lg: '45px' }}
//             borderRadius={'10px'}
//             onMouseDown={() => {
//                 setShakeElement(null);
//                 clearTimeout(doShake);
//                 clearTimeout(zeroScore);
//                 wasHeldDown = false;
//                 touchIsInside = false;
//                 if (standFormData[`${dataField.row}${dataField.phase}`][dataField.field] > 0) {
//                     doShake = setTimeout(() => {
//                         setShakeElement(JSON.stringify(dataField));
//                         wasHeldDown = true;
//                     }, 500);
//                     zeroScore = setTimeout(() => {
//                         manager.doCommand(ZERO, standFormData, setStandFormData, dataField);
//                         wasHeldDown = true;
//                         toast({
//                             title: `Reset`,
//                             status: 'info',
//                             duration: 1000,
//                             isClosable: true
//                         });
//                     }, 2000);
//                 }
//             }}
//             onMouseOut={(event) => {
//                 if (mobileFlag) {
//                     event.preventDefault();
//                 } else {
//                     setShakeElement(null);
//                     clearTimeout(doShake);
//                     clearTimeout(zeroScore);
//                     wasHeldDown = false;
//                     touchIsInside = false;
//                 }
//             }}
//             onMouseUp={() => {
//                 if (!wasHeldDown) {
//                     manager.doCommand(INCREMENT, standFormData, setStandFormData, dataField, max);
//                 }
//                 setShakeElement(null);
//                 clearTimeout(doShake);
//                 clearTimeout(zeroScore);
//                 wasHeldDown = false;
//                 touchIsInside = false;
//             }}
//             onTouchStart={(event) => {
//                 event.preventDefault();
//                 setShakeElement(null);
//                 clearTimeout(doShake);
//                 clearTimeout(zeroScore);
//                 wasHeldDown = false;
//                 touchIsInside = true;
//                 if (standFormData[`${dataField.row}${dataField.phase}`][dataField.field] > 0) {
//                     doShake = setTimeout(() => {
//                         setShakeElement(JSON.stringify(dataField));
//                         wasHeldDown = true;
//                     }, 500);
//                     zeroScore = setTimeout(() => {
//                         manager.doCommand(ZERO, standFormData, setStandFormData, dataField);
//                         wasHeldDown = true;
//                         toast({
//                             title: `Reset`,
//                             status: 'info',
//                             duration: 1000,
//                             isClosable: true
//                         });
//                     }, 2000);
//                 }
//             }}
//             onTouchMove={(event) => {
//                 event.preventDefault();
//                 setShakeElement(null);
//                 clearTimeout(doShake);
//                 clearTimeout(zeroScore);
//                 wasHeldDown = false;
//                 touchIsInside = false;
//             }}
//             onTouchEnd={(event) => {
//                 event.preventDefault();
//                 if (!wasHeldDown && touchIsInside) {
//                     manager.doCommand(INCREMENT, standFormData, setStandFormData, dataField, max);
//                 }
//                 setShakeElement(null);
//                 clearTimeout(doShake);
//                 clearTimeout(zeroScore);
//                 wasHeldDown = false;
//                 touchIsInside = false;
//             }}
//         >
//             {standFormData[`${dataField.row}${dataField.phase}`][dataField.field]}
//         </Center>
//     );
// }

export default StandForm;

import { Fragment, React, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { GET_EVENT, GET_PITFORM } from '../graphql/queries';
import { UPDATE_PITFORM } from '../graphql/mutations';
import {
    Text,
    Textarea,
    Checkbox,
    Grid,
    GridItem,
    Button,
    Center,
    VStack,
    Radio,
    RadioGroup,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Box,
    HStack,
    Stack,
    Spinner,
    useToast,
    Image as ChakraImage,
    useDisclosure,
    Popover,
    PopoverTrigger,
    PopoverArrow,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverBody,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Circle,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter,
    Input,
    Flex,
    IconButton,
} from '@chakra-ui/react';
import { AddIcon, CloseIcon, DeleteIcon, RepeatIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { v4 as uuidv4 } from 'uuid';
import RedFieldNonAllowable from '../images/RedFieldNonAllowable.png';
import RedFieldAllowable from '../images/RedFieldAllowable.png';
import { deepEqual } from '../util/helperFunctions';
let doResize;
let imageWidth = 438;
let imageHeight = 438;

let driveTrainsList = [
    { label: 'Tank', id: uuidv4() },
    { label: 'Swerve', id: uuidv4() },
    { label: 'Mecanum', id: uuidv4() },
    { label: 'H-Drive', id: uuidv4() },
    { label: 'Other', id: uuidv4() },
];
let motorsList = [
    { label: 'Falcon 500', id: uuidv4() },
    { label: 'NEO', id: uuidv4() },
    { label: 'CIM', id: uuidv4() },
    { label: 'Mini-CIM', id: uuidv4() },
    { label: 'NEO 550', id: uuidv4() },
    { label: '775 Pro', id: uuidv4() },
];
let wheelsList = [
    { label: 'Traction', id: uuidv4() },
    { label: 'Omni', id: uuidv4() },
    { label: 'Colson', id: uuidv4() },
    { label: 'Pneumatic', id: uuidv4() },
    { label: 'Mecanum', id: uuidv4() },
];
let programmingLanguagesList = [
    { label: 'Java', id: uuidv4() },
    { label: 'C++', id: uuidv4() },
    { label: 'LabVIEW', id: uuidv4() },
    { label: 'Other', id: uuidv4() },
];
let abilityTypes = {
    ranking: 'ranking',
    checkbox: 'checkbox',
    radio: 'radio',
};
let subAbilityTypes = {
    radio: 'radio',
    comment: 'comment',
};

function PitForm() {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    let { eventKey: eventKeyParam, teamNumber: teamNumberParam } = useParams();
    const hiddenImageInput = useRef(null);

    const [error, setError] = useState(null);
    const cancelRef = useRef();
    const [pitFormDialog, setPitFormDialog] = useState(false);
    const [loadResponse, setLoadResponse] = useState(null);
    const [imgHeader, setImgHeader] = useState('Same Image');
    const [teamName, setTeamName] = useState(null);
    const [eventName, setEventName] = useState(null);
    const [pitFormData, setPitFormData] = useState({
        weight: null,
        height: null,
        frameSize: { width: null, length: null },
        driveTrain: null,
        motors: [],
        wheels: [],
        gearRatios: [],
        driveTrainComment: '',
        programmingLanguage: null,
        startingPosition: { x: null, y: null },
        autoAbilities: [
            {
                label: 'Mobility (Cross Community)',
                type: abilityTypes.radio,
                abilities: [
                    { label: 'Yes', id: uuidv4() },
                    { label: 'No', id: uuidv4() },
                ],
                value: null,
                id: uuidv4(),
            },
            {
                label: 'Charge Station',
                type: abilityTypes.checkbox,
                abilities: [
                    { label: 'Dock', id: uuidv4() },
                    { label: 'Engage', subType: subAbilityTypes.comment, subField: '', placeHolder: 'How do you balance in AUTO?', id: uuidv4() },
                ],
                checked: [],
                id: uuidv4(),
            },
        ],
        autoComment: '',
        teleAbilities: [
            {
                label: 'Storage',
                type: abilityTypes.checkbox,
                abilities: [
                    { label: 'Hold a cone', id: uuidv4() },
                    { label: 'Hold a cube', id: uuidv4() },
                ],
                checked: [],
                id: uuidv4(),
            },
            {
                label: 'Cone Intake',
                type: abilityTypes.ranking,
                abilities: [
                    {
                        label: 'Pick up from the floor',
                        rank: -1,
                        id: uuidv4(),
                        subFields: [
                            { label: 'Any Orientation', id: uuidv4() },
                            { label: 'Limited Orientation', id: uuidv4() },
                        ],
                        subField: null,
                        subType: subAbilityTypes.radio,
                    },
                    { label: 'Pick up from substation slider', rank: -2, id: uuidv4() },
                    { label: 'Pick up from single substation', rank: -3, id: uuidv4() },
                ],
                id: uuidv4(),
            },
            {
                label: 'Cube Intake',
                type: abilityTypes.ranking,
                abilities: [
                    { label: 'Pick up from the floor', rank: -1, id: uuidv4() },
                    { label: 'Pick up from substation slider', rank: -2, id: uuidv4() },
                    { label: 'Pick up from single substation', rank: -3, id: uuidv4() },
                ],
                id: uuidv4(),
            },
            {
                label: 'Cone Scoring',
                type: abilityTypes.checkbox,
                abilities: [
                    { label: 'Top Row', id: uuidv4() },
                    { label: 'Middle Row', id: uuidv4() },
                    { label: 'Bottom Row', id: uuidv4() },
                ],
                checked: [],
                id: uuidv4(),
            },
            {
                label: 'Cube Scoring',
                type: abilityTypes.checkbox,
                abilities: [
                    { label: 'Top Row', id: uuidv4() },
                    { label: 'Middle Row', id: uuidv4() },
                    { label: 'Bottom Row', id: uuidv4() },
                ],
                checked: [],
                id: uuidv4(),
            },
            {
                label: 'Charge Station',
                type: abilityTypes.checkbox,
                abilities: [
                    { label: 'Dock', id: uuidv4() },
                    { label: 'Engage', subType: subAbilityTypes.comment, subField: '', placeHolder: 'How do you balancein TELEOP?', id: uuidv4() },
                    { label: 'Assist another robot', subType: subAbilityTypes.comment, subField: '', placeHolder: 'How do you assist the robot?\nHow many robots can you assist?', id: uuidv4() },
                ],
                checked: [],
                id: uuidv4(),
            },
        ],
        batteryCount: null,
        chargingBatteryCount: null,
        workingComment: '',
        closingComment: '',
        image: '',
        followUp: false,
        followUpComment: '',
        loading: true,
    });
    const prevPitFormData = useRef(null);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
    const [modalComment, setModalComment] = useState('');
    const { isOpen: isMotorsOpen, onOpen: onMotorsOpen, onClose: onMotorsClose } = useDisclosure();
    const [deletingMotors, setDeletingMotors] = useState(false);
    const { isOpen: isWheelsOpen, onOpen: onWheelsOpen, onClose: onWheelsClose } = useDisclosure();
    const [deletingWheels, setDeletingWheels] = useState(false);
    const [deletingGearRatios, setDeleteGearRatios] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [swapDone, setSwapDone] = useState(true);
    const [swappingElement, setSwappingElement] = useState(null);
    const mainCanvas = useRef(null);
    const secondCanvas = useRef(null);
    const offSideCanvas = useRef(null);
    const image = useRef(null);
    const allowableImage = useRef(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [allowableImageLoaded, setAllowableImageLoaded] = useState(false);
    const prevWidth = useRef(window.innerWidth);
    const [initialDrawn, setInitialDrawn] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('PitFormData')) {
            let pitForm = JSON.parse(localStorage.getItem('PitFormData'));
            if (pitForm.teamNumberParam === teamNumberParam && pitForm.eventKeyParam === eventKeyParam) {
                setLoadResponse('Required');
                setPitFormDialog(true);
            } else {
                setLoadResponse(false);
            }
        } else {
            setLoadResponse(false);
        }
    }, [eventKeyParam, teamNumberParam]);

    useEffect(() => {
        fetch(`/blueAlliance/team/frc${parseInt(teamNumberParam)}/simple`)
            .then((response) => response.json())
            .then((data) => {
                if (!data.Error) {
                    setTeamName(data.nickname);
                } else {
                    setError(data.Error);
                }
            })
            .catch((error) => {
                setError(error);
            });
        // fetch(`/blueAlliance/team/frc${parseInt(teamNumberParam)}/events/${year}/simple`)
        //     .then((response) => response.json())
        //     .then((data) => {
        //         if (!data.Error) {
        //             let event = data.find((event) => event.key === eventKeyParam);
        //             if (event === undefined) {
        //                 setError('This team is not competing at this event or this event does not exist');
        //             } else {
        //                 setEventName(event.name);
        //             }
        //         } else {
        //             setError(data.Error);
        //         }
        //     })
        //     .catch((error) => {
        //         setError(error);
        //     });
    }, [eventKeyParam, teamNumberParam]);

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

    const { loading: loadingPitForm, error: pitFormError } = useQuery(GET_PITFORM, {
        skip: !eventName || loadResponse === null || loadResponse,
        fetchPolicy: 'network-only',
        variables: {
            eventKey: eventKeyParam,
            teamNumber: parseInt(teamNumberParam),
        },
        onError(err) {
            console.log(JSON.stringify(err, null, 2));
            setError('Apollo error, could not retrieve pit form');
        },
        onCompleted({ getPitForm: pitForm }) {
            if (!pitForm) {
                let copy = JSON.parse(JSON.stringify(pitFormData));
                copy.loading = false;
                prevPitFormData.current = copy;
                setPitFormData({ ...pitFormData, loading: false });
                return;
            }
            let modifiedMotors = pitForm.motors.map((motor) => {
                return {
                    label: motor.label,
                    value: motor.value,
                    id: uuidv4(),
                };
            });
            let modifiedWheels = pitForm.wheels.map((wheel) => {
                return {
                    label: wheel.label,
                    size: wheel.size === null ? '' : wheel.size.toString(),
                    value: wheel.value,
                    id: uuidv4(),
                };
            });
            let modifiedGearRatios = pitForm.driveStats.map((stat) => {
                return {
                    drivingGear: stat.preferRatio ? stat.drivingGear : '',
                    drivenGear: stat.preferRatio ? stat.drivenGear : '',
                    freeSpeed: !stat.preferRatio ? stat.freeSpeed : '',
                    preferRatio: stat.preferRatio,
                    id: uuidv4(),
                };
            });
            let modifiedAutoAbilities = modifyDataBaseAbilities(pitFormData.autoAbilities, pitForm.autoAbilities);
            let modifiedTeleAbilities = modifyDataBaseAbilities(pitFormData.teleAbilities, pitForm.teleAbilities);
            let data = {
                weight: pitForm.weight,
                height: pitForm.height,
                driveTrain: pitForm.driveTrain,
                frameSize: pitForm.frameSize,
                motors: modifiedMotors,
                wheels: modifiedWheels,
                gearRatios: modifiedGearRatios,
                driveTrainComment: pitForm.driveTrainComment,
                programmingLanguage: pitForm.programmingLanguage,
                startingPosition: { x: pitForm.startingPosition.x, y: pitForm.startingPosition.y },
                autoAbilities: modifiedAutoAbilities,
                autoComment: pitForm.autoComment,
                teleAbilities: modifiedTeleAbilities,
                batteryCount: pitForm.batteryCount,
                chargingBatteryCount: pitForm.chargingBatteryCount,
                workingComment: pitForm.workingComment,
                closingComment: pitForm.closingComment,
                image: pitForm.image,
                followUp: pitForm.followUp,
                followUpComment: pitForm.followUpComment,
                loading: false,
            };
            prevPitFormData.current = JSON.parse(JSON.stringify(data));
            setPitFormData(data);
        },
    });

    useEffect(() => {
        let img = new Image();
        let allowableImg = new Image();
        img.src = RedFieldNonAllowable;
        allowableImg.src = RedFieldAllowable;
        img.onload = () => {
            image.current = img;
            setImageLoaded(true);
        };
        allowableImg.onload = () => {
            allowableImage.current = allowableImg;
            let canvas = document.createElement('canvas');
            canvas.width = imageWidth;
            canvas.height = imageHeight;
            canvas.getContext('2d').drawImage(allowableImg, 0, 0, imageWidth, imageHeight);
            offSideCanvas.current = canvas;
            setAllowableImageLoaded(true);
        };

        //Dont know if this is necessary but just in case
        return () => {
            clearTimeout(doResize);
        };
    }, []);

    function handleSetWeight(value) {
        if (value.trim() !== '') {
            setPitFormData({ ...pitFormData, weight: twoPrecision(parseFloat(value)) });
        } else if (value.trim() === '') {
            setPitFormData({ ...pitFormData, weight: null });
        }
    }

    function handleSetHeight(value) {
        if (value.trim() !== '') {
            setPitFormData({ ...pitFormData, height: twoPrecision(parseFloat(value)) });
        } else if (value.trim() === '') {
            setPitFormData({ ...pitFormData, height: null });
        }
    }

    function handleSetFrameWidth(value) {
        if (value.trim() !== '') {
            setPitFormData({ ...pitFormData, frameSize: { ...pitFormData.frameSize, width: twoPrecision(parseFloat(value)) } });
        } else if (value.trim() === '') {
            setPitFormData({ ...pitFormData, frameSize: { ...pitFormData.frameSize, width: null } });
        }
    }

    function handleSetFrameLength(value) {
        if (value.trim() !== '') {
            setPitFormData({ ...pitFormData, frameSize: { ...pitFormData.frameSize, length: twoPrecision(parseFloat(value)) } });
        } else if (value.trim() === '') {
            setPitFormData({ ...pitFormData, frameSize: { ...pitFormData.frameSize, length: null } });
        }
    }

    function handleAddMotor(motorName) {
        let newMotors = [
            ...pitFormData.motors,
            {
                label: motorName,
                value: 0,
                id: uuidv4(),
            },
        ];
        setPitFormData({
            ...pitFormData,
            motors: newMotors,
        });
    }

    function handleRemoveMotor(motorName) {
        let newMotors = [...pitFormData.motors].filter((motor) => motor.label !== motorName);
        setPitFormData({
            ...pitFormData,
            motors: newMotors,
        });
        if (newMotors.length === 0) {
            setDeletingMotors(false);
        }
    }

    function handleDecrementMotor(motorLabel) {
        let newMotors = pitFormData.motors.map((motor) => {
            if (motorLabel === motor.label) {
                return {
                    ...motor,
                    value: motor.value === 0 ? 0 : motor.value - 1,
                };
            } else {
                return motor;
            }
        });
        setPitFormData({
            ...pitFormData,
            motors: newMotors,
        });
    }

    function handleIncrementMotor(motorLabel) {
        let newMotors = pitFormData.motors.map((motor) => {
            if (motorLabel === motor.label) {
                return {
                    ...motor,
                    value: motor.value + 1,
                };
            } else {
                return motor;
            }
        });
        setPitFormData({
            ...pitFormData,
            motors: newMotors,
        });
    }

    function handleAddWheel(wheelName) {
        let newWheels = [
            ...pitFormData.wheels,
            {
                label: wheelName,
                size: '',
                value: 0,
                id: uuidv4(),
            },
        ];
        setPitFormData({
            ...pitFormData,
            wheels: newWheels,
        });
    }

    function handleRemoveWheel(wheelName) {
        let newWheels = [...pitFormData.wheels].filter((wheel) => wheel.label !== wheelName);
        setPitFormData({
            ...pitFormData,
            wheels: newWheels,
        });
        if (newWheels.length === 0) {
            setDeletingWheels(false);
        }
    }

    function handleDecrementWheel(wheelLabel) {
        let newWheels = pitFormData.wheels.map((wheel) => {
            if (wheelLabel === wheel.label) {
                return {
                    ...wheel,
                    value: wheel.value === 0 ? 0 : wheel.value - 1,
                };
            } else {
                return wheel;
            }
        });
        setPitFormData({
            ...pitFormData,
            wheels: newWheels,
        });
    }

    function handleIncrementWheel(wheelLabel) {
        let newWheels = pitFormData.wheels.map((wheel) => {
            if (wheelLabel === wheel.label) {
                return {
                    ...wheel,
                    value: wheel.value + 1,
                };
            } else {
                return wheel;
            }
        });
        setPitFormData({
            ...pitFormData,
            wheels: newWheels,
        });
    }

    function handleWheelSize(wheelLabel, wheelSize) {
        let newWheels = pitFormData.wheels.map((wheel) => {
            if (wheelLabel === wheel.label) {
                return {
                    ...wheel,
                    size: wheelSize,
                };
            } else {
                return wheel;
            }
        });
        setPitFormData({
            ...pitFormData,
            wheels: newWheels,
        });
    }

    function handleWheelSizeBlur(wheelLabel, wheelSize) {
        let newWheels = pitFormData.wheels.map((wheel) => {
            if (wheelLabel === wheel.label && wheelSize.trim() !== '') {
                return {
                    ...wheel,
                    size: twoPrecision(parseFloat(wheelSize)),
                };
            } else {
                return wheel;
            }
        });
        setPitFormData({
            ...pitFormData,
            wheels: newWheels,
        });
    }

    function handleAddGearRatio() {
        let newGearRatios = [
            ...pitFormData.gearRatios,
            {
                drivingGear: '',
                drivenGear: '',
                freeSpeed: '',
                preferRatio: true,
                id: uuidv4(),
            },
        ];
        setPitFormData({
            ...pitFormData,
            gearRatios: newGearRatios,
        });
    }

    function handleRemoveGearRatio(id) {
        let newGearRatios = [...pitFormData.gearRatios].filter((gearRatio) => gearRatio.id !== id);
        setPitFormData({
            ...pitFormData,
            gearRatios: newGearRatios,
        });
        if (newGearRatios.length === 0) {
            setDeleteGearRatios(false);
        }
    }

    function handleGearRatioSwap(id) {
        let newGearRatios = pitFormData.gearRatios.map((gearRatio) => {
            if (gearRatio.id === id) {
                return {
                    ...gearRatio,
                    preferRatio: !gearRatio.preferRatio,
                };
            } else {
                return gearRatio;
            }
        });
        setPitFormData({
            ...pitFormData,
            gearRatios: newGearRatios,
        });
    }

    function handleDrivingRatio(id, ratio) {
        let newGearRatios = pitFormData.gearRatios.map((gearRatio) => {
            if (gearRatio.id === id) {
                return {
                    ...gearRatio,
                    drivingGear: ratio,
                };
            } else {
                return gearRatio;
            }
        });
        setPitFormData({
            ...pitFormData,
            gearRatios: newGearRatios,
        });
    }

    function handleDrivingRatioBlur(id, ratio) {
        let newGearRatios = pitFormData.gearRatios.map((gearRatio) => {
            if (gearRatio.id === id && ratio.trim() !== '') {
                return {
                    ...gearRatio,
                    drivingGear: twoPrecision(parseFloat(ratio)),
                };
            } else {
                return gearRatio;
            }
        });
        setPitFormData({
            ...pitFormData,
            gearRatios: newGearRatios,
        });
    }

    function handleDrivenRatio(id, ratio) {
        let newGearRatios = pitFormData.gearRatios.map((gearRatio) => {
            if (gearRatio.id === id) {
                return {
                    ...gearRatio,
                    drivenGear: ratio,
                };
            } else {
                return gearRatio;
            }
        });
        setPitFormData({
            ...pitFormData,
            gearRatios: newGearRatios,
        });
    }

    function handleDrivenRatioBlur(id, ratio) {
        let newGearRatios = pitFormData.gearRatios.map((gearRatio) => {
            if (gearRatio.id === id && ratio.trim() !== '') {
                return {
                    ...gearRatio,
                    drivenGear: twoPrecision(parseFloat(ratio)),
                };
            } else {
                return gearRatio;
            }
        });
        setPitFormData({
            ...pitFormData,
            gearRatios: newGearRatios,
        });
    }

    function handleFreeSpeed(id, freeSpeed) {
        let newGearRatios = pitFormData.gearRatios.map((gearRatio) => {
            if (gearRatio.id === id) {
                return {
                    ...gearRatio,
                    freeSpeed: freeSpeed,
                };
            } else {
                return gearRatio;
            }
        });
        setPitFormData({
            ...pitFormData,
            gearRatios: newGearRatios,
        });
    }

    function handleFreeSpeedBlur(id, freeSpeed) {
        let newGearRatios = pitFormData.gearRatios.map((gearRatio) => {
            if (gearRatio.id === id && freeSpeed.trim() !== '') {
                return {
                    ...gearRatio,
                    freeSpeed: twoPrecision(parseFloat(freeSpeed)),
                };
            } else {
                return gearRatio;
            }
        });
        setPitFormData({
            ...pitFormData,
            gearRatios: newGearRatios,
        });
    }

    function swapElements(classNameA, classNameB, abilities = null) {
        let elementA = document.getElementById(classNameA);
        let elementB = document.getElementById(classNameB);

        const finalElementAStyle = {
            x: null,
            y: null,
        };
        const finalElementBStyle = {
            x: null,
            y: null,
        };
        finalElementAStyle.x = elementA.getBoundingClientRect().left - elementB.getBoundingClientRect().left;
        finalElementAStyle.y = elementB.getBoundingClientRect().top - elementA.getBoundingClientRect().top;
        finalElementBStyle.x = elementB.getBoundingClientRect().left - elementA.getBoundingClientRect().left;
        finalElementBStyle.y = elementA.getBoundingClientRect().top - elementB.getBoundingClientRect().top;

        if (abilities) {
            let indexA = null;
            let indexB = null;
            let children = elementA.parentNode.children;
            for (let i = 0; i < children.length; i++) {
                if (children[i].id === classNameA) {
                    indexA = i;
                } else if (children[i].id === classNameB) {
                    indexB = i;
                }
            }
            let nextToEachOther = true;
            if (indexA !== null && indexB !== null) {
                nextToEachOther = Math.abs(indexA - indexB) === 1;
            }
            let adjustmentA = elementB.getBoundingClientRect().height - elementA.getBoundingClientRect().height;
            let translations = {
                [classNameA]: `translate(${finalElementAStyle.x}px, ${finalElementAStyle.y + adjustmentA}px)`,
                [classNameB]: `translate(${finalElementBStyle.x}px, ${finalElementBStyle.y}px)`,
            };
            if (!nextToEachOther) {
                abilities.forEach((ability) => {
                    if (ability.id !== classNameA && ability.id !== classNameB) {
                        translations[ability.id] = `translate(0px, ${adjustmentA}px)`;
                    }
                });
            }
            return translations;
        }
        let adjustmentB = elementB.getBoundingClientRect().height - elementA.getBoundingClientRect().height;
        return {
            [classNameA]: `translate(${finalElementAStyle.x}px, ${finalElementAStyle.y}px)`,
            [classNameB]: `translate(${finalElementBStyle.x}px, ${finalElementBStyle.y - adjustmentB}px)`,
        };
    }

    function handleIncreaseAbility(section, containerIndex, abilityId, oldRank) {
        if (!swapDone || oldRank === 1) {
            return;
        }

        let newAbilities = JSON.parse(JSON.stringify(pitFormData[section]));
        let shouldSwap = false;
        let otherId = null;
        let newInnerAbilities = newAbilities[containerIndex].abilities.map((ability) => {
            if (ability.id !== abilityId) {
                if ((ability.rank > 0 && ability.rank === oldRank - 1) || (ability.rank === -1 && oldRank < -1)) {
                    shouldSwap = true;
                    otherId = ability.id;
                    return { ...ability, rank: oldRank < -1 ? oldRank + 1 : oldRank };
                } else if (ability.rank < -1 && oldRank <= -1) {
                    return { ...ability, rank: ability.rank + 1 };
                }
            } else {
                if (ability.rank < 0) {
                    return { ...ability, rank: pitFormData[section][containerIndex].abilities.filter((a) => a.rank > 0).length + 1 };
                } else {
                    return { ...ability, rank: oldRank - 1 };
                }
            }
            return ability;
        });

        if (shouldSwap) {
            setSwapDone(false);
            let translations = swapElements(otherId, abilityId, newAbilities[containerIndex].abilities);
            newAbilities[containerIndex].abilities.forEach((ability) => {
                if (ability.id === abilityId || ability.id === otherId) {
                    ability.style = {
                        transition: 'transform linear 0.3s',
                        transform: translations[ability.id],
                    };
                    if (ability.id === abilityId) {
                        ability.style.zIndex = 3;
                    } else {
                        ability.style.zIndex = 2;
                    }
                } else {
                    ability.style = {
                        zIndex: 1,
                    };
                    if (translations?.[ability.id]) {
                        ability.style.transform = translations[ability.id];
                    }
                }
            });
            setSwappingElement(abilityId);
            setPitFormData({ ...pitFormData, [section]: newAbilities });
            setTimeout(() => {
                setSwappingElement(null);
                newAbilities[containerIndex].abilities = newInnerAbilities;
                setPitFormData({ ...pitFormData, [section]: newAbilities });
                setSwapDone(true);
            }, 300);
        } else {
            newAbilities[containerIndex].abilities = newInnerAbilities;
            setPitFormData({ ...pitFormData, [section]: newAbilities });
        }
    }

    function handleDecreaseAbility(section, containerIndex, abilityId, oldRank) {
        if (!swapDone || oldRank === -1) {
            return;
        }

        let newAbilities = JSON.parse(JSON.stringify(pitFormData[section]));
        let shouldSwap = false;
        let otherId = null;
        let newInnerAbilities = newAbilities[containerIndex].abilities.map((ability) => {
            if (ability.id !== abilityId) {
                if (ability.rank > 0 && ability.rank === oldRank + 1) {
                    shouldSwap = true;
                    otherId = ability.id;
                    return { ...ability, rank: oldRank };
                } else if (ability.rank < 0 && oldRank === pitFormData[section][containerIndex].abilities.filter((a) => a.rank > 0).length) {
                    return { ...ability, rank: ability.rank - 1 };
                }
            } else {
                if (oldRank === pitFormData[section][containerIndex].abilities.filter((a) => a.rank > 0).length) {
                    return { ...ability, rank: -1 };
                } else {
                    return { ...ability, rank: oldRank + 1 };
                }
            }
            return ability;
        });

        if (shouldSwap) {
            setSwapDone(false);
            let translations = swapElements(otherId, abilityId);
            newAbilities[containerIndex].abilities.forEach((ability) => {
                if (ability.id === abilityId || ability.id === otherId) {
                    ability.style = {
                        transition: 'transform linear 0.3s',
                        transform: translations[ability.id],
                    };
                    if (ability.id === abilityId) {
                        ability.style.zIndex = 3;
                    } else {
                        ability.style.zIndex = 2;
                    }
                } else {
                    ability.style = {
                        zIndex: 1,
                    };
                }
            });
            setSwappingElement(abilityId);
            setPitFormData({ ...pitFormData, [section]: newAbilities });
            setTimeout(() => {
                setSwappingElement(null);
                newAbilities[containerIndex].abilities = newInnerAbilities;
                setPitFormData({ ...pitFormData, [section]: newAbilities });
                setSwapDone(true);
            }, 300);
        } else {
            newAbilities[containerIndex].abilities = newInnerAbilities;
            setPitFormData({ ...pitFormData, [section]: newAbilities });
        }
    }

    function handleCheckboxAbility(section, containerIndex, abilityLabel) {
        if (pitFormData[section][containerIndex].checked.includes(abilityLabel)) {
            let newAbilities = JSON.parse(JSON.stringify(pitFormData[section]));
            newAbilities[containerIndex].checked = newAbilities[containerIndex].checked.filter((ability) => ability !== abilityLabel);
            setPitFormData({
                ...pitFormData,
                [section]: newAbilities,
            });
        } else {
            let newAbilities = JSON.parse(JSON.stringify(pitFormData[section]));
            newAbilities[containerIndex].checked.push(abilityLabel);
            setPitFormData({
                ...pitFormData,
                [section]: newAbilities,
            });
        }
    }

    function handleRadioAbility(section, containerIndex, value) {
        let newAbilities = JSON.parse(JSON.stringify(pitFormData[section]));
        newAbilities[containerIndex].value = value;
        setPitFormData({ ...pitFormData, [section]: newAbilities });
    }

    function handleSetBatteryCount(value) {
        if (value.trim() !== '') {
            setPitFormData({ ...pitFormData, batteryCount: parseInt(value) });
        } else if (value.trim() === '') {
            setPitFormData({ ...pitFormData, batteryCount: null });
        }
    }

    function handleSetChargingBatteryCount(value) {
        if (value.trim() !== '') {
            setPitFormData({ ...pitFormData, chargingBatteryCount: parseInt(value) });
        } else if (value.trim() === '') {
            setPitFormData({ ...pitFormData, chargingBatteryCount: null });
        }
    }

    function calculateImageScale(imageSize) {
        let scale;
        let screenWidth = window.innerWidth;
        if (screenWidth < 768) {
            scale = 0.6;
        } else if (screenWidth < 992) {
            scale = 0.35;
        } else {
            scale = 0.2;
        }
        return (screenWidth / imageSize) * scale;
    }

    function calculateCircleRadius() {
        let scale;
        let screenWidth = window.innerWidth;
        if (screenWidth < 768) {
            scale = 0.6;
        } else if (screenWidth < 992) {
            scale = 0.35;
        } else {
            scale = 0.2;
        }
        return (screenWidth / 10) * scale;
    }

    function getCanvasDimensions(rotation) {
        if (rotation === 0 || rotation === Math.PI) {
            return { width: imageWidth, height: imageHeight };
        } else {
            return { width: imageHeight, height: imageWidth };
        }
    }

    const drawImage = useCallback(
        (point, rotation) => {
            const mainCanvasElement = mainCanvas.current;
            const secondCanvasElement = secondCanvas.current;
            if (mainCanvasElement !== null && secondCanvasElement !== null) {
                const mainCtx = mainCanvasElement.getContext('2d');
                const secondCtx = secondCanvasElement.getContext('2d');
                let scale = calculateImageScale(imageWidth);
                let dimensions = getCanvasDimensions(rotation);
                let width = dimensions.width;
                let height = dimensions.height;
                mainCanvasElement.width = width * scale;
                mainCanvasElement.height = height * scale;
                secondCanvasElement.width = width * scale;
                secondCanvasElement.height = height * scale;
                mainCtx.filter = 'brightness(0.65)';
                mainCtx.translate((width / 2) * scale, (height / 2) * scale);
                secondCtx.translate((width / 2) * scale, (height / 2) * scale);
                // mainCtx.setTransform(scale, 0, 0, scale, 207 * scale, 207 * scale); // sets scale and origin
                mainCtx.rotate(rotation);
                secondCtx.rotate(rotation);
                mainCtx.translate((-imageWidth / 2) * scale, (-imageHeight / 2) * scale);
                secondCtx.translate((-imageWidth / 2) * scale, (-imageHeight / 2) * scale);
                // mainCtx.drawImage(img, -207, -207);
                mainCtx.drawImage(allowableImage.current, 0, 0, imageWidth * scale, imageHeight * scale);
                secondCtx.drawImage(image.current, 0, 0, imageWidth * scale, imageHeight * scale);
                if (point.x && point.y) {
                    mainCtx.filter = 'brightness(1.00)';
                    mainCtx.lineWidth = '4';
                    mainCtx.strokeStyle = 'green';
                    mainCtx.beginPath();
                    // let pointX = (point.x - 207) * Math.cos(rotation) - (point.y - 207) * Math.sin(rotation) + 207;
                    // let pointY = (point.x - 207) * Math.sin(rotation) + (point.y - 207) * Math.cos(rotation) + 207;
                    mainCtx.arc(point.x * scale, point.y * scale, calculateCircleRadius(), 0, 2 * Math.PI);
                    mainCtx.stroke();
                    mainCtx.closePath();
                }
                if (!initialDrawn) {
                    setInitialDrawn(true);
                }
            }
        },
        [initialDrawn]
    );

    const resizeCanvas = useCallback(() => {
        if (initialDrawn) {
            clearTimeout(doResize);
            if (window.innerWidth !== prevWidth.current) {
                prevWidth.current = window.innerWidth;
                doResize = setTimeout(() => drawImage(pitFormData.startingPosition, 0), 250);
            }
        }
    }, [drawImage, pitFormData.startingPosition, initialDrawn]);

    useEffect(() => {
        window.addEventListener('resize', resizeCanvas);

        return () => window.removeEventListener('resize', resizeCanvas);
    }, [resizeCanvas]);

    useEffect(() => {
        if (!pitFormData.loading && imageLoaded && allowableImageLoaded && teamName && eventName) {
            prevWidth.current = window.innerWidth;
            drawImage(pitFormData.startingPosition, 0);
        }
    }, [pitFormData.loading, drawImage, pitFormData.startingPosition, imageLoaded, allowableImageLoaded, eventName, teamName]);

    function resizeMe(img) {
        var canvas = document.createElement('canvas');

        var width = img.width;
        var height = img.height;

        const maxWidth = 1280;
        const maxHeight = 1280;

        // calculate the width and height, constraining the proportions
        if (width > height) {
            if (width > maxWidth) {
                //height *= maxWidth / width;
                height = Math.round((height *= maxWidth / width));
                width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
                //width *= maxHeight / height;
                width = Math.round((width *= maxHeight / height));
                height = maxHeight;
            }
        }

        // resize the canvas and draw the image data into it
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        return canvas.toDataURL('image/jpeg', 0.7); // get the data from canvas as 70% JPG (can be also PNG, etc.)
    }

    function updateImage(event) {
        if (event.target.files && event.target.files[0] && event.target.files[0].type.split('/')[0] === 'image') {
            var FR = new FileReader();
            FR.readAsArrayBuffer(event.target.files[0]);
            FR.onload = (e) => {
                setImgHeader('New Image');
                var blob = new Blob([e.target.result]); // create blob...
                window.URL = window.URL || window.webkitURL;
                var blobURL = window.URL.createObjectURL(blob); // and get it's URL
                // helper Image object
                var image = new Image();
                image.src = blobURL;
                //preview.appendChild(image); // preview commented out, I am using the canvas instead
                image.onload = function () {
                    // have to wait till it's loaded
                    var resized = resizeMe(image); // send it to canvas
                    setPitFormData({ ...pitFormData, image: resized });
                };
                FR.abort();
            };
        }
    }

    useEffect(() => {
        if (prevPitFormData.current !== null) {
            if (!deepEqual(prevPitFormData.current, pitFormData)) {
                localStorage.setItem('PitFormData', JSON.stringify({ ...pitFormData, eventKeyParam, teamNumberParam }));
            }
        }
        prevPitFormData.current = JSON.parse(JSON.stringify(pitFormData));
    }, [pitFormData, eventKeyParam, teamNumberParam]);

    function validMotors() {
        for (const motor of pitFormData.motors) {
            if (motor.value === 0) {
                return false;
            }
        }
        return true;
    }

    function validWheels() {
        for (const wheel of pitFormData.wheels) {
            if (wheel.value === 0 || wheel.size === '') {
                return false;
            }
        }
        return true;
    }

    function validGearRatios() {
        for (const gearRatio of pitFormData.gearRatios) {
            if (gearRatio.preferRatio) {
                if (gearRatio.drivingGear === '' || gearRatio.drivenGear === '') {
                    return false;
                }
            } else {
                if (gearRatio.freeSpeed === '') {
                    return false;
                }
            }
        }
        return true;
    }

    function validAbilities() {
        for (const ability of pitFormData.autoAbilities) {
            if (ability.type === abilityTypes.radio && ability.value === null) {
                return false;
            } else if (ability.type === abilityTypes.checkbox) {
                for (const subAbility of ability.abilities) {
                    if (subAbility.subType === subAbilityTypes.comment && ability.checked.includes(subAbility.label) && subAbility.subField.trim() === '') {
                        return false;
                    }
                }
            }
        }

        for (const ability of pitFormData.teleAbilities) {
            if (ability.type === abilityTypes.ranking) {
                for (const subAbility of ability.abilities) {
                    if (subAbility.subType === subAbilityTypes.radio && subAbility.rank > 0 && subAbility.subField === null) {
                        return false;
                    }
                }
            } else if (ability.type === abilityTypes.checkbox) {
                for (const subAbility of ability.abilities) {
                    if (subAbility.subType === subAbilityTypes.comment && ability.checked.includes(subAbility.label) && subAbility.subField.trim() === '') {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    function modifyDataBaseAbilities(clientAbilities, dataBaseAbilities) {
        let modifiedAbilities = JSON.parse(JSON.stringify(clientAbilities));
        for (let dataBaseAbility of dataBaseAbilities) {
            let clientAbility = modifiedAbilities.find((ability) => ability.label === dataBaseAbility.label);
            if (clientAbility.type === abilityTypes.ranking) {
                let negativeRanking = -1;
                clientAbility.abilities.forEach((subClientAbility) => {
                    let index = dataBaseAbility.abilities.findIndex((subDataBaseAbility) => subDataBaseAbility.label === subClientAbility.label);
                    if (index !== -1) {
                        subClientAbility.rank = index + 1;
                        if (subClientAbility?.subType === subAbilityTypes.radio) {
                            subClientAbility.subField = dataBaseAbility.abilities[index].subField;
                        }
                    } else {
                        subClientAbility.rank = negativeRanking--;
                    }
                });
            } else if (clientAbility.type === abilityTypes.checkbox) {
                clientAbility.abilities.forEach((subClientAbility) => {
                    let index = dataBaseAbility.abilities.findIndex((subDataBaseAbility) => subDataBaseAbility.label === subClientAbility.label);
                    if (index !== -1) {
                        clientAbility.checked.push(dataBaseAbility.abilities[index].label);
                        if (subClientAbility?.subType === subAbilityTypes.comment) {
                            subClientAbility.subField = dataBaseAbility.abilities[index].subField;
                        }
                    }
                });
            } else if (clientAbility.type === abilityTypes.radio) {
                if (dataBaseAbility.abilities.length === 0) {
                    clientAbility.value = null;
                } else {
                    clientAbility.value = dataBaseAbility.abilities[0].label;
                }
            }
        }
        return modifiedAbilities;
    }

    function validForm() {
        return (
            pitFormData.weight !== null &&
            pitFormData.height !== null &&
            pitFormData.frameSize.width !== null &&
            pitFormData.frameSize.length !== null &&
            pitFormData.driveTrain !== null &&
            pitFormData.driveTrain?.trim() !== '' &&
            validMotors() &&
            validWheels() &&
            validGearRatios() &&
            pitFormData.programmingLanguage !== null &&
            pitFormData.programmingLanguage?.trim() !== '' &&
            pitFormData.startingPosition.x &&
            pitFormData.startingPosition.y !== null &&
            validAbilities() &&
            pitFormData.batteryCount !== null &&
            pitFormData.chargingBatteryCount !== null
        );
    }

    const [updatePitForm] = useMutation(UPDATE_PITFORM, {
        context: {
            headers: {
                imagetype: imgHeader,
            },
        },
        onCompleted() {
            toast({
                title: 'Pit Form Updated',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            if (location.state && location.state.previousRoute && location.state.previousRoute === 'pits') {
                navigate('/pits');
            } else {
                navigate('/');
            }
            setSubmitting(false);
            localStorage.removeItem('PitFormData');
        },
        onError(err) {
            console.log(JSON.stringify(err, null, 2));
            toast({
                title: 'Apollo Error',
                description: 'Pit form could not be updated',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            setSubmitting(false);
        },
    });

    function modifiyClientAbilities(clientAbilities) {
        return clientAbilities.map((ability) => {
            if (ability.type === abilityTypes.ranking) {
                let abilitiesArray = ability.abilities
                    .filter((subAbility) => subAbility.rank > 0)
                    .sort((a, b) => a.rank - b.rank)
                    .map((subAbility) => {
                        if (subAbility?.subType === subAbilityTypes.radio) {
                            return { label: subAbility.label, subType: subAbility.subType, subField: subAbility.subField };
                        } else {
                            return { label: subAbility.label };
                        }
                    });
                return { label: ability.label, type: ability.type, abilities: abilitiesArray };
            } else if (ability.type === abilityTypes.checkbox) {
                let abilitiesArray = ability.abilities
                    .filter((subAbility) => ability.checked.includes(subAbility.label))
                    .map((subAbility) => {
                        if (subAbility?.subType === subAbilityTypes.comment) {
                            return { label: subAbility.label, subType: subAbility.subType, subField: subAbility.subField };
                        } else {
                            return { label: subAbility.label };
                        }
                    });
                return { label: ability.label, type: ability.type, abilities: abilitiesArray };
            } else if (ability.type === abilityTypes.radio) {
                let abilitiesArray = ability.abilities
                    .filter((subAbility) => ability.value === subAbility.label)
                    .map((subAbility) => {
                        if (subAbility?.subType === subAbilityTypes.comment) {
                            return { label: subAbility.label, subType: subAbility.subType, subField: subAbility.subField };
                        } else {
                            return { label: subAbility.label };
                        }
                    });
                return { label: ability.label, type: ability.type, abilities: abilitiesArray };
            } else {
                return null;
            }
        });
    }

    function submit() {
        setSubmitAttempted(true);
        if (!validForm() && !pitFormData.followUp) {
            toast({
                title: 'Missing fields',
                description: 'Fill out all fields, otherwise mark for follow up',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        } else if (pitFormData.followUp && pitFormData.followUpComment.trim() === '') {
            toast({
                title: 'Missing fields',
                description: 'Leave a follow up comment',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        let modifiedMotors = pitFormData.motors.map((motor) => {
            return { label: motor.label, value: motor.value };
        });
        let modifiedWheels = pitFormData.wheels.map((wheel) => {
            return {
                label: wheel.label,
                size: parseFloat(wheel.size),
                value: wheel.value,
            };
        });
        let modifiedGearRatios = pitFormData.gearRatios.map((gearRatio) => {
            return {
                drivingGear: gearRatio.preferRatio ? parseFloat(gearRatio.drivingGear) : -1,
                drivenGear: gearRatio.preferRatio ? parseFloat(gearRatio.drivenGear) : -1,
                freeSpeed: !gearRatio.preferRatio ? parseFloat(gearRatio.freeSpeed) : -1,
                preferRatio: gearRatio.preferRatio,
            };
        });
        let modifiedAutoAbilities = modifiyClientAbilities(pitFormData.autoAbilities);
        let modifiedTeleAbilities = modifiyClientAbilities(pitFormData.teleAbilities);
        setSubmitting(true);
        updatePitForm({
            variables: {
                pitFormInput: {
                    eventKey: eventKeyParam,
                    eventName: eventName,
                    teamNumber: parseInt(teamNumberParam),
                    teamName: teamName,
                    weight: parseFloat(pitFormData.weight),
                    height: parseFloat(pitFormData.height),
                    frameSize: {
                        width: pitFormData.frameSize.width !== null ? parseFloat(pitFormData.frameSize.width) : null,
                        length: pitFormData.frameSize.length !== null ? parseFloat(pitFormData.frameSize.length) : null,
                    },
                    driveTrain: pitFormData.driveTrain === null || pitFormData.driveTrain.trim() === '' ? null : pitFormData.driveTrain.trim(),
                    motors: modifiedMotors,
                    wheels: modifiedWheels,
                    gearRatios: modifiedGearRatios,
                    driveTrainComment: pitFormData.driveTrainComment.trim(),
                    programmingLanguage: pitFormData.programmingLanguage === null || pitFormData.programmingLanguage.trim() === '' ? null : pitFormData.programmingLanguage.trim(),
                    startingPosition: pitFormData.startingPosition,
                    autoAbilities: modifiedAutoAbilities,
                    autoComment: pitFormData.autoComment?.trim(),
                    teleAbilities: modifiedTeleAbilities,
                    batteryCount: parseInt(pitFormData.batteryCount),
                    chargingBatteryCount: parseInt(pitFormData.chargingBatteryCount),
                    workingComment: pitFormData.workingComment.trim(),
                    closingComment: pitFormData.closingComment.trim(),
                    image: pitFormData.image,
                    followUp: pitFormData.followUp,
                    followUpComment: pitFormData.followUp ? pitFormData.followUpComment.trim() : '',
                },
            },
        });
    }

    function getAbilityComponent(abilityContainer, containerIndex, section) {
        switch (abilityContainer.type) {
            case abilityTypes.radio:
                return (
                    <Box key={abilityContainer.id} marginTop={containerIndex !== 0 && '20px'}>
                        <Text marginBottom={'10px'} fontSize={'105%'} marginLeft={'10px'} fontWeight={'600'}>
                            {abilityContainer.label}:
                        </Text>
                        <RadioGroup
                            marginLeft={'15px'}
                            onChange={(value) => {
                                handleRadioAbility(section, containerIndex, value);
                            }}
                            value={abilityContainer.value}
                        >
                            <Stack direction={['column', 'row']}>
                                {abilityContainer.abilities.map((ability) => (
                                    <Radio
                                        w={'max-content'}
                                        isInvalid={submitAttempted && !pitFormData.followUp && abilityContainer.value === null}
                                        _focus={{ outline: 'none' }}
                                        key={ability.id}
                                        colorScheme={'green'}
                                        value={ability.label}
                                    >
                                        {ability.label}
                                    </Radio>
                                ))}
                            </Stack>
                        </RadioGroup>
                    </Box>
                );
            case abilityTypes.checkbox:
                return (
                    <Box key={abilityContainer.id} marginTop={containerIndex !== 0 && '20px'}>
                        <Text marginBottom={'10px'} fontSize={'105%'} marginLeft={'10px'} fontWeight={'600'}>
                            {abilityContainer.label}:
                        </Text>
                        <Flex flexDirection={'row'} marginLeft={'15px'} flexWrap={'wrap'} width={'fit-content'} columnGap={'15px'} rowGap={'0.5rem'}>
                            {abilityContainer.abilities.map((ability) => (
                                <Box key={ability.id} flexGrow={1}>
                                    <Checkbox
                                        //removes the blue outline on focus
                                        css={`
                                            > span:first-of-type {
                                                box-shadow: unset;
                                            }
                                        `}
                                        colorScheme={'green'}
                                        isChecked={abilityContainer.checked.includes(ability.label)}
                                        onChange={() => handleCheckboxAbility(section, containerIndex, ability.label)}
                                    >
                                        {ability.label}
                                    </Checkbox>
                                </Box>
                            ))}
                        </Flex>
                        {abilityContainer.abilities.map(
                            (ability) =>
                                ability.subType === subAbilityTypes.comment &&
                                abilityContainer.checked.includes(ability.label) && (
                                    <Center key={ability.id} marginTop={'20px'}>
                                        <Textarea
                                            _focus={{
                                                outline: 'none',
                                                boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                                            }}
                                            onChange={(event) => {
                                                let newAbilities = JSON.parse(JSON.stringify(pitFormData[section]));
                                                let newInnerAbilities = newAbilities[containerIndex].abilities.map((abilityField) => {
                                                    if (ability.id === abilityField.id) {
                                                        return { ...abilityField, subField: event.target.value };
                                                    }
                                                    return abilityField;
                                                });
                                                newAbilities[containerIndex].abilities = newInnerAbilities;
                                                setPitFormData({ ...pitFormData, [section]: newAbilities });
                                            }}
                                            value={ability.subField}
                                            placeholder={ability.placeHolder}
                                            w={'85%'}
                                            isInvalid={submitAttempted && !pitFormData.followUp && ability.subField.trim() === ''}
                                        ></Textarea>
                                    </Center>
                                )
                        )}
                    </Box>
                );
            case abilityTypes.ranking:
                return (
                    <Box key={abilityContainer.id} marginTop={containerIndex !== 0 && '20px'}>
                        <Text marginBottom={'10px'} fontSize={'105%'} marginLeft={'10px'} fontWeight={'600'}>
                            {abilityContainer.label}:
                        </Text>
                        <Flex width={'fit-content'} flexDirection={'column'} marginLeft={'10px'} rowGap={'10px'}>
                            {[
                                ...abilityContainer.abilities.filter((a) => a.rank > 0).sort((a, b) => a.rank - b.rank),
                                ...abilityContainer.abilities.filter((a) => a.rank < 0).sort((a, b) => b.rank - a.rank),
                            ].map((ability) => (
                                <HStack key={ability.id} spacing={'10px'} id={ability.id} style={ability.style}>
                                    {ability.rank > 0 ? (
                                        <Text fontWeight={'500'} fontSize={'100%'} minWidth={'25px'} textAlign={'center'}>
                                            {ability.rank}.
                                        </Text>
                                    ) : (
                                        <CloseIcon minWidth={'25px'} fontSize={'100%'} color={'red.500'} />
                                    )}
                                    <HStack backgroundColor={swappingElement === ability.id && 'gray.300'} width={'100%'} border={'1px solid black'} borderRadius={'5px'} padding={'5px'}>
                                        <VStack align={'start'} flexGrow={1} spacing={'10px'}>
                                            <Text fontWeight={'500'}>{ability.label}</Text>
                                            {ability.subType === subAbilityTypes.radio && (
                                                <RadioGroup
                                                    onChange={(value) => {
                                                        let newAbilities = JSON.parse(JSON.stringify(pitFormData[section]));
                                                        let newInnerAbilities = newAbilities[containerIndex].abilities.map((abilityField) => {
                                                            if (ability.id === abilityField.id) {
                                                                return { ...abilityField, subField: value };
                                                            }
                                                            return abilityField;
                                                        });
                                                        newAbilities[containerIndex].abilities = newInnerAbilities;
                                                        setPitFormData({ ...pitFormData, [section]: newAbilities });
                                                    }}
                                                    value={ability.subField}
                                                >
                                                    <Stack direction={['column', 'row']}>
                                                        {ability.subFields.map((subField) => (
                                                            <Radio
                                                                w={'fit-content'}
                                                                isInvalid={submitAttempted && !pitFormData.followUp && ability.rank > 0 && ability.subField === null}
                                                                _focus={{ outline: 'none' }}
                                                                key={subField.id}
                                                                colorScheme={'green'}
                                                                value={subField.label}
                                                            >
                                                                {subField.label}
                                                            </Radio>
                                                        ))}
                                                    </Stack>
                                                </RadioGroup>
                                            )}
                                        </VStack>
                                        <Flex columnGap={'10px'}>
                                            <IconButton
                                                cursor={'pointer'}
                                                disabled={ability.rank === 1}
                                                as={ChevronUpIcon}
                                                size={'xs'}
                                                onClick={() => handleIncreaseAbility(section, containerIndex, ability.id, ability.rank)}
                                            />
                                            <IconButton
                                                cursor={'pointer'}
                                                disabled={ability.rank < 0}
                                                as={ChevronDownIcon}
                                                size={'xs'}
                                                onClick={() => handleDecreaseAbility(section, containerIndex, ability.id, ability.rank)}
                                            />
                                        </Flex>
                                    </HStack>
                                </HStack>
                            ))}
                        </Flex>
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
                isOpen={pitFormDialog}
                leastDestructiveRef={cancelRef}
                onClose={() => {
                    setPitFormDialog(false);
                }}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent margin={0} w={{ base: '75%', md: '40%', lg: '30%' }} top='25%'>
                        <AlertDialogHeader color='black' fontSize='lg' fontWeight='bold'>
                            Unsaved Data
                        </AlertDialogHeader>
                        <AlertDialogBody>You have unsaved data for this pit form. Would you like to load it, delete it, or pull data from the cloud?</AlertDialogBody>
                        <AlertDialogFooter>
                            <Button
                                onClick={() => {
                                    setPitFormDialog(false);
                                    setLoadResponse(false);
                                    localStorage.removeItem('PitFormData');
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
                                    setPitFormDialog(false);
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
                                    setPitFormDialog(false);
                                    setLoadResponse(true);
                                    let pitForm = JSON.parse(localStorage.getItem('PitFormData'));
                                    pitForm.loading = false;
                                    setPitFormData(pitForm);
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

    if (loadingPitForm || loadingEvent || (pitFormError && eventError && error !== false) || pitFormData.loading || eventName === null || teamName === null) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Box margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
            <Circle
                backgroundColor={'gray.200'}
                zIndex={2}
                position={'fixed'}
                cursor={'pointer'}
                onClick={onModalOpen}
                bottom={'2%'}
                right={'2%'}
                padding={'10px'}
                borderRadius={'50%'}
                border={'2px solid black'}
            >
                <AddIcon fontSize={'150%'} />
            </Circle>
            <Modal lockFocusAcrossFrames={true} closeOnEsc={true} isOpen={isModalOpen} onClose={onModalClose}>
                <ModalOverlay>
                    <ModalContent margin={0} w={{ base: '75%', md: '40%', lg: '30%' }} top='25%'>
                        <ModalHeader color='black' fontSize='lg' fontWeight='bold'>
                            Write a comment
                        </ModalHeader>
                        <ModalBody maxHeight={'250px'} overflowY={'auto'}>
                            <Textarea
                                _focus={{
                                    outline: 'none',
                                    boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                                }}
                                onChange={(event) => setModalComment(event.target.value)}
                                value={modalComment}
                                placeholder='Comment...'
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                onClick={() => {
                                    onModalClose();
                                    setModalComment('');
                                }}
                                _focus={{ outline: 'none' }}
                            >
                                Cancel
                            </Button>
                            <Button
                                colorScheme='blue'
                                ml={3}
                                _focus={{ outline: 'none' }}
                                onClick={() => {
                                    onModalClose();
                                    if (modalComment.trim() !== '') {
                                        setPitFormData({ ...pitFormData, closingComment: `${pitFormData.closingComment}${pitFormData.closingComment !== '' ? '\n' : ''}${modalComment}` });
                                    }
                                    setModalComment('');
                                }}
                            >
                                Confirm
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </ModalOverlay>
            </Modal>
            <Box boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'} borderRadius={'10px'} padding={'10px'} marginBottom={'30px'}>
                <Text marginBottom={'20px'} fontWeight={'bold'} fontSize={'110%'}>
                    Competition: {eventName}
                </Text>
                <Text marginBottom={'20px'} fontWeight={'bold'} fontSize={'110%'}>
                    Team Number: {teamNumberParam}
                </Text>
                <Text marginBottom={'0px'} fontWeight={'bold'} fontSize={'110%'}>
                    Team Name: {teamName}
                </Text>
            </Box>
            <Box boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'} borderRadius={'10px'} padding={'10px'} marginBottom={'30px'}>
                <Text marginBottom={'20px'} fontWeight={'bold'} fontSize={'110%'}>
                    Weight:
                </Text>
                <NumberInput
                    onChange={(value) => setPitFormData({ ...pitFormData, weight: value })}
                    onBlur={(event) => handleSetWeight(event.target.value)}
                    value={pitFormData.weight || ''}
                    marginLeft={'15px'}
                    min={0}
                    max={125}
                    precision={2}
                    isInvalid={submitAttempted && !pitFormData.followUp && pitFormData.weight === null}
                    width={{ base: '85%', md: '66%', lg: '50%' }}
                >
                    <NumberInputField
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.target.blur();
                            }
                        }}
                        enterKeyHint='done'
                        _focus={{
                            outline: 'none',
                            boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                        }}
                        placeholder='Weight (lbs)'
                    />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
            </Box>
            <Box boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'} borderRadius={'10px'} padding={'10px'} marginBottom={'30px'}>
                <Text marginBottom={'20px'} fontWeight={'bold'} fontSize={'110%'}>
                    Starting Height:
                </Text>
                <NumberInput
                    onChange={(value) => setPitFormData({ ...pitFormData, height: value })}
                    onBlur={(event) => handleSetHeight(event.target.value)}
                    value={pitFormData.height || ''}
                    marginLeft={'15px'}
                    min={0}
                    max={52}
                    precision={2}
                    isInvalid={submitAttempted && !pitFormData.followUp && pitFormData.height === null}
                    width={{ base: '85%', md: '66%', lg: '50%' }}
                >
                    <NumberInputField
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.target.blur();
                            }
                        }}
                        enterKeyHint='done'
                        _focus={{
                            boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                        }}
                        placeholder='Height (in)'
                    />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
            </Box>
            <Box boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'} borderRadius={'10px'} padding={'10px'} marginBottom={'30px'}>
                <Text marginBottom={'20px'} fontWeight={'bold'} fontSize={'110%'}>
                    Frame Size:
                </Text>
                <HStack>
                    <NumberInput
                        onChange={(value) => setPitFormData({ ...pitFormData, frameSize: { ...pitFormData.frameSize, width: value } })}
                        onBlur={(event) => handleSetFrameWidth(event.target.value)}
                        value={pitFormData.frameSize.width || ''}
                        marginLeft={'15px'}
                        min={0}
                        max={200}
                        precision={2}
                        isInvalid={submitAttempted && !pitFormData.followUp && pitFormData.frameSize.width === null}
                        width={{ base: '85%', md: '66%', lg: '50%' }}
                    >
                        <NumberInputField
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.target.blur();
                                }
                            }}
                            enterKeyHint='done'
                            _focus={{
                                boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                            }}
                            placeholder='Width (in)'
                        />
                        <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                        </NumberInputStepper>
                    </NumberInput>
                    <NumberInput
                        onChange={(value) => setPitFormData({ ...pitFormData, frameSize: { ...pitFormData.frameSize, length: value } })}
                        onBlur={(event) => handleSetFrameLength(event.target.value)}
                        value={pitFormData.frameSize.length || ''}
                        marginLeft={'15px'}
                        min={0}
                        max={200}
                        precision={2}
                        isInvalid={submitAttempted && !pitFormData.followUp && pitFormData.frameSize.length === null}
                        width={{ base: '85%', md: '66%', lg: '50%' }}
                    >
                        <NumberInputField
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.target.blur();
                                }
                            }}
                            enterKeyHint='done'
                            _focus={{
                                boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                            }}
                            placeholder='Length (in)'
                        />
                        <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                        </NumberInputStepper>
                    </NumberInput>
                </HStack>
            </Box>
            <Box boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'} borderRadius={'10px'} padding={'10px'} marginBottom={'30px'}>
                <Text marginBottom={'20px'} fontWeight={'bold'} fontSize={'110%'}>
                    Drive Train:
                </Text>
                <Text marginBottom={'10px'} marginLeft={'10px'} fontWeight={'600'} fontSize={'105%'}>
                    Type:
                </Text>
                <RadioGroup
                    marginLeft={'15px'}
                    onChange={(value) => setPitFormData({ ...pitFormData, driveTrain: value === 'Other' ? '' : value })}
                    value={
                        driveTrainsList.slice(0, driveTrainsList.length - 1).find((e) => e.label?.toLowerCase() === pitFormData.driveTrain?.toLowerCase().trim())?.label ??
                        (pitFormData.driveTrain === null ? null : 'Other')
                    }
                >
                    <Stack direction={['column', 'row']}>
                        {driveTrainsList.map((driveTrain) => (
                            <Flex key={driveTrain.id} maxHeight={'24px'} columnGap={'10px'}>
                                <Radio
                                    w={'max-content'}
                                    isInvalid={submitAttempted && !pitFormData.followUp && pitFormData.driveTrain === null}
                                    _focus={{ outline: 'none' }}
                                    colorScheme={'green'}
                                    value={driveTrain.label}
                                >
                                    {driveTrain.label + (driveTrain.label === 'Other' ? ':' : '')}
                                </Radio>
                                {driveTrain.label === 'Other' && (
                                    <Input
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                event.target.blur();
                                            }
                                        }}
                                        enterKeyHint={'done'}
                                        isInvalid={submitAttempted && !pitFormData.followUp && pitFormData.driveTrain === ''}
                                        value={
                                            driveTrainsList.slice(0, driveTrainsList.length - 1).some((e) => e.label?.toLowerCase() === pitFormData.driveTrain?.toLowerCase().trim())
                                                ? ''
                                                : pitFormData.driveTrain ?? ''
                                        }
                                        onChange={(event) => setPitFormData({ ...pitFormData, driveTrain: event.target.value })}
                                        maxHeight={'24px'}
                                        isDisabled={pitFormData.driveTrain === null || driveTrainsList.slice(0, driveTrainsList.length - 1).some((e) => e.label === pitFormData.driveTrain)}
                                        placeholder={'Drive train'}
                                        variant={'flushed'}
                                    ></Input>
                                )}
                            </Flex>
                        ))}
                    </Stack>
                </RadioGroup>
                <HStack pos={'relative'} marginTop={'20px'} marginBottom={'10px'}>
                    <Text marginLeft={'10px'} fontWeight={'600'} fontSize={'105%'}>
                        Motors:
                    </Text>
                    {pitFormData.motors.length > 0 ? (
                        !deletingMotors ? (
                            <DeleteIcon onClick={() => setDeletingMotors(true)} _hover={{ color: 'red' }} cursor={'pointer'} position={'absolute'} right={0}></DeleteIcon>
                        ) : (
                            <CloseIcon onClick={() => setDeletingMotors(false)} _hover={{ color: 'red' }} cursor={'pointer'} position={'absolute'} right={0}></CloseIcon>
                        )
                    ) : null}
                </HStack>
                <VStack>
                    {pitFormData.motors.map((motor) => (
                        <HStack key={motor.id} position={'relative'}>
                            <Button paddingBottom={'4px'} colorScheme={'red'} onClick={() => handleDecrementMotor(motor.label)} _focus={{ outline: 'none' }}>
                                -
                            </Button>
                            <Text
                                textColor={submitAttempted && !pitFormData.followUp && motor.value === 0 ? 'red' : 'black'}
                                textDecoration={deletingMotors ? '3px underline red' : 'none'}
                                cursor={deletingMotors ? 'pointer' : 'default'}
                                onClick={(event) => {
                                    if (deletingMotors) {
                                        handleRemoveMotor(motor.label);
                                    } else {
                                        event.preventDefault();
                                    }
                                }}
                                minW={{
                                    base: '120px',
                                    md: '150px',
                                    lg: '175px',
                                }}
                                textAlign={'center'}
                            >
                                {motor.label}: {motor.value}
                            </Text>
                            <Button paddingBottom={'4px'} maxW={'40px'} colorScheme={'green'} onClick={() => handleIncrementMotor(motor.label)} _focus={{ outline: 'none' }}>
                                +
                            </Button>
                        </HStack>
                    ))}
                </VStack>
                <Center marginTop={pitFormData.motors.length > 0 ? '10px' : '0px'}>
                    <Popover isLazy flip={false} placement='bottom' isOpen={isMotorsOpen} onOpen={onMotorsOpen} onClose={onMotorsClose}>
                        <PopoverTrigger>
                            <Button size={'sm'} _focus={{ outline: 'none' }}>
                                Add Motor
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent maxWidth={'75vw'} _focus={{ outline: 'none' }}>
                            <PopoverArrow />
                            <PopoverCloseButton />
                            <PopoverHeader color='black' fontSize='md' fontWeight='bold'>
                                Choose a motor
                            </PopoverHeader>
                            <PopoverBody maxHeight={'160px'} overflowY={'auto'}>
                                <VStack spacing={'10px'}>
                                    {motorsList
                                        .filter((motor) => !pitFormData.motors.some((secondMotor) => secondMotor.label === motor.label))
                                        .map((motor) => (
                                            <Button
                                                fontSize={'sm'}
                                                _focus={{ outline: 'none' }}
                                                key={motor.id}
                                                onClick={() => {
                                                    handleAddMotor(motor.label);
                                                    onMotorsClose();
                                                }}
                                            >
                                                {motor.label}
                                            </Button>
                                        ))}
                                </VStack>
                            </PopoverBody>
                        </PopoverContent>
                    </Popover>
                </Center>
                <HStack pos={'relative'} marginTop={'20px'} marginBottom={'10px'} fontSize={'105%'}>
                    <Text marginLeft={'10px'} fontWeight={'600'}>
                        Wheels:
                    </Text>
                    {pitFormData.wheels.length > 0 ? (
                        !deletingWheels ? (
                            <DeleteIcon onClick={() => setDeletingWheels(true)} _hover={{ color: 'red' }} cursor={'pointer'} position={'absolute'} right={0}></DeleteIcon>
                        ) : (
                            <CloseIcon onClick={() => setDeletingWheels(false)} _hover={{ color: 'red' }} cursor={'pointer'} position={'absolute'} right={0}></CloseIcon>
                        )
                    ) : null}
                </HStack>
                <VStack>
                    {pitFormData.wheels.map((wheel) => (
                        <Grid key={wheel.id} templateColumns='1fr 2fr 1fr'>
                            <GridItem>
                                <Text
                                    textDecoration={deletingWheels ? '3px underline red' : 'none'}
                                    cursor={deletingWheels ? 'pointer' : 'default'}
                                    onClick={(event) => {
                                        if (deletingWheels) {
                                            handleRemoveWheel(wheel.label);
                                        } else {
                                            event.preventDefault();
                                        }
                                    }}
                                    marginTop='10px'
                                    marginBottom='10px'
                                    fontSize={{
                                        base: '90%',
                                        md: '100%',
                                        lg: '100%',
                                    }}
                                    textAlign={'center'}
                                >
                                    {wheel.label}
                                </Text>
                            </GridItem>
                            <GridItem>
                                <Center>
                                    <NumberInput
                                        onChange={(value) => handleWheelSize(wheel.label, value)}
                                        onBlur={(event) => handleWheelSizeBlur(wheel.label, event.target.value)}
                                        value={wheel.size}
                                        min={0}
                                        max={20}
                                        precision={2}
                                        width={'75%'}
                                        isInvalid={submitAttempted && !pitFormData.followUp && wheel.size === ''}
                                        // fontSize={{ base: '80%', md: '100%', lg: '100%' }}
                                    >
                                        <NumberInputField
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    event.target.blur();
                                                }
                                            }}
                                            enterKeyHint='done'
                                            _focus={{
                                                outline: 'none',
                                                boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                                            }}
                                            textAlign={'center'}
                                            padding={'0px 0px 0px 0px'}
                                            fontSize={{
                                                base: '90%',
                                                md: '100%',
                                                lg: '100%',
                                            }}
                                            placeholder='Size (in)'
                                        />
                                    </NumberInput>
                                </Center>
                            </GridItem>
                            <GridItem>
                                <HStack marginTop='10px' marginBottom='10px'>
                                    <Button paddingBottom={'2px'} size='xs' colorScheme={'red'} onClick={() => handleDecrementWheel(wheel.label)} _focus={{ outline: 'none' }}>
                                        -
                                    </Button>
                                    <Text textColor={submitAttempted && !pitFormData.followUp && wheel.value === 0 ? 'red' : 'black'}>{wheel.value}</Text>
                                    <Button paddingBottom={'2px'} size={'xs'} colorScheme={'green'} onClick={() => handleIncrementWheel(wheel.label)} _focus={{ outline: 'none' }}>
                                        +
                                    </Button>
                                </HStack>
                            </GridItem>
                        </Grid>
                    ))}
                </VStack>
                <Center marginTop={pitFormData.wheels.length > 0 ? '10px' : '0px'}>
                    <Popover isLazy flip={false} placement='bottom' isOpen={isWheelsOpen} onOpen={onWheelsOpen} onClose={onWheelsClose}>
                        <PopoverTrigger>
                            <Button size={'sm'} _focus={{ outline: 'none' }}>
                                Add Wheel
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent maxWidth={'75vw'} _focus={{ outline: 'none' }}>
                            <PopoverArrow />
                            <PopoverCloseButton />
                            <PopoverHeader color='black' fontSize='md' fontWeight='bold'>
                                Choose a wheel
                            </PopoverHeader>
                            <PopoverBody maxHeight={'160px'} overflowY={'auto'}>
                                <VStack spacing={'10px'}>
                                    {wheelsList
                                        .filter((wheel) => !pitFormData.wheels.some((secondWheel) => secondWheel.label === wheel.label))
                                        .map((wheel) => (
                                            <Button
                                                fontSize={'sm'}
                                                _focus={{ outline: 'none' }}
                                                key={wheel.id}
                                                onClick={() => {
                                                    handleAddWheel(wheel.label);
                                                    onWheelsClose();
                                                }}
                                            >
                                                {wheel.label}
                                            </Button>
                                        ))}
                                </VStack>
                            </PopoverBody>
                        </PopoverContent>
                    </Popover>
                </Center>
                <HStack pos={'relative'} marginTop={'20px'} marginBottom={'10px'}>
                    <HStack>
                        <Text marginLeft={'10px'} fontWeight={'600'} fontSize={'105%'}>
                            Gear Ratios/Free Speeds:
                        </Text>
                    </HStack>
                    {pitFormData.gearRatios.length > 0 ? (
                        !deletingGearRatios ? (
                            <DeleteIcon onClick={() => setDeleteGearRatios(true)} _hover={{ color: 'red' }} cursor={'pointer'} position={'absolute'} right={0}></DeleteIcon>
                        ) : (
                            <CloseIcon onClick={() => setDeleteGearRatios(false)} _hover={{ color: 'red' }} cursor={'pointer'} position={'absolute'} right={0}></CloseIcon>
                        )
                    ) : null}
                </HStack>
                <VStack>
                    {pitFormData.gearRatios.map((gearRatio, index) => (
                        <HStack key={gearRatio.id} position='relative'>
                            <Text
                                position='absolute'
                                left={gearRatio.preferRatio ? '10px' : '-10px'}
                                fontSize={{
                                    base: '90%',
                                    md: '100%',
                                    lg: '100%',
                                }}
                            >{`${index + 1}.`}</Text>
                            <Center>
                                {gearRatio.preferRatio ? (
                                    <Fragment>
                                        <NumberInput
                                            onChange={(value) => handleDrivenRatio(gearRatio.id, value)}
                                            onBlur={(event) => handleDrivenRatioBlur(gearRatio.id, event.target.value)}
                                            value={gearRatio.drivenGear}
                                            min={0}
                                            max={100}
                                            precision={2}
                                            width={'33%'}
                                            isInvalid={submitAttempted && !pitFormData.followUp && gearRatio.drivenGear === ''}
                                            // fontSize={{ base: '80%', md: '100%', lg: '100%' }}
                                        >
                                            <NumberInputField
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') {
                                                        event.target.blur();
                                                    }
                                                }}
                                                enterKeyHint='done'
                                                _focus={{
                                                    outline: 'none',
                                                    boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                                                }}
                                                textAlign={'center'}
                                                padding={'0px 0px 0px 0px'}
                                                fontSize={{
                                                    base: '90%',
                                                    md: '100%',
                                                    lg: '100%',
                                                }}
                                                placeholder='Driven Gear'
                                            />
                                        </NumberInput>
                                        <Text
                                            margin={'0 5px 0 5px'}
                                            fontSize={{
                                                base: '90%',
                                                md: '100%',
                                                lg: '100%',
                                            }}
                                        >
                                            :
                                        </Text>
                                        <NumberInput
                                            onChange={(value) => handleDrivingRatio(gearRatio.id, value)}
                                            onBlur={(event) => handleDrivingRatioBlur(gearRatio.id, event.target.value)}
                                            value={gearRatio.drivingGear}
                                            min={0}
                                            max={100}
                                            precision={2}
                                            width={'33%'}
                                            isInvalid={submitAttempted && !pitFormData.followUp && gearRatio.drivingGear === ''}
                                            // fontSize={{ base: '80%', md: '100%', lg: '100%' }}
                                        >
                                            <NumberInputField
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') {
                                                        event.target.blur();
                                                    }
                                                }}
                                                enterKeyHint='done'
                                                _focus={{
                                                    outline: 'none',
                                                    boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                                                }}
                                                textAlign={'center'}
                                                padding={'0px 0px 0px 0px'}
                                                fontSize={{
                                                    base: '90%',
                                                    md: '100%',
                                                    lg: '100%',
                                                }}
                                                placeholder='Driving Gear'
                                            />
                                        </NumberInput>
                                    </Fragment>
                                ) : (
                                    <Fragment>
                                        <NumberInput
                                            onChange={(value) => handleFreeSpeed(gearRatio.id, value)}
                                            onBlur={(event) => handleFreeSpeedBlur(gearRatio.id, event.target.value)}
                                            value={gearRatio.freeSpeed}
                                            min={0}
                                            max={100}
                                            precision={2}
                                            width={'75%'}
                                            isInvalid={submitAttempted && !pitFormData.followUp && gearRatio.freeSpeed === ''}
                                            // fontSize={{ base: '80%', md: '100%', lg: '100%' }}
                                        >
                                            <NumberInputField
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') {
                                                        event.target.blur();
                                                    }
                                                }}
                                                enterKeyHint='done'
                                                _focus={{
                                                    outline: 'none',
                                                    boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                                                }}
                                                textAlign={'center'}
                                                padding={'0px 0px 0px 0px'}
                                                fontSize={{
                                                    base: '90%',
                                                    md: '100%',
                                                    lg: '100%',
                                                }}
                                                placeholder='Free Speed'
                                            />
                                        </NumberInput>
                                    </Fragment>
                                )}
                            </Center>
                            {deletingGearRatios ? (
                                <DeleteIcon
                                    onClick={() => handleRemoveGearRatio(gearRatio.id)}
                                    _hover={{ color: 'red' }}
                                    cursor={'pointer'}
                                    position={'absolute'}
                                    right={gearRatio.preferRatio ? 0 : '-10px'}
                                ></DeleteIcon>
                            ) : (
                                <RepeatIcon
                                    onClick={() => handleGearRatioSwap(gearRatio.id)}
                                    cursor={'pointer'}
                                    _hover={{ color: 'gray' }}
                                    position={'absolute'}
                                    right={gearRatio.preferRatio ? 0 : '-10px'}
                                ></RepeatIcon>
                            )}
                        </HStack>
                    ))}
                </VStack>
                <Center marginTop={pitFormData.gearRatios.length > 0 ? '10px' : '0px'}>
                    <Button size={'sm'} _focus={{ outline: 'none' }} onClick={() => handleAddGearRatio()}>
                        Add Ratio/Speed
                    </Button>
                </Center>
                <Center marginTop={'20px'}>
                    <Textarea
                        _focus={{
                            outline: 'none',
                            boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                        }}
                        onChange={(event) => setPitFormData({ ...pitFormData, driveTrainComment: event.target.value })}
                        value={pitFormData.driveTrainComment}
                        placeholder='Any additional comments about drive train'
                        w={'85%'}
                    ></Textarea>
                </Center>
            </Box>
            <Box boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'} borderRadius={'10px'} padding={'10px'} marginBottom={'30px'}>
                <Text marginBottom={'20px'} fontWeight={'bold'} fontSize={'110%'}>
                    Autonomous:
                </Text>
                <Text marginBottom={'10px'} marginLeft={'10px'} fontWeight={'600'} fontSize={'105%'}>
                    Programming Language:
                </Text>
                <RadioGroup
                    marginLeft={'15px'}
                    onChange={(value) => setPitFormData({ ...pitFormData, programmingLanguage: value === 'Other' ? '' : value })}
                    value={
                        programmingLanguagesList.slice(0, programmingLanguagesList.length - 1).find((e) => e.label?.toLowerCase() === pitFormData.programmingLanguage?.toLowerCase().trim())?.label ??
                        (pitFormData.programmingLanguage === null ? null : 'Other')
                    }
                >
                    <Stack direction={['column', 'row']}>
                        {programmingLanguagesList.map((programmingLanguage) => (
                            <Flex key={programmingLanguage.id} maxHeight={'24px'} columnGap={'10px'}>
                                <Radio
                                    w={'max-content'}
                                    isInvalid={submitAttempted && !pitFormData.followUp && pitFormData.programmingLanguage === null}
                                    _focus={{ outline: 'none' }}
                                    colorScheme={'green'}
                                    value={programmingLanguage.label}
                                >
                                    {programmingLanguage.label + (programmingLanguage.label === 'Other' ? ':' : '')}
                                </Radio>
                                {programmingLanguage.label === 'Other' && (
                                    <Input
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                event.target.blur();
                                            }
                                        }}
                                        enterKeyHint={'done'}
                                        isInvalid={submitAttempted && !pitFormData.followUp && pitFormData.programmingLanguage === ''}
                                        value={
                                            programmingLanguagesList
                                                .slice(0, programmingLanguagesList.length - 1)
                                                .some((e) => e.label?.toLowerCase() === pitFormData.programmingLanguage?.toLowerCase().trim())
                                                ? ''
                                                : pitFormData.programmingLanguage ?? ''
                                        }
                                        onChange={(event) => setPitFormData({ ...pitFormData, programmingLanguage: event.target.value })}
                                        maxHeight={'24px'}
                                        isDisabled={
                                            pitFormData.programmingLanguage === null ||
                                            programmingLanguagesList.slice(0, programmingLanguagesList.length - 1).some((e) => e.label === pitFormData.programmingLanguage)
                                        }
                                        placeholder={'Programming language'}
                                        variant={'flushed'}
                                    ></Input>
                                )}
                            </Flex>
                        ))}
                    </Stack>
                </RadioGroup>
                <Text marginTop={'20px'} marginBottom={'10px'} marginLeft={'10px'} fontWeight={'600'} fontSize={'105%'}>
                    Prefered Starting Position:
                </Text>
                <Center marginBottom={'25px'}>
                    {!initialDrawn && <Spinner pos={'absolute'} zIndex={-1}></Spinner>}
                    <canvas
                        width={imageWidth * calculateImageScale(imageWidth)}
                        height={imageHeight * calculateImageScale(imageWidth)}
                        style={{
                            zIndex: 2,
                            outline: pitFormData.startingPosition.x === null && submitAttempted && !pitFormData.followUp ? '4px solid red' : 'none',
                            cursor: 'pointer',
                        }}
                        onClick={(event) => {
                            let dimensions = getCanvasDimensions(0);
                            let width = dimensions.width;
                            let height = dimensions.height;
                            let bounds = event.target.getBoundingClientRect();
                            let x = event.clientX - bounds.left;
                            let y = event.clientY - bounds.top;
                            let scale = calculateImageScale(imageWidth);
                            let pointX = (x - (width / 2) * scale) * Math.cos(2 * Math.PI) - (y - (height / 2) * scale) * Math.sin(2 * Math.PI) + (imageWidth / 2) * scale;
                            let pointY = (x - (width / 2) * scale) * Math.sin(2 * Math.PI) + (y - (height / 2) * scale) * Math.cos(2 * Math.PI) + (imageHeight / 2) * scale;
                            let ctx = offSideCanvas.current.getContext('2d');
                            let p = ctx.getImageData(pointX / scale, pointY / scale, 1, 1).data;
                            if (p[3] !== 0) {
                                //transparent pixel
                                setPitFormData({
                                    ...pitFormData,
                                    startingPosition: { x: pointX / scale, y: pointY / scale },
                                });
                            }
                        }}
                        ref={mainCanvas}
                    ></canvas>
                    <canvas
                        style={{ position: 'absolute', zIndex: 1 }}
                        width={imageWidth * calculateImageScale(imageWidth)}
                        height={imageHeight * calculateImageScale(imageWidth)}
                        ref={secondCanvas}
                    ></canvas>
                </Center>
                {pitFormData.autoAbilities.map((abilityContainer, containerIndex) => getAbilityComponent(abilityContainer, containerIndex, 'autoAbilities'))}
                <Center marginTop={'20px'}>
                    <Textarea
                        _focus={{
                            outline: 'none',
                            boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                        }}
                        onChange={(event) => setPitFormData({ ...pitFormData, autoComment: event.target.value })}
                        value={pitFormData.autoComment}
                        placeholder="Most effective strategy in auto? (Even if that's just mobility)"
                        w={'85%'}
                    ></Textarea>
                </Center>
            </Box>
            <Box boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'} borderRadius={'10px'} padding={'10px'} marginBottom={'30px'}>
                <Text marginBottom={'20px'} fontWeight={'bold'} fontSize={'110%'}>
                    Abilities:
                </Text>
                {pitFormData.teleAbilities.map((abilityContainer, containerIndex) => getAbilityComponent(abilityContainer, containerIndex, 'teleAbilities'))}
            </Box>
            <Box boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'} borderRadius={'10px'} padding={'10px'} marginBottom={'20px'}>
                <Text marginBottom={'20px'} fontWeight={'bold'} fontSize={'110%'}>
                    Closing:
                </Text>
                <Text marginLeft={'10px'} marginBottom={'10px'} fontSize={'105%'} fontWeight={'600'}>
                    Total Batteries:
                </Text>
                <NumberInput
                    marginBottom={'20px'}
                    onChange={(value) => setPitFormData({ ...pitFormData, batteryCount: value })}
                    onBlur={(event) => handleSetBatteryCount(event.target.value)}
                    value={pitFormData.batteryCount || ''}
                    marginLeft={'15px'}
                    min={0}
                    max={50}
                    precision={0}
                    isInvalid={submitAttempted && !pitFormData.followUp && pitFormData.batteryCount === null}
                    width={{ base: '85%', md: '66%', lg: '50%' }}
                >
                    <NumberInputField
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.target.blur();
                            }
                        }}
                        enterKeyHint='done'
                        _focus={{
                            outline: 'none',
                            boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                        }}
                        placeholder='# of Batteries'
                    />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
                <Text marginLeft={'10px'} marginBottom={'10px'} fontSize={'105%'} fontWeight={'600'}>
                    Batteries Charging:
                </Text>
                <NumberInput
                    marginBottom={'20px'}
                    onChange={(value) => setPitFormData({ ...pitFormData, chargingBatteryCount: value })}
                    onBlur={(event) => handleSetChargingBatteryCount(event.target.value)}
                    value={pitFormData.chargingBatteryCount || ''}
                    marginLeft={'15px'}
                    min={0}
                    max={50}
                    precision={0}
                    isInvalid={submitAttempted && !pitFormData.followUp && pitFormData.chargingBatteryCount === null}
                    width={{ base: '85%', md: '66%', lg: '50%' }}
                >
                    <NumberInputField
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.target.blur();
                            }
                        }}
                        enterKeyHint='done'
                        _focus={{
                            outline: 'none',
                            boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                        }}
                        placeholder='# of Batteries Charging'
                    />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
                <Center>
                    <Textarea
                        _focus={{
                            outline: 'none',
                            boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                        }}
                        onChange={(event) => setPitFormData({ ...pitFormData, workingComment: event.target.value })}
                        value={pitFormData.workingComment}
                        placeholder='Is there anything your team is struggling with?'
                        w={'85%'}
                    ></Textarea>
                </Center>
                <Center marginTop={'20px'}>
                    <Textarea
                        _focus={{
                            outline: 'none',
                            boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                        }}
                        onChange={(event) => setPitFormData({ ...pitFormData, closingComment: event.target.value })}
                        value={pitFormData.closingComment}
                        placeholder='Any additional comments'
                        w={'85%'}
                    ></Textarea>
                </Center>
                <VStack marginTop={'20px'}>
                    <ChakraImage w={{ base: '60%', md: '35%', lg: '35%' }} maxW={{ base: '60%', md: '35%', lg: '35%' }} src={pitFormData.image} />
                    <input type='file' accept='image/*' style={{ display: 'none' }} ref={hiddenImageInput} onChange={(event) => updateImage(event)} />
                    <Button variant='outline' borderColor='gray.300' _focus={{ outline: 'none' }} onClick={() => hiddenImageInput.current.click()}>
                        Upload Image
                    </Button>
                </VStack>
                <Center>
                    <Checkbox
                        marginTop={'20px'}
                        //removes the blue outline on focus
                        css={`
                            > span:first-of-type {
                                box-shadow: unset;
                            }
                        `}
                        colorScheme={'green'}
                        isChecked={pitFormData.followUp}
                        onChange={() => setPitFormData({ ...pitFormData, followUp: !pitFormData.followUp })}
                    >
                        Mark For Follow Up
                    </Checkbox>
                </Center>
                {pitFormData.followUp ? (
                    <Center marginTop={'10px'}>
                        <Textarea
                            isInvalid={pitFormData.followUp && submitAttempted && pitFormData.followUpComment.trim() === ''}
                            _focus={{
                                outline: 'none',
                                boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                            }}
                            onChange={(event) => setPitFormData({ ...pitFormData, followUpComment: event.target.value })}
                            value={pitFormData.followUpComment}
                            placeholder='What is the reason for the follow up?'
                            w={'85%'}
                        ></Textarea>
                    </Center>
                ) : null}
            </Box>
            <Center>
                <Button isDisabled={submitting} _focus={{ outline: 'none' }} marginBottom={'25px'} onClick={() => submit()}>
                    Submit
                </Button>
            </Center>
        </Box>
    );
}

export default PitForm;

function twoPrecision(value) {
    return (Math.round(value * 100) / 100).toFixed(2);
}

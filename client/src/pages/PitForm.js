import { React, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    Text,
    Textarea,
    Checkbox,
    Button,
    Center,
    VStack,
    Radio,
    RadioGroup,
    NumberInput,
    NumberInputField,
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
    IconButton
} from '@chakra-ui/react';
import { AddIcon, CloseIcon, DeleteIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { v4 as uuidv4 } from 'uuid';
import PreAutoBlueField from '../images/PreAutoBlueField.png';
import { deepEqual, getValueByRange } from '../util/helperFunctions';
import { GlobalContext } from '../context/globalState';

let driveTrainsList = [
    { label: 'Swerve', id: uuidv4() },
    { label: 'Tank', id: uuidv4() },
    { label: 'Mecanum', id: uuidv4() },
    { label: 'H-Drive', id: uuidv4() },
    { label: 'Other', id: uuidv4() }
];
let motorsList = [
    { label: 'Kraken X60', id: uuidv4() },
    { label: 'NEO Vortex', id: uuidv4() },
    { label: 'Falcon 500', id: uuidv4() },
    { label: 'NEO', id: uuidv4() },
    { label: 'CIM', id: uuidv4() },
    { label: 'Mini-CIM', id: uuidv4() },
    { label: 'NEO 550', id: uuidv4() },
    { label: '775 Pro', id: uuidv4() }
];
// let wheelsList = [
//     { label: 'Traction', id: uuidv4() },
//     { label: 'Omni', id: uuidv4() },
//     { label: 'Colson', id: uuidv4() },
//     { label: 'Pneumatic', id: uuidv4() },
//     { label: 'Mecanum', id: uuidv4() }
// ];
let programmingLanguagesList = [
    { label: 'Java', id: uuidv4() },
    { label: 'C++', id: uuidv4() },
    { label: 'LabVIEW', id: uuidv4() },
    { label: 'Other', id: uuidv4() }
];
let abilityTypes = {
    ranking: 'ranking',
    checkbox: 'checkbox',
    radio: 'radio'
};
let subAbilityTypes = {
    radio: 'radio',
    comment: 'comment'
};
let startingPositions = [
    [28, 35, uuidv4()],
    [60, 118, uuidv4()],
    [28, 200, uuidv4()],
    [28, 300, uuidv4()]
];
let imageWidth = 435;
let imageHeight = 435;

function PitForm() {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    const { eventKey: eventKeyParam, teamNumber: teamNumberParam } = useParams();
    const { offline } = useContext(GlobalContext);

    const hiddenImageInput = useRef(null);
    const cancelRef = useRef();

    const [error, setError] = useState(null);
    const [pitFormDialog, setPitFormDialog] = useState(false);
    const [loadResponse, setLoadResponse] = useState(null);
    const [imgHeader, setImgHeader] = useState('Same Image');
    const [pitFormData, setPitFormData] = useState({
        weight: null,
        height: null,
        frameSize: { width: null, length: null },
        driveTrain: null,
        motors: [],
        driveTrainComment: '',
        programmingLanguage: null,
        startingPosition: null,
        autoAbilities: [
            {
                label: 'Leave (Fully Exit Starting Zone)',
                type: abilityTypes.radio,
                abilities: [
                    { label: 'Yes', id: uuidv4() },
                    { label: 'No', id: uuidv4() }
                ],
                value: null,
                id: uuidv4()
            }
        ],
        autoComment: '',
        teleAbilities: [
            {
                label: 'Storage',
                type: abilityTypes.checkbox,
                abilities: [{ label: 'Hold a note', id: uuidv4() }],
                checked: [],
                id: uuidv4()
            },
            {
                label: 'Note Intake',
                type: abilityTypes.checkbox,
                abilities: [
                    { label: 'Pick up from  the ground', id: uuidv4() },
                    { label: 'Retrieve from the source', id: uuidv4() }
                ],
                checked: [],
                id: uuidv4()
            },
            {
                label: 'Note Scoring',
                type: abilityTypes.checkbox,
                abilities: [
                    { label: 'Speaker', id: uuidv4() },
                    { label: 'Amp', id: uuidv4() },
                    { label: 'Ferry', id: uuidv4() }
                ],
                checked: [],
                id: uuidv4()
            },
            {
                label: 'Stage',
                type: abilityTypes.checkbox,
                abilities: [
                    { label: 'Onstage (Hang on chain)', id: uuidv4() },
                    { label: 'Harmony', id: uuidv4() },
                    { label: 'Trap', id: uuidv4() }
                ],
                checked: [],
                id: uuidv4()
            }
        ],
        batteryCount: null,
        chargingBatteryCount: null,
        workingComment: '',
        closingComment: '',
        image: '',
        followUp: false,
        followUpComment: '',
        loading: true
    });
    const prevPitFormData = useRef(null);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
    const [modalComment, setModalComment] = useState('');
    const { isOpen: isMotorsOpen, onOpen: onMotorsOpen, onClose: onMotorsClose } = useDisclosure();
    const [deletingMotors, setDeletingMotors] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [swapDone, setSwapDone] = useState(true);
    const [swappingElement, setSwappingElement] = useState(null);
    const [dimensionRatios, setDimensionRatios] = useState(null);
    const [whitespace, setWhitespace] = useState(null);
    const [preAutoImageSrc, setPreAutoImageSrc] = useState(null);

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
        if (loadResponse === false && pitFormData.loading) {
            if (offline) {
                setPitFormData({ ...pitFormData, loading: false });
            } else {
                const headers = {
                    filters: JSON.stringify({
                        eventKey: eventKeyParam,
                        teamNumber: parseInt(teamNumberParam)
                    })
                };
                fetch('/pitForm/getPitForm', {
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
                        let pitForm = data;
                        if (!pitForm) {
                            setPitFormData({ ...pitFormData, loading: false });
                            return;
                        }
                        let modifiedMotors = pitForm.motors.map((motor) => {
                            return {
                                label: motor.label,
                                value: motor.value,
                                id: uuidv4()
                            };
                        });
                        let modifiedAutoAbilities = modifyDataBaseAbilities(pitFormData.autoAbilities, pitForm.autoAbilities);
                        let modifiedTeleAbilities = modifyDataBaseAbilities(pitFormData.teleAbilities, pitForm.teleAbilities);
                        let modifiedData = {
                            ...pitForm,
                            motors: modifiedMotors,
                            autoAbilities: modifiedAutoAbilities,
                            teleAbilities: modifiedTeleAbilities,
                            loading: false
                        };
                        setPitFormData(modifiedData);
                    })
                    .catch((error) => setError(error.message));
            }
        }
    }, [loadResponse, pitFormData, eventKeyParam, teamNumberParam, offline]);

    useEffect(() => {
        if (prevPitFormData.current !== null) {
            if (!deepEqual(prevPitFormData.current, pitFormData)) {
                localStorage.setItem('PitFormData', JSON.stringify({ ...pitFormData, eventKeyParam, teamNumberParam }));
            }
        }
        if (pitFormData.loading === false) {
            prevPitFormData.current = JSON.parse(JSON.stringify(pitFormData));
        }
    }, [pitFormData, eventKeyParam, teamNumberParam]);

    function getImageVariables() {
        const viewportWidth = window.innerWidth;
        // const viewportHeight = window.innerHeight;

        // Calculate image dimensions based on screen size
        const maxWidth = viewportWidth * getValueByRange(viewportWidth); // Adjust the multiplier as needed
        const maxHeight = imageHeight;

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

        setDimensionRatios({ width: scaledWidth / imageWidth, height: scaledHeight / imageHeight });
    }

    useEffect(() => {
        const preAutoImg = new Image();
        preAutoImg.src = PreAutoBlueField;

        preAutoImg.onload = () => {
            setPreAutoImageSrc(preAutoImg.src);
        };

        getImageVariables();
        window.addEventListener('resize', getImageVariables);

        return () => window.removeEventListener('resize', getImageVariables);
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
                id: uuidv4()
            }
        ];
        setPitFormData({
            ...pitFormData,
            motors: newMotors
        });
    }

    function handleRemoveMotor(motorName) {
        let newMotors = [...pitFormData.motors].filter((motor) => motor.label !== motorName);
        setPitFormData({
            ...pitFormData,
            motors: newMotors
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
                    value: motor.value === 0 ? 0 : motor.value - 1
                };
            } else {
                return motor;
            }
        });
        setPitFormData({
            ...pitFormData,
            motors: newMotors
        });
    }

    function handleIncrementMotor(motorLabel) {
        let newMotors = pitFormData.motors.map((motor) => {
            if (motorLabel === motor.label) {
                return {
                    ...motor,
                    value: motor.value + 1
                };
            } else {
                return motor;
            }
        });
        setPitFormData({
            ...pitFormData,
            motors: newMotors
        });
    }

    function swapElements(classNameA, classNameB, abilities = null) {
        let elementA = document.getElementById(classNameA);
        let elementB = document.getElementById(classNameB);

        const finalElementAStyle = {
            x: null,
            y: null
        };
        const finalElementBStyle = {
            x: null,
            y: null
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
                [classNameB]: `translate(${finalElementBStyle.x}px, ${finalElementBStyle.y}px)`
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
            [classNameB]: `translate(${finalElementBStyle.x}px, ${finalElementBStyle.y - adjustmentB}px)`
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
                        transform: translations[ability.id]
                    };
                    if (ability.id === abilityId) {
                        ability.style.zIndex = 3;
                    } else {
                        ability.style.zIndex = 2;
                    }
                } else {
                    ability.style = {
                        zIndex: 1
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
                        transform: translations[ability.id]
                    };
                    if (ability.id === abilityId) {
                        ability.style.zIndex = 3;
                    } else {
                        ability.style.zIndex = 2;
                    }
                } else {
                    ability.style = {
                        zIndex: 1
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
                [section]: newAbilities
            });
        } else {
            let newAbilities = JSON.parse(JSON.stringify(pitFormData[section]));
            newAbilities[containerIndex].checked.push(abilityLabel);
            setPitFormData({
                ...pitFormData,
                [section]: newAbilities
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

    function validMotors() {
        for (const motor of pitFormData.motors) {
            if (motor.value === 0) {
                return false;
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

    function validForm() {
        return (
            pitFormData.weight !== null &&
            pitFormData.height !== null &&
            pitFormData.frameSize.width !== null &&
            pitFormData.frameSize.length !== null &&
            pitFormData.driveTrain !== null &&
            pitFormData.driveTrain?.trim() !== '' &&
            validMotors() &&
            pitFormData.programmingLanguage !== null &&
            pitFormData.programmingLanguage?.trim() !== '' &&
            pitFormData.startingPosition !== null &&
            validAbilities() &&
            pitFormData.batteryCount !== null &&
            pitFormData.chargingBatteryCount !== null
        );
    }

    function submit() {
        setSubmitAttempted(true);
        if (!validForm() && !pitFormData.followUp) {
            toast({
                title: 'Missing fields',
                description: 'Fill out all fields, otherwise mark for follow up',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
            return;
        } else if (pitFormData.followUp && pitFormData.followUpComment.trim() === '') {
            toast({
                title: 'Missing fields',
                description: 'Leave a follow up comment',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
            return;
        }
        let modifiedMotors = pitFormData.motors.map((motor) => {
            return { label: motor.label, value: motor.value };
        });
        setSubmitting(true);
        fetch('/pitForm/postPitForm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', imageType: imgHeader },
            body: JSON.stringify({
                ...pitFormData,
                eventKey: eventKeyParam,
                teamNumber: parseInt(teamNumberParam),
                weight: parseFloat(pitFormData.weight),
                height: parseFloat(pitFormData.height),
                frameSize: {
                    width: pitFormData.frameSize.width !== null ? parseFloat(pitFormData.frameSize.width) : null,
                    length: pitFormData.frameSize.length !== null ? parseFloat(pitFormData.frameSize.length) : null
                },
                driveTrain: pitFormData.driveTrain === null || pitFormData.driveTrain.trim() === '' ? null : pitFormData.driveTrain.trim(),
                motors: modifiedMotors,
                driveTrainComment: pitFormData.driveTrainComment.trim(),
                programmingLanguage: pitFormData.programmingLanguage === null || pitFormData.programmingLanguage.trim() === '' ? null : pitFormData.programmingLanguage.trim(),
                autoAbilities: modifiyClientAbilities(pitFormData.autoAbilities),
                autoComment: pitFormData.autoComment?.trim(),
                teleAbilities: modifiyClientAbilities(pitFormData.teleAbilities),
                batteryCount: parseInt(pitFormData.batteryCount),
                chargingBatteryCount: parseInt(pitFormData.chargingBatteryCount),
                workingComment: pitFormData.workingComment.trim(),
                closingComment: pitFormData.closingComment.trim(),
                followUpComment: pitFormData.followUp ? pitFormData.followUpComment.trim() : ''
            })
        })
            .then((response) => {
                if (response.status === 200) {
                    toast({
                        title: 'Pit Form Updated',
                        status: 'success',
                        duration: 3000,
                        isClosable: true
                    });
                    if (location.state && location.state.previousRoute && location.state.previousRoute === 'pits') {
                        navigate('/pits');
                    } else {
                        navigate('/');
                    }
                    setSubmitting(false);
                    localStorage.removeItem('PitFormData');
                } else {
                    throw new Error(response.statusText);
                }
            })
            .catch((error) => {
                console.log(error);
                toast({
                    title: 'Apollo Error',
                    description: 'Pit form could not be updated',
                    status: 'error',
                    duration: 3000,
                    isClosable: true
                });
                setSubmitting(false);
            });
    }

    function getAbilityComponent(abilityContainer, containerIndex, section) {
        switch (abilityContainer.type) {
            case abilityTypes.radio:
                return (
                    <Box key={abilityContainer.id}>
                        <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'} marginBottom={'5px'} marginTop={containerIndex !== 0 && '10px'}>
                            {abilityContainer.label}
                        </Text>
                        <RadioGroup
                            onChange={(value) => {
                                handleRadioAbility(section, containerIndex, value);
                            }}
                            value={abilityContainer.value}
                        >
                            <Flex flexWrap={'wrap'} rowGap={'5px'} columnGap={'2px'} justifyContent={'space-evenly'}>
                                {abilityContainer.abilities.map((ability) => (
                                    <Radio isInvalid={submitAttempted && !pitFormData.followUp && abilityContainer.value === null} key={ability.id} colorScheme={'green'} value={ability.label}>
                                        {ability.label}
                                    </Radio>
                                ))}
                            </Flex>
                        </RadioGroup>
                    </Box>
                );
            case abilityTypes.checkbox:
                return (
                    <Box key={abilityContainer.id}>
                        <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'} marginBottom={'5px'} marginTop={containerIndex !== 0 && '10px'}>
                            {abilityContainer.label}
                        </Text>
                        <Flex flexWrap={'wrap'} rowGap={'5px'} columnGap={'25px'} justifyContent={'center'}>
                            {abilityContainer.abilities.map((ability) => (
                                <Box key={ability.id}>
                                    <Checkbox
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
            // If I ever use this make sure to adjust margins, fontSize, etc.
            case abilityTypes.ranking:
                return (
                    <Box key={abilityContainer.id} marginTop={containerIndex !== 0 && '20px'}>
                        <Text marginBottom={'10px'} fontSize={'105%'} marginLeft={'10px'} fontWeight={'600'}>
                            {abilityContainer.label}:
                        </Text>
                        <Flex width={'fit-content'} flexDirection={'column'} marginLeft={'10px'} rowGap={'10px'}>
                            {[
                                ...abilityContainer.abilities.filter((a) => a.rank > 0).sort((a, b) => a.rank - b.rank),
                                ...abilityContainer.abilities.filter((a) => a.rank < 0).sort((a, b) => b.rank - a.rank)
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
                isOpen={pitFormDialog}
                leastDestructiveRef={cancelRef}
                onClose={() => {
                    setPitFormDialog(false);
                }}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent width={{ base: '75%', md: '40%', lg: '30%' }} marginTop={'25dvh'}>
                        <AlertDialogHeader fontSize={'lg'} fontWeight={'semibold'}>
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
                                colorScheme='red'
                            >
                                Delete
                            </Button>
                            {!offline && (
                                <Button
                                    colorScheme='yellow'
                                    ml={3}
                                    onClick={() => {
                                        setPitFormDialog(false);
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

    if (pitFormData.loading || whitespace === null || dimensionRatios === null) {
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
                <AddIcon textColor={'black'} fontSize={'xl'} />
            </Circle>
            <Modal closeOnEsc={true} isOpen={isModalOpen} onClose={onModalClose}>
                <ModalOverlay>
                    <ModalContent w={{ base: '75%', md: '40%', lg: '30%' }}>
                        <ModalHeader fontSize={'lg'} fontWeight={'semibold'}>
                            Write a comment
                        </ModalHeader>
                        <ModalBody maxHeight={'150px'} overflowY={'auto'}>
                            <Textarea onChange={(event) => setModalComment(event.target.value)} value={modalComment} placeholder='Comment...' />
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                onClick={() => {
                                    onModalClose();
                                    setModalComment('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                colorScheme='blue'
                                ml={3}
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
            <Text fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'}>
                Team Number: {teamNumberParam}
            </Text>
            <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginTop={'15px'} marginBottom={'5px'}>
                Weight
            </Text>
            <NumberInput
                onChange={(value) => setPitFormData({ ...pitFormData, weight: value })}
                onBlur={(event) => handleSetWeight(event.target.value)}
                value={pitFormData.weight || ''}
                min={0}
                max={125}
                precision={2}
                isInvalid={submitAttempted && !pitFormData.followUp && pitFormData.weight === null}
                width={{ base: '85%', md: '66%', lg: '50%' }}
                margin={'0 auto'}
            >
                <NumberInputField
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === 'Escape') {
                            event.target.blur();
                        }
                    }}
                    enterKeyHint='done'
                    placeholder='Weight (lbs)'
                    textAlign={'center'}
                />
            </NumberInput>
            <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginBottom={'5px'} marginTop={'15px'}>
                Starting Height
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
                margin={'0 auto'}
            >
                <NumberInputField
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === 'Escape') {
                            event.target.blur();
                        }
                    }}
                    enterKeyHint='done'
                    placeholder='Height (in)'
                    textAlign={'center'}
                />
            </NumberInput>
            <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginBottom={'5px'} marginTop={'15px'}>
                Frame Size
            </Text>
            <HStack gap={'0px'}>
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
                            if (event.key === 'Enter' || event.key === 'Escape') {
                                event.target.blur();
                            }
                        }}
                        enterKeyHint='done'
                        placeholder='Width (in)'
                        textAlign={'center'}
                    />
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
                            if (event.key === 'Enter' || event.key === 'Escape') {
                                event.target.blur();
                            }
                        }}
                        enterKeyHint='done'
                        placeholder='Length (in)'
                        textAlign={'center'}
                    />
                </NumberInput>
            </HStack>
            <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginBottom={'5px'} marginTop={'15px'}>
                Drive
            </Text>
            <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'} marginBottom={'5px'} marginTop={'0px'}>
                Type
            </Text>
            <RadioGroup
                onChange={(value) => setPitFormData({ ...pitFormData, driveTrain: value === 'Other' ? '' : value })}
                value={
                    driveTrainsList.slice(0, driveTrainsList.length - 1).find((e) => e.label?.toLowerCase() === pitFormData.driveTrain?.toLowerCase().trim())?.label ??
                    (pitFormData.driveTrain === null ? null : 'Other')
                }
            >
                <Flex flexWrap={'wrap'} rowGap={'5px'} columnGap={'2px'} justifyContent={'space-around'}>
                    {driveTrainsList.map((driveTrain) => (
                        <Flex key={driveTrain.id}>
                            <Radio isInvalid={submitAttempted && !pitFormData.followUp && pitFormData.driveTrain === null} colorScheme={'green'} value={driveTrain.label}>
                                {driveTrain.label + (driveTrain.label === 'Other' ? ':' : '')}
                            </Radio>
                            {driveTrain.label === 'Other' && (
                                <Input
                                    marginLeft={'5px'}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === 'Escape') {
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
                                    isDisabled={pitFormData.driveTrain === null || driveTrainsList.slice(0, driveTrainsList.length - 1).some((e) => e.label === pitFormData.driveTrain)}
                                    placeholder={'Drive train'}
                                    variant={'flushed'}
                                    width={'90px'}
                                ></Input>
                            )}
                        </Flex>
                    ))}
                </Flex>
            </RadioGroup>
            <HStack gap={'0px'} pos={'relative'} marginBottom={'5px'} marginTop={'10px'} justifyContent={'center'}>
                <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'}>
                    Motors (Drive Only!)
                </Text>
                {pitFormData.motors.length > 0 ? (
                    !deletingMotors ? (
                        <DeleteIcon onClick={() => setDeletingMotors(true)} _hover={{ color: 'red' }} cursor={'pointer'} position={'absolute'} right={0}></DeleteIcon>
                    ) : (
                        <CloseIcon onClick={() => setDeletingMotors(false)} _hover={{ color: 'red' }} cursor={'pointer'} position={'absolute'} right={0}></CloseIcon>
                    )
                ) : null}
            </HStack>
            <VStack gap={'8px'}>
                {pitFormData.motors.map((motor) => (
                    <HStack key={motor.id} position={'relative'} gap={'5px'}>
                        <Button paddingBottom={'4px'} colorScheme={'red'} onClick={() => handleDecrementMotor(motor.label)}>
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
                                lg: '175px'
                            }}
                            textAlign={'center'}
                        >
                            {motor.label}: {motor.value}
                        </Text>
                        <Button paddingBottom={'4px'} maxW={'40px'} colorScheme={'green'} onClick={() => handleIncrementMotor(motor.label)}>
                            +
                        </Button>
                    </HStack>
                ))}
            </VStack>
            <Center marginTop={pitFormData.motors.length > 0 ? '10px' : '5px'}>
                <Popover isLazy flip={false} placement='bottom' isOpen={isMotorsOpen} onOpen={onMotorsOpen} onClose={onMotorsClose}>
                    <PopoverTrigger>
                        <Button>Add Motor</Button>
                    </PopoverTrigger>
                    <PopoverContent maxWidth={'75vw'}>
                        <PopoverArrow />
                        <PopoverCloseButton />
                        <PopoverHeader fontSize={'md'} fontWeight={'medium'}>
                            Choose a motor
                        </PopoverHeader>
                        <PopoverBody maxHeight={'160px'} overflowY={'auto'}>
                            <VStack gap={'10px'}>
                                {motorsList
                                    .filter((motor) => !pitFormData.motors.some((secondMotor) => secondMotor.label === motor.label))
                                    .map((motor) => (
                                        <Button
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
            <Center marginTop={'15px'}>
                <Textarea
                    onChange={(event) => setPitFormData({ ...pitFormData, driveTrainComment: event.target.value })}
                    value={pitFormData.driveTrainComment}
                    placeholder='Any additional comments about drive train'
                    width={'85%'}
                />
            </Center>
            <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginBottom={'5px'} marginTop={'15px'}>
                Autonomous
            </Text>
            <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'} marginBottom={'5px'} marginTop={'0px'}>
                Programming Language
            </Text>
            <RadioGroup
                onChange={(value) => setPitFormData({ ...pitFormData, programmingLanguage: value === 'Other' ? '' : value })}
                value={
                    programmingLanguagesList.slice(0, programmingLanguagesList.length - 1).find((e) => e.label?.toLowerCase() === pitFormData.programmingLanguage?.toLowerCase().trim())?.label ??
                    (pitFormData.programmingLanguage === null ? null : 'Other')
                }
            >
                <Flex flexWrap={'wrap'} rowGap={'5px'} columnGap={'2px'} justifyContent={'space-around'}>
                    {programmingLanguagesList.map((programmingLanguage) => (
                        <Flex key={programmingLanguage.id}>
                            <Radio isInvalid={submitAttempted && !pitFormData.followUp && pitFormData.programmingLanguage === null} colorScheme={'green'} value={programmingLanguage.label}>
                                {programmingLanguage.label + (programmingLanguage.label === 'Other' ? ':' : '')}
                            </Radio>
                            {programmingLanguage.label === 'Other' && (
                                <Input
                                    marginLeft={'5px'}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === 'Escape') {
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
                                    isDisabled={
                                        pitFormData.programmingLanguage === null ||
                                        programmingLanguagesList.slice(0, programmingLanguagesList.length - 1).some((e) => e.label === pitFormData.programmingLanguage)
                                    }
                                    placeholder={'Programming language'}
                                    variant={'flushed'}
                                    width={'170px'}
                                ></Input>
                            )}
                        </Flex>
                    ))}
                </Flex>
            </RadioGroup>
            <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'} marginBottom={'5px'} marginTop={'10px'}>
                Prefered Starting Position
            </Text>
            <Box marginBottom={'10px'} position={'relative'}>
                {!preAutoImageSrc && (
                    <Center
                        width={`${imageWidth * dimensionRatios.width}px`}
                        height={`${imageHeight * dimensionRatios.height}px`}
                        backgroundColor={'white'}
                        zIndex={2}
                        margin={'0 auto'}
                        position={'relative'}
                    >
                        <Spinner />
                    </Center>
                )}
                {startingPositions.map((position, index) => (
                    <Button
                        zIndex={1}
                        key={position[2]}
                        position={'absolute'}
                        left={`${whitespace.left + position[0] * dimensionRatios.width}px`}
                        top={`${whitespace.top + position[1] * dimensionRatios.height}px`}
                        width={`${65 * dimensionRatios.width}px`}
                        height={`${65 * dimensionRatios.height}px`}
                        onClick={() => setPitFormData({ ...pitFormData, startingPosition: index + 1 })}
                        colorScheme={pitFormData.startingPosition === index + 1 ? 'green' : 'gray'}
                        outline={pitFormData.startingPosition === null && submitAttempted && !pitFormData.followUp ? '2px solid red' : 'none'}
                    >
                        {index + 1}
                    </Button>
                ))}
                {preAutoImageSrc && <img src={preAutoImageSrc} style={{ zIndex: 0, margin: '0 auto' }} alt={'Field Map'} />}
            </Box>
            {pitFormData.autoAbilities.map((abilityContainer, containerIndex) => getAbilityComponent(abilityContainer, containerIndex, 'autoAbilities'))}
            <Center marginTop={'15px'}>
                <Textarea
                    onChange={(event) => setPitFormData({ ...pitFormData, autoComment: event.target.value })}
                    value={pitFormData.autoComment}
                    placeholder="Most effective strategy in auto? (Even if that's just mobility)"
                    w={'85%'}
                />
            </Center>
            <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginBottom={'5px'} marginTop={'15px'}>
                Abilities
            </Text>
            {pitFormData.teleAbilities.map((abilityContainer, containerIndex) => getAbilityComponent(abilityContainer, containerIndex, 'teleAbilities'))}
            <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginBottom={'5px'} marginTop={'15px'}>
                Closing
            </Text>
            <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'} marginBottom={'5px'} marginTop={'0px'}>
                Total Batteries
            </Text>
            <NumberInput
                onChange={(value) => setPitFormData({ ...pitFormData, batteryCount: value })}
                onBlur={(event) => handleSetBatteryCount(event.target.value)}
                value={pitFormData.batteryCount || ''}
                min={0}
                max={50}
                precision={0}
                isInvalid={submitAttempted && !pitFormData.followUp && pitFormData.batteryCount === null}
                width={{ base: '85%', md: '66%', lg: '50%' }}
                margin={'0 auto'}
            >
                <NumberInputField
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === 'Escape') {
                            event.target.blur();
                        }
                    }}
                    enterKeyHint='done'
                    placeholder='# of Batteries'
                    textAlign={'center'}
                />
            </NumberInput>
            <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'} marginBottom={'5px'} marginTop={'10px'}>
                Batteries Charging
            </Text>
            <NumberInput
                onChange={(value) => setPitFormData({ ...pitFormData, chargingBatteryCount: value })}
                onBlur={(event) => handleSetChargingBatteryCount(event.target.value)}
                value={pitFormData.chargingBatteryCount || ''}
                min={0}
                max={50}
                precision={0}
                isInvalid={submitAttempted && !pitFormData.followUp && pitFormData.chargingBatteryCount === null}
                width={{ base: '85%', md: '66%', lg: '50%' }}
                margin={'0 auto'}
            >
                <NumberInputField
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === 'Escape') {
                            event.target.blur();
                        }
                    }}
                    enterKeyHint='done'
                    placeholder='# of Batteries Charging'
                    textAlign={'center'}
                />
            </NumberInput>
            <Center marginTop={'15px'}>
                <Textarea
                    onChange={(event) => setPitFormData({ ...pitFormData, workingComment: event.target.value })}
                    value={pitFormData.workingComment}
                    placeholder='Is there anything your team is struggling with?'
                    width={'85%'}
                />
            </Center>
            <Center marginTop={'15px'}>
                <Textarea
                    onChange={(event) => setPitFormData({ ...pitFormData, closingComment: event.target.value })}
                    value={pitFormData.closingComment}
                    placeholder='Any additional comments'
                    width={'85%'}
                />
            </Center>
            <VStack marginTop={'15px'} rowGap={'15px'}>
                <ChakraImage width={{ base: '60%', md: '35%', lg: '35%' }} display={!pitFormData.image && 'none'} src={pitFormData.image} />
                <input type='file' accept='image/*' style={{ display: 'none' }} ref={hiddenImageInput} onChange={(event) => updateImage(event)} />
                <Button variant='outline' borderColor='gray.300' onClick={() => hiddenImageInput.current.click()}>
                    Upload Image
                </Button>
            </VStack>
            <Center marginTop={'15px'}>
                <Checkbox colorScheme={'green'} isChecked={pitFormData.followUp} onChange={() => setPitFormData({ ...pitFormData, followUp: !pitFormData.followUp })}>
                    Mark For Follow Up
                </Checkbox>
            </Center>
            {pitFormData.followUp ? (
                <Center marginTop={'15px'}>
                    <Textarea
                        isInvalid={pitFormData.followUp && submitAttempted && pitFormData.followUpComment.trim() === ''}
                        onChange={(event) => setPitFormData({ ...pitFormData, followUpComment: event.target.value })}
                        value={pitFormData.followUpComment}
                        placeholder='What is the reason for the follow up?'
                        width={'85%'}
                    />
                </Center>
            ) : null}
            <Center marginTop={'15px'} marginBottom={'15px'}>
                <Button isLoading={submitting} onClick={() => submit()}>
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

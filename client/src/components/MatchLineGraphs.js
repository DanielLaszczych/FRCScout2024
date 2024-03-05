import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
    Box,
    Button,
    Center,
    Checkbox,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    Flex,
    Icon,
    IconButton,
    Spinner,
    Text,
    useDisclosure,
    Tooltip as ChakraTooltip
} from '@chakra-ui/react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Colors
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { matchFormStatus } from '../util/helperConstants';
import { convertMatchKeyToString, leafGet, sortMatches } from '../util/helperFunctions';
import { AiFillFilter } from 'react-icons/ai';
import { GiBrickWall } from 'react-icons/gi';
import {
    MdOutlineSignalWifiStatusbarConnectedNoInternet4,
    MdDisabledVisible,
    MdExposurePlus1,
    MdExposurePlus2
} from 'react-icons/md';
import { FaScrewdriverWrench } from 'react-icons/fa6';
import { TbCards } from 'react-icons/tb';
import { GiMountainClimbing } from 'react-icons/gi';
import { FaParking } from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Colors);

function MatchLineGraphs({ teamNumbers, multiTeamMatchForms, onTeamPage = true }) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [firstPreset, setFirstPreset] = useState(false);
    const [standForms, setStandForms] = useState(null);
    const [superForms, setSuperForms] = useState(null);
    const [bothCompleteForms, setBothCompleteForms] = useState(null);
    const [graphWidth, setGraphWidth] = useState(false);
    const [fields, setFields] = useState({
        auto: {
            label: 'Auto',
            fields: {
                leftStart: { label: 'Left Start', field: 'leftStart', value: false },
                intakeMiss: { label: 'Intake Miss', field: 'autoGP.intakeMiss', value: false, mainLabel: true },
                ampScore: { label: 'Amp', field: 'autoGP.ampScore', value: false, mainLabel: true },
                speakerScore: { label: 'Speaker', field: 'autoGP.speakerScore', value: false, mainLabel: true },
                ampMiss: { label: 'Amp Miss', field: 'autoGP.ampMiss', value: false, mainLabel: true },
                speakerMiss: { label: 'Speaker Miss', field: 'autoGP.speakerMiss', value: false, mainLabel: true },
                autoPoints: { label: 'Auto Points', field: 'autoPoints', value: false }
            }
        },
        teleop: {
            label: 'Teleop',
            fields: {
                intakeSource: { label: 'Intake Source', field: 'teleopGP.intakeSource', value: false, mainLabel: true },
                intakeGround: { label: 'Intake Ground', field: 'teleopGP.intakeGround', value: false, mainLabel: true },
                ampScore: { label: 'Amp', field: 'teleopGP.ampScore', value: false, mainLabel: true },
                speakerScore: { label: 'Speaker', field: 'teleopGP.speakerScore', value: false, mainLabel: true },
                ampMiss: { label: 'Amp Miss', field: 'teleopGP.ampMiss', value: false, mainLabel: true },
                speakerMiss: { label: 'Speaker Miss', field: 'teleopGP.speakerMiss', value: false, mainLabel: true },
                ferry: { label: 'Ferry', field: 'teleopGP.ferry', value: false, mainLabel: true },
                defenseRating: { label: 'Defense Rating', field: 'defenseRating', value: false },
                defenseAllocation: { label: 'Defense Allocation', field: 'defenseAllocation', value: false },
                wasDefended: { label: 'Was Defended', field: 'wasDefended', value: false, icon: GiBrickWall },
                teleopPoints: { label: 'Teleop Points', field: 'teleopPoints', value: false }
            }
        },
        endGame: {
            label: 'Stage/End Game',
            fields: {
                climb: {
                    label: 'Hang/Park',
                    field: 'climb',
                    value: false,
                    icons: [GiMountainClimbing, FaParking],
                    specialField: true
                },
                harmony: {
                    label: 'Harmony',
                    field: 'harmony',
                    value: false,
                    icons: [MdExposurePlus1, MdExposurePlus2],
                    color: 'white',
                    background: 'gray.800',
                    specialField: true
                },
                trap: { label: 'Trap', field: 'teleopGP.trap', value: false },
                stagePoints: { label: 'Stage Points', field: 'stagePoints', value: false }
            }
        },
        superScout: {
            label: 'Super Scout',
            fields: {
                agility: { label: 'Agility', field: 'agility', value: false, superField: true },
                fieldAwareness: {
                    label: 'Field Awareness',
                    field: 'fieldAwareness',
                    value: false,
                    superField: true
                },
                highNoteScore: {
                    label: 'High Note',
                    field: 'ampPlayerGP.highNoteScore',
                    value: false,
                    superField: true
                },
                highNoteMiss: {
                    label: 'High Note Miss',
                    field: 'ampPlayerGP.highNoteMiss',
                    value: false,
                    superField: true
                }
            }
        },
        other: {
            label: 'Other',
            fields: {
                offensivePoints: { label: 'Offensive Points', field: 'offensivePoints', value: false },
                noShow: {
                    label: 'No Show',
                    field: 'noShow',
                    value: false,
                    icon: MdDisabledVisible,
                    note: 'Include/Exclude No Show Matches',
                    noShowValue: true
                },
                lossCommunication: {
                    label: 'Lost Comms.',
                    field: 'lostCommunication',
                    value: false,
                    icon: MdOutlineSignalWifiStatusbarConnectedNoInternet4
                },
                robotBroke: { label: 'Robot Broke', field: 'robotBroke', value: false, icon: FaScrewdriverWrench },
                yellowCard: { label: 'Yellow Card', field: 'yellowCard', value: false, icon: TbCards, color: 'orange' },
                redCard: { label: 'Red Card', field: 'redCard', value: false, icon: TbCards, color: 'red' }
            }
        }
    });
    const [teleopPreset] = useState([
        fields.teleop.fields.ampScore.field,
        fields.teleop.fields.speakerScore.field,
        fields.teleop.fields.ferry.field,
        fields.teleop.fields.defenseRating.field,
        fields.teleop.fields.wasDefended.field,
        fields.endGame.fields.climb.field,
        fields.endGame.fields.harmony.field,
        fields.other.fields.noShow.field,
        fields.other.fields.lossCommunication.field,
        fields.other.fields.robotBroke.field,
        fields.other.fields.yellowCard.field,
        fields.other.fields.redCard.field
    ]);

    const setPreset = useCallback(
        (preset) => {
            let newFields = { ...fields };
            for (const mainFieldKey in newFields) {
                let subFields = newFields[mainFieldKey].fields;
                for (const subFieldKey in subFields) {
                    let subField = subFields[subFieldKey];
                    if (preset.includes(subField.field)) {
                        subField.value = true;
                    } else {
                        subField.value = false;
                    }
                }
            }
            setFields(newFields);
        },
        [fields]
    );

    useLayoutEffect(() => {
        if (!firstPreset) {
            setPreset(teleopPreset);
            setFirstPreset(true);
        }
    }, [setPreset, firstPreset, teleopPreset]);

    useLayoutEffect(() => {
        let standForms = {};
        let superForms = {};
        let bothCompleteForms = {};
        for (const teamNumber of teamNumbers) {
            let matchForms = sortMatches(multiTeamMatchForms[teamNumber]);
            standForms[teamNumber] = [];
            superForms[teamNumber] = [];
            bothCompleteForms[teamNumber] = [];
            for (const matchForm of matchForms) {
                if (
                    (fields.other.fields.noShow.value &&
                        matchForm.standStatus === matchFormStatus.noShow &&
                        matchForm.superStatus === matchFormStatus.noShow) ||
                    (matchForm.standStatus === matchFormStatus.complete &&
                        matchForm.superStatus === matchFormStatus.complete)
                ) {
                    standForms[teamNumber].push(matchForm);
                    superForms[teamNumber].push(matchForm);
                    bothCompleteForms[teamNumber].push(matchForm);
                } else if (
                    (fields.other.fields.noShow.value && matchForm.standStatus === matchFormStatus.noShow) ||
                    matchForm.standStatus === matchFormStatus.complete
                ) {
                    standForms[teamNumber].push(matchForm);
                } else if (
                    (fields.other.fields.noShow.value && matchForm.superStatus === matchFormStatus.noShow) ||
                    matchForm.superStatus === matchFormStatus.complete
                ) {
                    superForms[teamNumber].push(matchForm);
                }
            }
        }
        setStandForms(standForms);
        setSuperForms(superForms);
        setBothCompleteForms(bothCompleteForms);
    }, [teamNumbers, multiTeamMatchForms, fields.other.fields.noShow.value]);

    const getGraphWidth = useCallback(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const breakPointWidth = window.innerWidth;
        if (breakPointWidth < 992) {
            setGraphWidth(0.9 * viewportWidth);
        } else {
            setGraphWidth((0.9 * viewportWidth) / Math.min(teamNumbers.length, 3));
        }
    }, [teamNumbers]);

    useLayoutEffect(() => {
        getGraphWidth();

        window.addEventListener('resize', getGraphWidth);

        return () => window.removeEventListener('resize', getGraphWidth);
    }, [standForms, superForms, bothCompleteForms, getGraphWidth]);

    function clearFields() {
        let newFields = { ...fields };
        for (const mainFieldKey in newFields) {
            let subFields = newFields[mainFieldKey].fields;
            for (const subFieldKey in subFields) {
                let subField = subFields[subFieldKey];
                subField.value = false;
            }
        }
        setFields(newFields);
    }

    function noFieldsSelected() {
        return !Object.values(fields).some((mainField) =>
            Object.values(mainField.fields).some((subField) => subField.value)
        );
    }

    function isOnlyStandData() {
        for (const mainFieldKey in fields) {
            let subFields = fields[mainFieldKey].fields;
            for (const subFieldKey in subFields) {
                if (subFieldKey !== 'noShow' && subFields[subFieldKey].superField && subFields[subFieldKey].value) {
                    return false;
                }
            }
        }
        return true;
    }

    function isOnlySuperData() {
        for (const mainFieldKey in fields) {
            let subFields = fields[mainFieldKey].fields;
            for (const subFieldKey in subFields) {
                if (subFieldKey !== 'noShow' && !subFields[subFieldKey].superField && subFields[subFieldKey].value) {
                    return false;
                }
            }
        }
        return true;
    }

    function getFormsToUse(teamNumber) {
        if (noFieldsSelected()) {
            return [];
        } else if (isOnlyStandData()) {
            return standForms[teamNumber];
        } else if (isOnlySuperData()) {
            return superForms[teamNumber];
        } else {
            return bothCompleteForms[teamNumber];
        }
    }

    function getLabels(teamNumber) {
        return getFormsToUse(teamNumber).map((matchForm) =>
            convertMatchKeyToString(matchForm.matchNumber, false, true)
        );
    }

    function getSpecialFieldValue(matchForm, field) {
        switch (field) {
            case fields.endGame.fields.climb.field:
                if (matchForm.climb.attempt === 'Success' || matchForm.climb.park) {
                    return 1;
                } else {
                    return 0;
                }
            case fields.endGame.fields.harmony.field:
                if (matchForm.climb.attempt === 'Success' && matchForm.climb.harmony > 0) {
                    return 1;
                } else {
                    return 0;
                }
            default:
                return null;
        }
    }

    function getDatasets(teamNumber) {
        let formsToUse = getFormsToUse(teamNumber);
        let datasets = [];
        for (const mainFieldKey in fields) {
            let mainField = fields[mainFieldKey];
            let subFields = mainField.fields;
            for (const subFieldKey in subFields) {
                let subField = subFields[subFieldKey];
                if (subField.value && !subField.icon && !subField.icons) {
                    let dataset = {};
                    dataset.label = `${subField.label}${subField.mainLabel ? ` (${mainField.label})` : ''}`;
                    dataset.data = formsToUse.map((matchForm) => {
                        if (subField.superField && matchForm.superStatus === matchFormStatus.noShow) {
                            return subField.noShowValue || 0;
                        } else if (!subField.superField && matchForm.standStatus === matchFormStatus.noShow) {
                            return subField.noShowValue || 0;
                        } else if (subField.specialField) {
                            return getSpecialFieldValue(matchForm, subField.field);
                        } else {
                            return leafGet(matchForm, subField.field);
                        }
                    });
                    // dataset.borderColor = 'rgb(255, 99, 132)';
                    // dataset.backgroundColor = 'rgba(255, 99, 132, 0.5)';
                    datasets.push(dataset);
                }
            }
        }
        return datasets;
    }

    function getSuggestedMax() {
        let max = 0;
        for (const teamNumber of teamNumbers) {
            max = Math.max(max, Math.max(...[].concat(...getDatasets(teamNumber).map((dataset) => dataset.data))));
        }
        return max;
    }

    function getNumberOfIcons(matchForm) {
        let icons = 0;
        for (const mainFieldKey in fields) {
            let subFields = fields[mainFieldKey].fields;
            for (const subFieldKey in subFields) {
                let subField = subFields[subFieldKey];
                if (subField.value && (subField.icon || subField.icons)) {
                    if (getIconValue(matchForm, subField)) {
                        icons += 1;
                    }
                }
            }
        }
        return icons;
    }

    function getIconValue(matchForm, subField) {
        if (subField.superField && matchForm.superStatus === matchFormStatus.noShow) {
            return subField.noShowValue || false;
        } else if (!subField.superField && matchForm.standStatus === matchFormStatus.noShow) {
            return subField.noShowValue || false;
        } else if (subField.specialField) {
            return getSpecialFieldValue(matchForm, subField.field);
        } else {
            return leafGet(matchForm, subField.field);
        }
    }

    function getOneIcon(matchForm, subField) {
        switch (subField.field) {
            case fields.endGame.fields.climb.field:
                if (matchForm.climb.attempt === 'Success') {
                    return subField.icons[0];
                } else {
                    return subField.icons[1];
                }
            case fields.endGame.fields.harmony.field:
                if (matchForm.climb.harmony === 1) {
                    return subField.icons[0];
                } else {
                    return subField.icons[1];
                }
            default:
                return null;
        }
    }

    function getIcons(teamNumber) {
        let formsToUse = getFormsToUse(teamNumber);
        if (formsToUse.length === 0) {
            return null;
        }
        let iconSize = 20;
        let iconsPerRow = 1;
        let yTickWidth = getSuggestedMax() + 2 >= 10 ? 19 : 18;
        let firstPoint = (graphWidth - yTickWidth) / (formsToUse.length * 2) + yTickWidth;
        let offset = (graphWidth - yTickWidth) / formsToUse.length;
        let offsetAdjustment = 2;
        return (
            <React.Fragment>
                {formsToUse.map((matchForm, index) => (
                    <Flex
                        key={matchForm.matchNumber}
                        maxWidth={`${iconSize * iconsPerRow}px`}
                        flexWrap={'wrap'}
                        position={'absolute'}
                        top={{
                            base: 'max(calc(50vh), 280px)',
                            lg: `max(calc(100vh / ${teamNumbers.length > 3 ? 2.5 : 2}), 280px)`
                        }}
                        left={`${firstPoint + index * (offset - offsetAdjustment)}px`}
                    >
                        {Object.values(fields).map((mainField) =>
                            Object.values(mainField.fields).map((subField) =>
                                (subField.icon || subField.icons) &&
                                subField.value &&
                                getIconValue(matchForm, subField) ? (
                                    <ChakraTooltip key={subField.field} label={subField.label}>
                                        <span>
                                            <Icon
                                                boxSize={5}
                                                as={subField.icons ? getOneIcon(matchForm, subField) : subField.icon}
                                                color={subField.color}
                                                background={subField.background}
                                            ></Icon>
                                        </span>
                                    </ChakraTooltip>
                                ) : null
                            )
                        )}
                    </Flex>
                ))}
            </React.Fragment>
        );
    }

    function getMarginBottom(teamNumber) {
        let formsToUse = getFormsToUse(teamNumber);
        let maxIcons = 0;
        for (const matchForm of formsToUse) {
            maxIcons = Math.max(maxIcons, getNumberOfIcons(matchForm));
        }
        if (maxIcons === 0) {
            return 0;
        } else {
            return Math.ceil((maxIcons * 20) / 20) * 23;
        }
    }

    if (standForms === null || superForms === null || bothCompleteForms === null) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Box position={'relative'}>
            <Drawer placement={'left'} onClose={onClose} isOpen={isOpen}>
                <DrawerOverlay />
                <DrawerContent maxWidth={{ base: '75vw', sm: '55vw', md: '35vw', lg: '20vw' }}>
                    <DrawerCloseButton color={'white'} />
                    <DrawerHeader borderBottom={'3px solid green'} backgroundColor={'#212529'} textColor={'white'}>
                        Data points
                    </DrawerHeader>
                    <DrawerBody marginBottom={'15px'}>
                        <Flex
                            flexWrap={'wrap'}
                            columnGap={'10px'}
                            justifyContent={'center'}
                            marginTop={'5px'}
                            marginBottom={'5px'}
                        >
                            <Button size={'sm'} onClick={() => setPreset(teleopPreset)}>
                                Teleop Preset
                            </Button>
                            <Button size={'sm'} onClick={() => clearFields()}>
                                Clear
                            </Button>
                        </Flex>
                        <Flex flexDirection={'column'} rowGap={'5px'}>
                            {Object.keys(fields).map((mainFieldKey) => (
                                <Box key={fields[mainFieldKey].label}>
                                    <Text fontSize={'lg'} fontWeight={'medium'} marginBottom={'2px'}>
                                        {fields[mainFieldKey].label}
                                    </Text>
                                    <Flex flexDirection={'column'} rowGap={'2px'}>
                                        {Object.keys(fields[mainFieldKey].fields).map((subFieldKey) => (
                                            <Flex
                                                key={
                                                    fields[mainFieldKey].label +
                                                    fields[mainFieldKey].fields[subFieldKey].label
                                                }
                                                paddingLeft={'15px'}
                                                alignItems={'center'}
                                                columnGap={'8px'}
                                            >
                                                <Checkbox
                                                    isChecked={fields[mainFieldKey].fields[subFieldKey].value}
                                                    onChange={(e) => {
                                                        let newFields = { ...fields };
                                                        newFields[mainFieldKey].fields[subFieldKey].value =
                                                            e.target.checked;
                                                        setFields(newFields);
                                                    }}
                                                >
                                                    {fields[mainFieldKey].fields[subFieldKey].label}
                                                </Checkbox>
                                                {fields[mainFieldKey].fields[subFieldKey].icon && (
                                                    <Icon
                                                        boxSize={5}
                                                        as={fields[mainFieldKey].fields[subFieldKey].icon}
                                                        color={fields[mainFieldKey].fields[subFieldKey].color}
                                                        background={fields[mainFieldKey].fields[subFieldKey].background}
                                                    ></Icon>
                                                )}
                                                {fields[mainFieldKey].fields[subFieldKey].icons &&
                                                    fields[mainFieldKey].fields[subFieldKey].icons.map(
                                                        (icon, index) => (
                                                            <Icon
                                                                key={index}
                                                                boxSize={5}
                                                                as={icon}
                                                                color={fields[mainFieldKey].fields[subFieldKey].color}
                                                                background={
                                                                    fields[mainFieldKey].fields[subFieldKey].background
                                                                }
                                                            ></Icon>
                                                        )
                                                    )}
                                                {fields[mainFieldKey].fields[subFieldKey].note && (
                                                    <Text
                                                        fontSize={'xs'}
                                                    >{` (${fields[mainFieldKey].fields[subFieldKey].note})`}</Text>
                                                )}
                                            </Flex>
                                        ))}
                                    </Flex>
                                </Box>
                            ))}
                        </Flex>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
            <IconButton
                icon={<AiFillFilter />}
                position={'absolute'}
                left={'15px'}
                top={onTeamPage ? '-75px' : '-55px'}
                onClick={onOpen}
            >
                Open settings
            </IconButton>
            <Flex
                margin={'0 auto'}
                width={'100%'}
                flexWrap={'wrap'}
                columnGap={'50px'}
                rowGap={'40px'}
                justifyContent={'center'}
            >
                {teamNumbers.map((teamNumber, index) => (
                    <Flex
                        position={'relative'}
                        key={teamNumber}
                        justifyContent={'center'}
                        width={{ base: '90%', lg: `calc(90% / ${Math.min(teamNumbers.length, 3)})` }}
                        height={
                            !multiTeamMatchForms[teamNumber] || multiTeamMatchForms[teamNumber].length === 0
                                ? 'fit-content'
                                : {
                                      base: 'max(50vh, 280px)',
                                      lg: `max(calc(100vh / ${teamNumbers.length > 3 ? 2.5 : 2}), 280px)`
                                  }
                        }
                        marginBottom={`${getMarginBottom(teamNumber)}px`}
                    >
                        {multiTeamMatchForms[teamNumber].length === 0 ? (
                            <Box>
                                {!onTeamPage && (
                                    <Text
                                        fontSize={'xl'}
                                        fontWeight={'semibold'}
                                        textAlign={'center'}
                                        color={index > 2 ? 'blue.500' : 'red.500'}
                                    >
                                        {index > 2
                                            ? `Blue ${index - 2}: ${teamNumber}`
                                            : `Red ${index + 1}: ${teamNumber}`}
                                    </Text>
                                )}
                                <Text fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'}>
                                    No match data
                                </Text>
                            </Box>
                        ) : (
                            <React.Fragment>
                                <Line
                                    data={{
                                        labels: getLabels(teamNumber),
                                        datasets: getDatasets(teamNumber)
                                    }}
                                    options={{
                                        maintainAspectRatio: false,
                                        plugins: {
                                            colors: {
                                                forceOverride: true,
                                                enabled: true
                                            },
                                            title: {
                                                display: true,
                                                text: `${
                                                    !onTeamPage
                                                        ? index > 2
                                                            ? `Blue ${index - 2}: `
                                                            : `Red ${index + 1}: `
                                                        : ''
                                                }${teamNumber}`,
                                                color: `${onTeamPage ? 'black' : index > 2 ? '#3182ce' : '#E53E3E'}`,
                                                font: {
                                                    size: 20
                                                }
                                            },
                                            legend: {
                                                labels: {
                                                    font: {
                                                        size: 14
                                                    }
                                                }
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                suggestedMax: getSuggestedMax() + 2,
                                                ticks: {
                                                    stepSize: 1,
                                                    font: {
                                                        size: 16
                                                    },
                                                    color: 'black'
                                                }
                                            },
                                            x: {
                                                offset: true,
                                                grid: {
                                                    offset: true
                                                },
                                                ticks: {
                                                    font: {
                                                        size: 16
                                                    },
                                                    color: 'black'
                                                }
                                            }
                                        }
                                    }}
                                    plugins={[
                                        {
                                            id: 'increase-legend-spacing',
                                            beforeInit(chart) {
                                                // Get reference to the original fit function
                                                const originalFit = chart.legend.fit;
                                                // Override the fit function
                                                chart.legend.fit = function fit() {
                                                    // Call original function and bind scope in order to use `this` correctly inside it
                                                    originalFit.bind(chart.legend)();
                                                    this.height += 15;
                                                };
                                            }
                                        }
                                    ]}
                                ></Line>
                                {getIcons(teamNumber)}
                            </React.Fragment>
                        )}
                    </Flex>
                ))}
            </Flex>
        </Box>
    );
}

export default MatchLineGraphs;

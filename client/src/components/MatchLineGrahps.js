import React, { useCallback, useEffect, useState } from 'react';
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
import { MdOutlineSignalWifiStatusbarConnectedNoInternet4 } from 'react-icons/md';
import { FaScrewdriverWrench } from 'react-icons/fa6';
import { TbCards } from 'react-icons/tb';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Colors);

const teleopPreset = [
    'teleopGP.ampScore',
    'teleopGP.speakerScore',
    'teleopGP.ferry',
    'defenseRating',
    'wasDefended',
    'lostCommunication',
    'robotBroke',
    'yellowCard',
    'redCard'
];

function MatchLineGraphs({ teamNumbers, multiTeamMatchForms }) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [firstPreset, setFirstPreset] = useState(false);
    const [standForms, setStandForms] = useState(null);
    const [superForms, setSuperForms] = useState(null);
    const [bothCompleteForms, setBothCompleteForms] = useState(null);
    const [graphWidth, setGraphWidth] = useState(false);
    const [fields, setFields] = useState([
        {
            label: 'Auto',
            fields: [
                { label: 'Left Start', field: 'leftStart', value: false },
                { label: 'Intake Miss', field: 'autoGP.intakeMiss', value: false, mainLabel: true },
                { label: 'Amp', field: 'autoGP.ampScore', value: false, mainLabel: true },
                { label: 'Speaker', field: 'autoGP.speakerScore', value: false, mainLabel: true },
                { label: 'Amp Miss', field: 'autoGP.ampMiss', value: false, mainLabel: true },
                { label: 'Speaker Miss', field: 'autoGP.speakerMiss', value: false, mainLabel: true },
                { label: 'Auto Points', field: 'autoPoints', value: false }
            ]
        },
        {
            label: 'Teleop',
            fields: [
                { label: 'Intake Source', field: 'teleopGP.intakeSource', value: false, mainLabel: true },
                { label: 'Intake Ground', field: 'teleopGP.intakeGround', value: false, mainLabel: true },
                { label: 'Amp', field: 'teleopGP.ampScore', value: false, mainLabel: true },
                { label: 'Speaker', field: 'teleopGP.speakerScore', value: false, mainLabel: true },
                { label: 'Amp Miss', field: 'teleopGP.ampMiss', value: false, mainLabel: true },
                { label: 'Speaker Miss', field: 'teleopGP.speakerMiss', value: false, mainLabel: true },
                { label: 'Ferry', field: 'teleopGP.ferry', value: false, mainLabel: true },
                { label: 'Defense Rating', field: 'defenseRating', value: false },
                { label: 'Defense Allocation', field: 'defenseAllocation', value: false },
                { label: 'Was Defended', field: 'wasDefended', value: false, icon: GiBrickWall },
                { label: 'Teleop Points', field: 'teleopPoints', value: false }
            ]
        },
        {
            label: 'Stage/End Game',
            fields: [
                { label: 'Trap', field: 'teleopGP.trap', value: false },
                { label: 'Stage Points', field: 'stagePoints', value: false }
            ]
        },
        {
            label: 'Super Scout',
            fields: [
                { label: 'Agility', field: 'agility', value: false },
                { label: 'Field Awareness', field: 'fieldAwareness', value: false }
            ]
        },
        {
            label: 'Other',
            fields: [
                { label: 'Offensive Points', field: 'offensivePoints', value: false },
                {
                    label: 'Lost Comms.',
                    field: 'lostCommunication',
                    value: false,
                    icon: MdOutlineSignalWifiStatusbarConnectedNoInternet4
                },
                { label: 'Robot Broke', field: 'robotBroke', value: false, icon: FaScrewdriverWrench },
                { label: 'Yellow Card', field: 'yellowCard', value: false, icon: TbCards, color: 'orange' },
                { label: 'Red Card', field: 'redCard', value: false, icon: TbCards, color: 'red' }
            ]
        }
    ]);

    useEffect(() => {
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
                    matchForm.standStatus === matchFormStatus.complete &&
                    matchForm.superStatus === matchFormStatus.complete
                ) {
                    standForms[teamNumber].push(matchForm);
                    superForms[teamNumber].push(matchForm);
                    bothCompleteForms[teamNumber].push(matchForm);
                } else if (matchForm.standStatus === matchFormStatus.complete) {
                    standForms[teamNumber].push(matchForm);
                } else if (matchForm.superStatus === matchFormStatus.complete) {
                    superForms[teamNumber].push(matchForm);
                }
            }
        }
        setStandForms(standForms);
        setSuperForms(superForms);
        setBothCompleteForms(bothCompleteForms);
    }, [teamNumbers, multiTeamMatchForms]);

    const setPreset = useCallback(
        (preset) => {
            let newFields = [...fields];
            for (const mainField of newFields) {
                for (const subField of mainField.fields) {
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

    useEffect(() => {
        if (!firstPreset) {
            setPreset(teleopPreset);
            setFirstPreset(true);
        }
    }, [setPreset, firstPreset]);

    const getGraphWidth = useCallback(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const breakPointWidth = window.innerWidth;
        if (breakPointWidth < 992) {
            setGraphWidth(0.9 * viewportWidth);
        } else {
            setGraphWidth((0.9 * viewportWidth) / Math.min(teamNumbers.length, 3));
        }
    }, [teamNumbers]);

    useEffect(() => {
        getGraphWidth();
        window.addEventListener('resize', getGraphWidth);

        return () => window.removeEventListener('resize', getGraphWidth);
    }, [getGraphWidth]);

    function clearFields() {
        let newFields = [...fields];
        for (const mainField of newFields) {
            for (const subField of mainField.fields) {
                subField.value = false;
            }
        }
        setFields(newFields);
    }
    function getFormsToUse(teamNumber) {
        if (
            !fields.some((mainField) =>
                mainField.fields.some(
                    (subField) =>
                        (subField.field === 'agility' || subField.field === 'fieldAwareness') && subField.value
                )
            )
        ) {
            return standForms[teamNumber];
        } else if (
            fields.some((mainField) =>
                mainField.fields.some(
                    (subField) => subField.field !== 'agility' && subField.field !== 'fieldAwareness' && subField.value
                )
            )
        ) {
            return bothCompleteForms[teamNumber];
        } else {
            return superForms[teamNumber];
        }
    }

    function getLabels(teamNumber) {
        return getFormsToUse(teamNumber).map((matchForm) => convertMatchKeyToString(matchForm.matchNumber));
    }

    function getDatasets(teamNumber) {
        let formsToUse = getFormsToUse(teamNumber);
        let datasets = [];
        for (const mainField of fields) {
            for (const subField of mainField.fields) {
                if (subField.value && !subField.icon) {
                    let dataset = {};
                    dataset.label = `${subField.label}${subField.mainLabel ? ` (${mainField.label})` : ''}`;
                    dataset.data = formsToUse.map((matchForm) => leafGet(matchForm, subField.field));
                    // dataset.borderColor = 'rgb(255, 99, 132)';
                    // dataset.backgroundColor = 'rgba(255, 99, 132, 0.5)';
                    datasets.push(dataset);
                }
            }
        }
        return datasets;
    }

    function getIcons(teamNumber) {
        let iconSize = 20;
        let formsToUse = getFormsToUse(teamNumber);
        if (formsToUse.length === 0) {
            return null;
        }
        let firstPoint = (graphWidth - 33) / (formsToUse.length * 2) + 33 - iconSize;
        let offset = (graphWidth - 33) / formsToUse.length;
        let offsetAdjustment = 2;
        return (
            <React.Fragment>
                {formsToUse.map((matchForm, index) => (
                    <Flex
                        key={matchForm.matchNumber}
                        maxWidth={`${iconSize * 2}px`}
                        flexWrap={'wrap'}
                        position={'absolute'}
                        top={{ base: 'calc(50vh)', lg: `calc(100vh / ${teamNumbers.length > 3 ? 3 : 2})` }}
                        left={
                            firstPoint +
                            ([].concat(
                                ...fields
                                    .map((mainField) =>
                                        mainField.fields
                                            .map(
                                                (subField) =>
                                                    subField.icon &&
                                                    subField.value &&
                                                    leafGet(matchForm, subField.field)
                                            )
                                            .filter((e) => e)
                                    )
                                    .filter((e) => e.length > 0)
                            ).length > 1
                                ? 0
                                : iconSize / 2) +
                            index * (offset - offsetAdjustment)
                        }
                    >
                        {fields.map((mainField) =>
                            mainField.fields.map((subField) =>
                                subField.icon && subField.value && leafGet(matchForm, subField.field) ? (
                                    <ChakraTooltip key={subField.field} label={subField.label}>
                                        <span>
                                            <Icon boxSize={5} as={subField.icon} color={subField.color}></Icon>
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
            let icons = 0;
            for (const mainField of fields) {
                for (const subField of mainField.fields) {
                    if (subField.icon && subField.value && leafGet(matchForm, subField.field)) {
                        icons += 1;
                    }
                }
            }
            maxIcons = Math.max(maxIcons, icons);
        }
        if (maxIcons === 0) {
            return 0;
        } else {
            return Math.ceil((maxIcons * 16) / 32) * 25;
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
                <DrawerContent maxWidth={{ base: '65vw', sm: '40vw', md: '35vw', lg: '20vw' }}>
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
                            {fields.map((mainField, mainIndex) => (
                                <Box key={mainField.label}>
                                    <Text fontSize={'lg'} fontWeight={'medium'} marginBottom={'2px'}>
                                        {mainField.label}
                                    </Text>
                                    <Flex flexDirection={'column'} rowGap={'2px'}>
                                        {mainField.fields.map((subField, subIndex) => (
                                            <Flex
                                                key={mainField.label + subField.label}
                                                paddingLeft={'15px'}
                                                alignItems={'center'}
                                                columnGap={'8px'}
                                            >
                                                <Checkbox
                                                    isChecked={subField.value}
                                                    onChange={(e) => {
                                                        let newFields = [...fields];
                                                        newFields[mainIndex].fields[subIndex].value = e.target.checked;
                                                        setFields(newFields);
                                                    }}
                                                >
                                                    {subField.label}
                                                </Checkbox>
                                                {subField.icon && (
                                                    <Icon boxSize={5} as={subField.icon} color={subField.color}></Icon>
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
            <IconButton icon={<AiFillFilter />} position={'absolute'} left={'25px'} top={'-75px'} onClick={onOpen}>
                Open settings
            </IconButton>
            <Flex margin={'0 auto'} width={'100%'} flexWrap={'wrap'} columnGap={'50px'} justifyContent={'center'}>
                {teamNumbers.map((teamNumber) => (
                    <Flex
                        position={'relative'}
                        key={teamNumber}
                        justifyContent={'center'}
                        width={{ base: '90%', lg: `calc(90% / ${Math.min(teamNumbers.length, 3)})` }}
                        height={{ base: '50vh', lg: `calc(100vh / ${teamNumbers.length > 3 ? 3 : 2})` }}
                        marginBottom={`${getMarginBottom(teamNumber)}px`}
                    >
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
                                        text: `${teamNumber}`,
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
                                        suggestedMax:
                                            Math.max(
                                                ...[].concat(...getDatasets(teamNumber).map((dataset) => dataset.data))
                                            ) + 2,
                                        ticks: {
                                            font: {
                                                size: 16
                                            }
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
                                            }
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
                    </Flex>
                ))}
            </Flex>
        </Box>
    );
}

export default MatchLineGraphs;

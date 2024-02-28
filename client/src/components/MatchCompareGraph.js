import React, { useLayoutEffect, useState } from 'react';
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
    useDisclosure
} from '@chakra-ui/react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Colors } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { matchFormStatus } from '../util/helperConstants';
import { leafGet, sortMatches } from '../util/helperFunctions';
import { AiFillFilter } from 'react-icons/ai';
import { MdDisabledVisible } from 'react-icons/md';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Colors);

function MatchCompareGraph({ teamNumbers, multiTeamMatchForms, onTeamPage = true }) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [standForms, setStandForms] = useState(null);
    const [superForms, setSuperForms] = useState(null);
    const [selectedTeams, setSelectedTeams] = useState([]);
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
                wasDefended: { label: 'Was Defended', field: 'wasDefended', value: false },
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
                    specialField: true
                },
                harmony: {
                    label: 'Harmony',
                    field: 'climb.harmony',
                    value: false
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
                    value: false
                },
                robotBroke: { label: 'Robot Broke', field: 'robotBroke', value: false },
                yellowCard: { label: 'Yellow Card', field: 'yellowCard', value: false },
                redCard: { label: 'Red Card', field: 'redCard', value: false }
            }
        }
    });

    useLayoutEffect(() => {
        let standForms = {};
        let superForms = {};
        for (const teamNumber of teamNumbers) {
            let matchForms = sortMatches(multiTeamMatchForms[teamNumber]);
            standForms[teamNumber] = [];
            superForms[teamNumber] = [];
            for (const matchForm of matchForms) {
                if (
                    matchForm.standStatus === matchFormStatus.complete ||
                    (fields.other.fields.noShow.value && matchForm.standStatus === matchFormStatus.noShow)
                ) {
                    standForms[teamNumber].push(matchForm);
                }
                if (
                    matchForm.superStatus === matchFormStatus.complete ||
                    (fields.other.fields.noShow.value && matchForm.superStatus === matchFormStatus.noShow)
                ) {
                    superForms[teamNumber].push(matchForm);
                }
            }
        }
        setStandForms(standForms);
        setSuperForms(superForms);
    }, [teamNumbers, multiTeamMatchForms, fields.other.fields.noShow.value]);

    function clearFields() {
        let newFields = { ...fields };
        for (const mainFieldKey in newFields) {
            let subFields = newFields[mainFieldKey].fields;
            for (const subFieldKey in subFields) {
                if (subFieldKey !== 'noShow') {
                    let subField = subFields[subFieldKey];
                    subField.value = false;
                }
            }
        }
        return newFields;
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
        }
    }

    function getLabels() {
        let minCompletedForms = null;
        for (const teamNumber of selectedTeams) {
            if (minCompletedForms === null) {
                minCompletedForms = getFormsToUse(teamNumber).length;
            } else {
                minCompletedForms = Math.min(minCompletedForms, getFormsToUse(teamNumber).length);
            }
        }
        let labels = [];
        for (let i = 0; i < minCompletedForms; i++) {
            labels.push(`Match ${i + 1}`);
        }
        return labels;
    }

    function getSpecialFieldValue(matchForm, field) {
        switch (field) {
            case fields.endGame.fields.climb.field:
                if (matchForm.climb.attempt === 'Success') {
                    return 1;
                } else if (matchForm.climb.park) {
                    return 0.5;
                } else {
                    return 0;
                }
            default:
                return null;
        }
    }

    function getDatasets() {
        let minCompletedForms = getLabels().length;
        let datasets = [];
        for (const teamNumber of selectedTeams) {
            let formsToUse = getFormsToUse(teamNumber).slice(0, minCompletedForms);
            for (const mainFieldKey in fields) {
                let mainField = fields[mainFieldKey];
                let subFields = mainField.fields;
                for (const subFieldKey in subFields) {
                    let subField = subFields[subFieldKey];
                    if (subField.value && !subField.icon) {
                        let dataset = {};
                        dataset.label = teamNumber;
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
        }
        return datasets;
    }

    function getSuggestedMax() {
        return Math.max(...[].concat(...getDatasets().map((dataset) => dataset.data)));
    }

    function getTitle() {
        for (const mainFieldKey in fields) {
            let subFields = fields[mainFieldKey].fields;
            for (const subFieldKey in subFields) {
                if (subFieldKey !== 'noShow' && subFields[subFieldKey].value) {
                    let subField = subFields[subFieldKey];
                    return `${subField.label}${subField.mainLabel ? ` (${fields[mainFieldKey].label})` : ''}`;
                }
            }
        }
        return 'Select Field';
    }

    if (standForms === null || superForms === null) {
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
                                                        let newFields;
                                                        if (subFieldKey === 'noShow') {
                                                            newFields = { ...fields };
                                                            newFields[mainFieldKey].fields[subFieldKey].value =
                                                                !newFields[mainFieldKey].fields[subFieldKey].value;
                                                        } else {
                                                            newFields = clearFields();
                                                            newFields[mainFieldKey].fields[subFieldKey].value = true;
                                                        }
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
            />
            <Flex
                margin={'0 auto'}
                width={'90%'}
                justifyContent={'center'}
                alignItems={'center'}
                flexDir={'column'}
                rowGap={'10px'}
            >
                <Flex columnGap={'10px'}>
                    {teamNumbers.slice(0, 3).map((teamNumber, index) => (
                        <Button
                            key={index}
                            backgroundColor={selectedTeams.includes(teamNumber) ? 'red.200' : 'gray.100'}
                            _hover={{ backgroundColor: selectedTeams.includes(teamNumber) ? 'red.300' : 'gray.200' }}
                            onClick={() => {
                                let newSelectedTeams;
                                if (selectedTeams.includes(teamNumber)) {
                                    newSelectedTeams = [...selectedTeams.filter((team) => team !== teamNumber)];
                                } else {
                                    newSelectedTeams = [...selectedTeams, teamNumber];
                                }
                                setSelectedTeams(
                                    newSelectedTeams.sort((a, b) => teamNumbers.indexOf(a) - teamNumbers.indexOf(b))
                                );
                            }}
                            isDisabled={
                                !multiTeamMatchForms[teamNumber] || multiTeamMatchForms[teamNumber].length === 0
                            }
                        >
                            {teamNumber}
                        </Button>
                    ))}
                </Flex>
                <Flex columnGap={'10px'}>
                    {teamNumbers.slice(3, 6).map((teamNumber, index) => (
                        <Button
                            key={index}
                            backgroundColor={selectedTeams.includes(teamNumber) ? 'blue.200' : 'gray.100'}
                            _hover={{ backgroundColor: selectedTeams.includes(teamNumber) ? 'blue.300' : 'gray.200' }}
                            onClick={() => {
                                let newSelectedTeams;
                                if (selectedTeams.includes(teamNumber)) {
                                    newSelectedTeams = [...selectedTeams.filter((team) => team !== teamNumber)];
                                } else {
                                    newSelectedTeams = [...selectedTeams, teamNumber];
                                }
                                setSelectedTeams(
                                    newSelectedTeams.sort((a, b) => teamNumbers.indexOf(a) - teamNumbers.indexOf(b))
                                );
                            }}
                            isDisabled={
                                !multiTeamMatchForms[teamNumber] || multiTeamMatchForms[teamNumber].length === 0
                            }
                        >
                            {teamNumber}
                        </Button>
                    ))}
                </Flex>
            </Flex>
            <Flex
                position={'relative'}
                margin={'0 auto'}
                width={'90%'}
                justifyContent={'center'}
                alignItems={'center'}
                height={`max(calc(100vh / 2), 280px)`}
            >
                <Bar
                    data={{
                        labels: getLabels(),
                        datasets: getDatasets()
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
                                text: `${getTitle()}`,
                                color: 'black',
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
                                    //  Call original function and bind scope in order to use `this` correctly inside it
                                    originalFit.bind(chart.legend)();
                                    this.height += 15;
                                };
                            }
                        },
                        {
                            afterDatasetDraw(chart) {
                                const { ctx, data } = chart;
                                ctx.save();
                                for (let i = 0; i < 6; i++) {
                                    if (chart.getDatasetMeta(i).type === null || chart.getDatasetMeta(i).hidden) {
                                        continue;
                                    }
                                    chart.getDatasetMeta(i).data.forEach((datapoint, index) => {
                                        ctx.font = '12px';
                                        ctx.fillStyle = 'black';
                                        ctx.textAlign = 'center';
                                        ctx.fillText(data.datasets[i].data[index], datapoint.x, datapoint.y - 10);
                                    });
                                }
                            }
                        }
                    ]}
                ></Bar>
            </Flex>
        </Box>
    );
}

export default MatchCompareGraph;

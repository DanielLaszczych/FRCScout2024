import React, { useLayoutEffect, useState } from 'react';
import { leafGet, roundToWhole, sortMatches } from '../util/helperFunctions';
import { matchFormStatus } from '../util/helperConstants';
import { Box, Center, Flex, Grid, GridItem, Icon, Spinner, Text } from '@chakra-ui/react';
import { FaCircleArrowDown, FaCircleArrowUp } from 'react-icons/fa6';
import { climbFields } from '../../../server/util/helperConstants';

const fields = [
    {
        label: 'Auto',
        fields: [
            { label: '# of Leave', field: 'leftStart', simple: true },
            { label: 'Intake Miss', field: 'autoGP.intakeMiss' },
            { label: 'Amp', field: 'autoGP.ampScore' },
            { label: 'Speaker', field: 'autoGP.speakerScore' },
            { label: 'Amp Miss', field: 'autoGP.ampMiss' },
            { label: 'Speaker Miss', field: 'autoGP.speakerMiss' },
            { label: 'Auto Points', field: 'autoPoints' }
        ]
    },
    {
        label: 'Teleop',
        fields: [
            { label: 'Intake Source', field: 'teleopGP.intakeSource' },
            { label: 'Intake Ground', field: 'teleopGP.intakeGround' },
            { label: 'Amp', field: 'teleopGP.ampScore' },
            { label: 'Speaker', field: 'teleopGP.speakerScore' },
            { label: 'Amp Miss', field: 'teleopGP.ampMiss' },
            { label: 'Speaker Miss', field: 'teleopGP.speakerMiss' },
            { label: 'Ferry', field: 'teleopGP.ferry' },
            { label: 'Defense Rating', field: 'defenseRating', specialField: true },
            { label: 'Defense Allocation', field: 'defenseAllocation', specialField: true },
            { label: 'Was Defended', field: 'wasDefended', simple: true },
            { label: 'Teleop Points', field: 'teleopPoints' }
        ]
    },
    {
        label: 'Stage/End Game',
        fields: [
            { label: 'Climb Percentage', field: 'climbSuccessPercentage', specialField: true },
            { label: 'Trap', field: 'teleopGP.trap' },
            { label: '# of Successful Climbs', field: 'climb.success', simple: true, specialL4MField: true },
            { label: '# of Failed Climbs', field: 'climb.fail', simple: true, specialL4MField: true },
            { label: '# of Not Attempted Climbs', field: 'climb.noAttempt', simple: true, specialL4MField: true },
            { label: 'Climb Location Counts', field: 'climbLocationCounts', specialField: true },
            { label: 'Harmony', field: 'climb.harmony', specialField: true },
            { label: 'Stage Points', field: 'stagePoints' }
        ]
    },
    {
        label: 'Super Scout',
        fields: [
            { label: 'Agility', field: 'agility', superField: true, noShowValue: 1 },
            {
                label: 'Field Awareness',
                field: 'fieldAwareness',
                superField: true,
                noShowValue: 1
            },
            {
                label: 'High Note Percentage',
                field: 'highNotePercentage',
                superField: true,
                specialField: true
            },
            {
                label: 'High Note',
                field: 'ampPlayerGP.highNoteScore',
                superField: true,
                specialField: true
            },
            {
                label: 'High Note Miss',
                field: 'ampPlayerGP.highNoteMiss',
                superField: true,
                specialField: true
            }
        ]
    },
    {
        label: 'Other',
        fields: [
            { label: 'Offensive Points', field: 'offensivePoints' },
            { label: '# of Stand Forms', field: 'standForms', simple: true },
            { label: '# of Super Forms', field: 'superForms', simple: true },
            {
                label: '# of No Shows',
                field: 'noShows',
                simple: true
            },
            {
                label: '# of Lost Comms.',
                field: 'lostCommunication',
                simple: true
            },
            { label: 'Robot Broke', field: 'robotBroke', simple: true },
            { label: 'Yellow Card', field: 'yellowCard', simple: true },
            { label: 'Red Card', field: 'redCard', simple: true }
        ]
    }
];

function TeamStatsList({ teamNumbers, multiTeamEventsDatas, multiTeamMatchForms }) {
    const [matchForms, setMatchForms] = useState(null);

    useLayoutEffect(() => {
        let newMatchForms = {};
        for (const teamNumber of teamNumbers) {
            let matchForms = sortMatches(multiTeamMatchForms[teamNumber]);
            newMatchForms[teamNumber] = [];
            for (const matchForm of matchForms) {
                if (
                    [matchFormStatus.complete, matchFormStatus.noShow].includes(matchForm.standStatus) &&
                    [matchFormStatus.complete, matchFormStatus.noShow].includes(matchForm.superStatus)
                ) {
                    newMatchForms[teamNumber].push(matchForm);
                }
            }
        }
        setMatchForms(newMatchForms);
    }, [teamNumbers, multiTeamMatchForms]);

    function getAverageMaxComponent(field, teamEventData) {
        return (
            <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                Avg: {leafGet(teamEventData, `${field.field}.avg`)}{' '}
                <Text fontSize={'80%'} fontWeight={'semibold'} textAlign={'center'} as={'span'}>
                    Max: {leafGet(teamEventData, `${field.field}.max`)}
                </Text>
            </Text>
        );
    }

    function getNAComponent() {
        return (
            <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                N/A
            </Text>
        );
    }

    function getOverallComponent(field, teamEventData) {
        if (field.specialField) {
            switch (field.field) {
                case 'defenseRating':
                case 'defenseAllocation':
                    if (teamEventData.playedDefense === 0) {
                        return getNAComponent();
                    }
                    return getAverageMaxComponent(field, teamEventData);
                case 'climbSuccessPercentage':
                    if (teamEventData.climb.success + teamEventData.climb.fail === 0) {
                        return getNAComponent();
                    }
                    return (
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            {roundToWhole(leafGet(teamEventData, `${field.field}`) * 100)}
                        </Text>
                    );
                case 'climbLocationCounts':
                    if (teamEventData.climb.success === 0) {
                        return getNAComponent();
                    }
                    return (
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            {`Left: ${teamEventData.climb.left}, Center: ${teamEventData.climb.center}, Right: ${teamEventData.climb.right}`}
                        </Text>
                    );
                case 'harmony':
                    if (teamEventData.climb.success === 0) {
                        return getNAComponent();
                    }
                    return getAverageMaxComponent(field, teamEventData);
                case 'highNotePercentage':
                    if (teamEventData.ampPlayer === 0) {
                        return getNAComponent();
                    }
                    return (
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            {roundToWhole(
                                (teamEventData.ampPlayerGP.highNoteScore /
                                    (teamEventData.ampPlayerGP.highNoteScore +
                                        teamEventData.ampPlayerGP.highNoteMiss)) *
                                    100
                            )}
                        </Text>
                    );
                case 'ampPlayerGP.highNoteScore':
                    if (teamEventData.ampPlayer === 0) {
                        return getNAComponent();
                    }
                    return getAverageMaxComponent(field, teamEventData);

                case 'ampPlayerGP.highNoteMiss':
                    if (teamEventData.ampPlayer === 0) {
                        return getNAComponent();
                    }
                    return getAverageMaxComponent(field, teamEventData);
                default:
                    return (
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            Error getting field component
                        </Text>
                    );
            }
        } else if (!field.simple) {
            return getAverageMaxComponent(field, teamEventData);
        } else {
            return (
                <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                    {leafGet(teamEventData, field.field)}
                </Text>
            );
        }
    }

    function getL4MValues(field, matchForms) {
        let prevFourTotal = 0;
        let lastFourTotal = 0;
        let lastFourMax = 0;
        for (let i = 0; i < matchForms.length; i++) {
            let value;
            if (field.superField && matchForms[i].superStatus === matchFormStatus.noShow) {
                value = field.noShowValue || 0;
            } else if (matchForms[i].standStatus === matchFormStatus.noShow) {
                value = field.noShowValue || 0;
            } else {
                value = leafGet(matchForms[i], field.field);
            }
            if (i < Math.max(1, matchForms.length - 4)) {
                prevFourTotal += value;
            }
            if (i >= Math.max(0, matchForms.length - 4)) {
                lastFourTotal += value;
                if (!field.simple) {
                    lastFourMax = Math.max(lastFourMax, leafGet(matchForms[i], field.field));
                }
            }
        }
        if (!field.simple) {
            prevFourTotal /= Math.max(1, matchForms.length - 4);
            lastFourTotal /= Math.min(matchForms.length, 4);
            return { prevFourTotal, lastFourTotal, lastFourMax };
        } else {
            return { prevFourTotal, lastFourTotal };
        }
    }

    function getL4MSpecialComponentHelper(field, matchForms) {
        let prevFourTotal = 0;
        let lastFourTotal = 0;
        let lastFourMax = 0;
        switch (field.field) {
            case 'defenseRating':
            case 'defenseAllocation':
                for (let i = 0; i < matchForms.length; i++) {
                    let value;
                    if (matchForms[i].standStatus === matchFormStatus.noShow) {
                        value = field.noShowValue || 0;
                    } else {
                        value = leafGet(matchForms[i], field.field);
                    }
                    if (i < Math.max(1, matchForms.length - 4)) {
                        prevFourTotal += value;
                    }
                    if (i >= Math.max(0, matchForms.length - 4)) {
                        lastFourTotal += value;
                        lastFourMax = Math.max(lastFourMax, leafGet(matchForms[i], field.field));
                    }
                }

                if (lastFourTotal === 0) {
                    return getNAComponent();
                }
                prevFourTotal /= Math.max(1, matchForms.length - 4);
                lastFourTotal /= Math.min(matchForms.length, 4);
                return (
                    <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                        Avg: {lastFourTotal}{' '}
                        <Text fontSize={'80%'} fontWeight={'semibold'} textAlign={'center'} as={'span'}>
                            Max: {lastFourMax}
                        </Text>
                        {prevFourTotal > 0 && (
                            <span>
                                {lastFourTotal >= prevFourTotal * 1.25 ? (
                                    <Icon as={FaCircleArrowUp} color={'green'} />
                                ) : lastFourTotal <= prevFourTotal * 0.75 ? (
                                    <Icon as={FaCircleArrowDown} color={'red'} />
                                ) : null}
                            </span>
                        )}
                    </Text>
                );
                break;
            case 'climbSuccessPercentage':
                let prevFourSuccess = 0;
                let prevFourFail = 0;
                let lastFourSuccess = 0;
                let lastFourFail = 0;
                for (let i = 0; i < matchForms.length; i++) {
                    if (matchForms[i].standStatus === matchFormStatus.noShow) {
                        continue;
                    }
                    if (i >= Math.max(0, matchForms.length - 4)) {
                        lastFourSuccess += climbFields[matchForms[i].climb.attempt].field === climbFields.Success.field;
                        lastFourFail += climbFields[matchForms[i].climb.attempt].field === climbFields.Fail.field;
                    }
                    if (i < Math.max(1, matchForms.length - 4)) {
                        prevFourSuccess += climbFields[matchForms[i].climb.attempt].field === climbFields.Success.field;
                        prevFourFail += climbFields[matchForms[i].climb.attempt].field === climbFields.Fail.field;
                    }
                }
                if (lastFourSuccess + lastFourFail === 0) {
                    return getNAComponent();
                }
                let prevFourPercentage = roundToWhole((prevFourSuccess / (prevFourSuccess + prevFourFail)) * 100);
                let lastFourPercentage = roundToWhole((lastFourSuccess / (lastFourSuccess + lastFourFail)) * 100);
                return (
                    <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                        {roundToWhole(leafGet(teamEventData, `${field.field}`) * 100)}

                        {prevFourTotal > 0 && (
                            <span>
                                {lastFourTotal >= prevFourTotal * 1.25 ? (
                                    <Icon as={FaCircleArrowUp} color={'green'} />
                                ) : lastFourTotal <= prevFourTotal * 0.75 ? (
                                    <Icon as={FaCircleArrowDown} color={'red'} />
                                ) : null}
                            </span>
                        )}
                    </Text>
                );
            default:
                return (
                    <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                        Error getting field component
                    </Text>
                );
        }
    }

    function getL4MComponentHelper(field, matchForms) {
        let values = getL4MValues(field, matchForms);
        if (!field.simple) {
            return (
                <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                    Avg: {values.lastFourTotal}{' '}
                    <Text fontSize={'80%'} fontWeight={'semibold'} textAlign={'center'} as={'span'}>
                        Max: {values.lastFourMax}
                    </Text>
                    <span>
                        {values.lastFourTotal >= values.prevFourTotal * 1.25 ? (
                            <Icon as={FaCircleArrowUp} color={'green'} />
                        ) : values.lastFourTotal <= values.prevFourTotal * 0.75 ? (
                            <Icon as={FaCircleArrowDown} color={'red'} />
                        ) : null}
                    </span>
                </Text>
            );
        } else {
            return (
                <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                    {values.lastFourTotal}
                    <span>
                        {values.lastFourTotal >= values.prevFourTotal * 1.25 ? (
                            <Icon as={FaCircleArrowUp} color={'green'} />
                        ) : values.lastFourTotal <= values.prevFourTotal * 0.75 ? (
                            <Icon as={FaCircleArrowDown} color={'red'} />
                        ) : null}
                    </span>
                </Text>
            );
        }
    }

    function getL4MCompoenent(field, matchForms) {
        let lastFourForms = matchForms.slice(-4);
        if (field.specialField || field.specialL4MField) {
            switch (field.field) {
                case 'defenseRating':
                case 'defenseAllocation':
                    let playedDefense = 0;
                    for (const matchForm of lastFourForms) {
                        playedDefense += matchForm.defenseRating !== 0;
                    }
                    if (playedDefense === 0) {
                        return getNAComponent();
                    } else {
                        return getL4MSpecialComponentHelper();
                    }

                default:
                    return (
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            Error getting field component
                        </Text>
                    );
            }
        } else {
            return getL4MComponentHelper(field, matchForms);
        }
    }

    if (matchForms === null) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Flex
            margin={'0 auto'}
            width={'100%'}
            flexWrap={'wrap'}
            columnGap={'50px'}
            rowGap={'20px'}
            justifyContent={'center'}
        >
            {teamNumbers.map((teamNumber) => (
                <Flex
                    key={teamNumber}
                    justifyContent={'center'}
                    width={{ base: '90%', lg: `calc(90% / ${Math.min(teamNumbers.length, 3)})` }}
                    height={{ base: '50vh', lg: `calc(100vh / ${teamNumbers.length > 3 ? 3 : 2})` }}
                >
                    {multiTeamEventsDatas[teamNumber] && matchForms[teamNumber].length > 0 ? (
                        <Box
                            height={{ base: '50vh', lg: `calc(100vh / ${teamNumbers.length > 3 ? 3 : 2})` }}
                            overflowY={'auto'}
                        >
                            <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                {teamNumber}
                            </Text>
                            <Grid templateColumns={'2fr 5fr 5fr'}>
                                {fields.map((mainField, index) => (
                                    <React.Fragment key={mainField.label}>
                                        <GridItem
                                            colSpan={3}
                                            backgroundColor={'gray.300'}
                                            padding={'5px 0px'}
                                            borderBottom={'1px solid black'}
                                            position={'sticky'}
                                            top={0}
                                            zIndex={index + 1}
                                        >
                                            <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                                {mainField.label}
                                            </Text>
                                        </GridItem>
                                        <GridItem
                                            display={'flex'}
                                            justifyContent={'center'}
                                            alignItems={'center'}
                                            backgroundColor={'gray.300'}
                                            borderBottom={'1px solid black'}
                                            borderRight={'1px solid black'}
                                            padding={'5px 5px'}
                                            position={'sticky'}
                                            top={'38px'}
                                            zIndex={index + 1}
                                        >
                                            <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                                                Field
                                            </Text>
                                        </GridItem>
                                        <GridItem
                                            display={'flex'}
                                            justifyContent={'center'}
                                            alignItems={'center'}
                                            backgroundColor={'gray.300'}
                                            borderBottom={'1px solid black'}
                                            borderRight={'1px solid black'}
                                            position={'sticky'}
                                            top={'38px'}
                                            zIndex={index + 1}
                                        >
                                            <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                                                Event
                                            </Text>
                                        </GridItem>
                                        <GridItem
                                            display={'flex'}
                                            justifyContent={'center'}
                                            alignItems={'center'}
                                            backgroundColor={'gray.300'}
                                            borderBottom={'1px solid black'}
                                            position={'sticky'}
                                            top={'38px'}
                                            zIndex={index + 1}
                                        >
                                            <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                                                Last 4 Matches
                                            </Text>
                                        </GridItem>
                                        {mainField.fields.map((subField) => (
                                            <React.Fragment key={mainField.label + subField.label}>
                                                <GridItem
                                                    display={'flex'}
                                                    justifyContent={'center'}
                                                    alignItems={'center'}
                                                    backgroundColor={'gray.100'}
                                                    borderBottom={'1px solid black'}
                                                    borderRight={'1px solid black'}
                                                    padding={'5px 5px'}
                                                >
                                                    <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                                                        {subField.label}
                                                    </Text>
                                                </GridItem>
                                                <GridItem
                                                    display={'flex'}
                                                    justifyContent={'center'}
                                                    alignItems={'center'}
                                                    backgroundColor={'gray.200'}
                                                    borderBottom={'1px solid black'}
                                                    borderRight={'1px solid black'}
                                                >
                                                    <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                                                        {getOverallComponent(
                                                            subField,
                                                            multiTeamEventsDatas[teamNumber]
                                                        )}
                                                    </Text>
                                                </GridItem>
                                                <GridItem
                                                    display={'flex'}
                                                    justifyContent={'center'}
                                                    alignItems={'center'}
                                                    backgroundColor={'gray.200'}
                                                    borderBottom={'1px solid black'}
                                                >
                                                    <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                                                        {getOverallComponent(
                                                            subField,
                                                            multiTeamEventsDatas[teamNumber]
                                                        )}
                                                    </Text>
                                                </GridItem>
                                            </React.Fragment>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </Grid>
                        </Box>
                    ) : (
                        <Box key={teamNumber} fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'}>
                            Need at least one stand and super form completed
                        </Box>
                    )}
                </Flex>
            ))}
        </Flex>
    );
}

export default TeamStatsList;

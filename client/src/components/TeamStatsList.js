import React, { useLayoutEffect, useState } from 'react';
import { leafGet, roundToWhole, sortMatches } from '../util/helperFunctions';
import { climbFields, matchFormStatus } from '../util/helperConstants';
import { Box, Center, Flex, Grid, GridItem, Icon, Spinner, Text } from '@chakra-ui/react';
import { FaCircleArrowDown, FaCircleArrowRight, FaCircleArrowUp } from 'react-icons/fa6';

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
            { label: 'Agility', field: 'agility', noShowValue: 1, superField: true },
            {
                label: 'Field Awareness',
                field: 'fieldAwareness',
                noShowValue: 1,
                superField: true
            },
            {
                label: 'High Note Percentage',
                field: 'highNotePercentage',
                specialField: true
            },
            {
                label: 'High Note',
                field: 'ampPlayerGP.highNoteScore',
                specialField: true
            },
            {
                label: 'High Note Miss',
                field: 'ampPlayerGP.highNoteMiss',
                specialField: true
            }
        ]
    },
    {
        label: 'Other',
        fields: [
            { label: 'Offensive Points', field: 'offensivePoints' },

            {
                label: '# of No Shows',
                field: 'noShows',
                simple: true,
                specialL4MField: true
            },
            {
                label: '# of Lost Comms.',
                field: 'lostCommunication',
                simple: true
            },
            { label: 'Robot Broke', field: 'robotBroke', simple: true },
            { label: 'Yellow Card', field: 'yellowCard', simple: true },
            { label: 'Red Card', field: 'redCard', simple: true },
            { label: '# of Stand Forms', field: 'standForms', simple: true, specialL4MField: true },
            { label: '# of Super Forms', field: 'superForms', simple: true, specialL4MField: true }
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
                            {roundToWhole(leafGet(teamEventData, `${field.field}`) * 100)}%
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
                case 'climb.harmony':
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
                                (teamEventData.ampPlayerGP.highNoteScore.total /
                                    (teamEventData.ampPlayerGP.highNoteScore.total +
                                        teamEventData.ampPlayerGP.highNoteMiss.total)) *
                                    100
                            )}
                            %
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

    function getLastFourMatchIndex(matchForms) {
        if (matchForms.length > 8) {
            //This is the breakpoint when we can actually get the last four matches
            return matchForms.length - 4;
        } else {
            return Math.ceil(matchForms.length / 2);
        }
    }

    function getL4MValues(field, matchForms) {
        let prevFourTotal = 0;
        let prevFourMatchCount = 0;
        let lastFourTotal = 0;
        let lastFourMax = 0;
        let lastFourMatchCount = 0;
        let lastFourMatchIndex = getLastFourMatchIndex(matchForms);
        for (let i = 0; i < matchForms.length; i++) {
            let value;
            if (field.superField && matchForms[i].superStatus === matchFormStatus.noShow) {
                // This is really only for agility and field awareness since we want to count a noShow as 1 rating
                if (field.noShowValue) {
                    value = field.noShowValue;
                } else {
                    continue;
                }
            } else if (matchForms[i].standStatus === matchFormStatus.noShow) {
                continue;
            } else {
                value = leafGet(matchForms[i], field.field);
            }
            if (i < lastFourMatchIndex) {
                prevFourTotal += value;
                prevFourMatchCount += 1;
            }
            if (i >= lastFourMatchIndex || matchForms.length === 1) {
                lastFourTotal += value;
                if (!field.simple) {
                    lastFourMax = Math.max(lastFourMax, leafGet(matchForms[i], field.field));
                }
                lastFourMatchCount += 1;
            }
        }
        if (!field.simple) {
            prevFourTotal /= prevFourMatchCount;
            lastFourTotal /= lastFourMatchCount;
            return { prevFourTotal, lastFourTotal, lastFourMax };
        } else {
            return { prevFourTotal, lastFourTotal };
        }
    }

    function getL4MSpecialComponentHelper(field, matchForms) {
        let prevFourTotal = 0;
        let lastFourTotal = 0;
        let lastFourMax = 0;
        let prevFourPercentage;
        let lastFourPercentage;
        let lastFourMatchIndex = getLastFourMatchIndex(matchForms);
        switch (field.field) {
            case 'defenseRating':
            case 'defenseAllocation':
                let prevFourPlayedDefense = 0;
                let lastFourPlayedDefense = 0;
                for (let i = 0; i < matchForms.length; i++) {
                    let value;
                    if (matchForms[i].standStatus === matchFormStatus.noShow) {
                        value = field.noShowValue || 0;
                    } else {
                        value = leafGet(matchForms[i], field.field);
                    }
                    if (i < lastFourMatchIndex) {
                        if (matchForms[i].defenseRating > 0) {
                            prevFourTotal += value;
                            prevFourPlayedDefense += 1;
                        }
                    }
                    if (i >= lastFourMatchIndex || matchForms.length === 1) {
                        if (matchForms[i].defenseRating > 0) {
                            lastFourTotal += value;
                            lastFourMax = Math.max(lastFourMax, leafGet(matchForms[i], field.field));
                            lastFourPlayedDefense += 1;
                        }
                    }
                }

                if (lastFourPlayedDefense === 0) {
                    return getNAComponent();
                }
                prevFourTotal /= prevFourPlayedDefense;
                lastFourTotal /= lastFourPlayedDefense;
                return (
                    <Flex>
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            Avg: {lastFourTotal}{' '}
                            <Text fontSize={'80%'} fontWeight={'semibold'} textAlign={'center'} as={'span'}>
                                Max: {lastFourMax}
                            </Text>
                        </Text>
                        {prevFourPlayedDefense > 0 && field.field !== 'defenseAllocation' && (
                            <Center>
                                {lastFourTotal >= prevFourTotal * 1.25 ? (
                                    <Icon as={FaCircleArrowUp} color={'green'} />
                                ) : lastFourTotal <= prevFourTotal * 0.75 ? (
                                    <Icon as={FaCircleArrowDown} color={'red'} />
                                ) : (
                                    <Icon as={FaCircleArrowRight} color={'gray'} />
                                )}
                            </Center>
                        )}
                    </Flex>
                );
            case 'climbSuccessPercentage':
                let prevFourSuccess = 0;
                let prevFourFail = 0;
                let lastFourSuccess = 0;
                let lastFourFail = 0;
                for (let i = 0; i < matchForms.length; i++) {
                    if (matchForms[i].standStatus === matchFormStatus.noShow) {
                        continue;
                    }
                    if (i < lastFourMatchIndex) {
                        prevFourSuccess += climbFields[matchForms[i].climb.attempt].field === climbFields.Success.field;
                        prevFourFail += climbFields[matchForms[i].climb.attempt].field === climbFields.Fail.field;
                    }
                    if (i >= lastFourMatchIndex || matchForms.length === 1) {
                        lastFourSuccess += climbFields[matchForms[i].climb.attempt].field === climbFields.Success.field;
                        lastFourFail += climbFields[matchForms[i].climb.attempt].field === climbFields.Fail.field;
                    }
                }
                if (lastFourSuccess + lastFourFail === 0) {
                    return getNAComponent();
                }
                prevFourPercentage =
                    prevFourSuccess + prevFourFail === 0
                        ? 0
                        : roundToWhole((prevFourSuccess / (prevFourSuccess + prevFourFail)) * 100);
                lastFourPercentage = roundToWhole((lastFourSuccess / (lastFourSuccess + lastFourFail)) * 100);
                return (
                    <Flex>
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            {lastFourPercentage}%
                        </Text>
                        <Center>
                            {lastFourPercentage >= prevFourPercentage * 1.25 ? (
                                <Icon as={FaCircleArrowUp} color={'green'} />
                            ) : lastFourPercentage <= prevFourPercentage * 0.75 ? (
                                <Icon as={FaCircleArrowDown} color={'red'} />
                            ) : (
                                <Icon as={FaCircleArrowRight} color={'gray'} />
                            )}
                        </Center>
                    </Flex>
                );
            case 'climb.success':
            case 'climb.fail':
            case 'climb.noAttempt':
                let climbFieldToCount;
                if (field.field === 'climb.success') {
                    climbFieldToCount = climbFields.Success.field;
                } else if (field.field === 'climb.fail') {
                    climbFieldToCount = climbFields.Fail.field;
                } else {
                    climbFieldToCount = climbFields['No Attempt'].field;
                }
                for (let i = 0; i < matchForms.length; i++) {
                    let value;
                    if (matchForms[i].standStatus === matchFormStatus.noShow) {
                        continue;
                    } else {
                        value = climbFields[matchForms[i].climb.attempt] === climbFieldToCount;
                    }
                    if (i >= lastFourMatchIndex || matchForms.length === 1) {
                        lastFourTotal += value;
                    }
                }
                return (
                    <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                        {lastFourTotal}
                    </Text>
                );
            case 'climbLocationCounts':
                let climbCounts = { left: 0, center: 0, right: 0 };
                for (let i = 0; i < matchForms.length; i++) {
                    if (matchForms[i].standStatus === matchFormStatus.noShow) {
                        continue;
                    }
                    if (i >= lastFourMatchIndex || matchForms.length === 1) {
                        if (matchForms[i].climb.location !== null) {
                            climbCounts[climbFields[matchForms[i].climb.location].field] += 1;
                        }
                    }
                }
                if (climbCounts.left + climbCounts.center + climbCounts.right === 0) {
                    return getNAComponent();
                } else {
                    return (
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            {`Left: ${climbCounts.left}, Center: ${climbCounts.center}, Right: ${climbCounts.right}`}
                        </Text>
                    );
                }
            case 'climb.harmony':
                let lastFourSuccessfulClimbs = 0;
                for (let i = 0; i < matchForms.length; i++) {
                    if (matchForms[i].standStatus === matchFormStatus.noShow) {
                        continue;
                    }
                    if (i >= lastFourMatchIndex || matchForms.length === 1) {
                        if (matchForms[i].climb.harmony !== null) {
                            lastFourTotal += matchForms[i].climb.harmony;
                            lastFourMax = Math.max(lastFourMax, matchForms[i].climb.harmony);
                            lastFourSuccessfulClimbs += 1;
                        }
                    }
                }

                if (lastFourSuccessfulClimbs === 0) {
                    return getNAComponent();
                }
                lastFourTotal /= lastFourSuccessfulClimbs;
                return (
                    <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                        Avg: {lastFourTotal}{' '}
                        <Text fontSize={'80%'} fontWeight={'semibold'} textAlign={'center'} as={'span'}>
                            Max: {lastFourMax}
                        </Text>
                    </Text>
                );
            case 'highNotePercentage':
                let prevFourScore = 0;
                let prevFourMiss = 0;
                let lastFourScore = 0;
                let lastFourMiss = 0;
                for (let i = 0; i < matchForms.length; i++) {
                    if (matchForms[i].superStatus === matchFormStatus.noShow) {
                        continue;
                    }
                    if (i < lastFourMatchIndex) {
                        prevFourScore += matchForms[i].ampPlayerGP.highNoteScore;
                        prevFourMiss += matchForms[i].ampPlayerGP.highNoteMiss;
                    }
                    if (i >= lastFourMatchIndex || matchForms.length === 1) {
                        lastFourScore += matchForms[i].ampPlayerGP.highNoteScore;
                        lastFourMiss += matchForms[i].ampPlayerGP.highNoteMiss;
                    }
                }
                if (lastFourScore + lastFourMiss === 0) {
                    return getNAComponent();
                }
                prevFourPercentage =
                    prevFourScore + prevFourMiss === 0
                        ? 0
                        : roundToWhole((prevFourSuccess / (prevFourSuccess + prevFourFail)) * 100);
                lastFourPercentage = roundToWhole((lastFourScore / (lastFourScore + lastFourMiss)) * 100);
                return (
                    <Flex>
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            {lastFourPercentage}%
                        </Text>
                        <Center>
                            {lastFourPercentage >= prevFourPercentage * 1.25 ? (
                                <Icon as={FaCircleArrowUp} color={'green'} />
                            ) : lastFourPercentage <= prevFourPercentage * 0.75 ? (
                                <Icon as={FaCircleArrowDown} color={'red'} />
                            ) : (
                                <Icon as={FaCircleArrowRight} color={'gray'} />
                            )}
                        </Center>
                    </Flex>
                );
            case 'ampPlayerGP.highNoteScore':
            case 'ampPlayerGP.highNoteMiss':
                let ampPlayerCount = 0;
                for (let i = 0; i < matchForms.length; i++) {
                    if (matchForms[i].superStatus === matchFormStatus.noShow) {
                        continue;
                    }
                    if (i >= lastFourMatchIndex || matchForms.length === 1) {
                        if (matchForms[i].ampPlayer) {
                            lastFourTotal += leafGet(matchForms[i], field.field);
                            ampPlayerCount += 1;
                        }
                    }
                }

                if (ampPlayerCount === 0) {
                    return getNAComponent();
                }
                return (
                    <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                        {lastFourTotal}
                    </Text>
                );
            case 'noShows':
                for (let i = 0; i < matchForms.length; i++) {
                    let value = 0;
                    if (matchForms[i].standStatus === matchFormStatus.noShow) {
                        value = 1;
                    }
                    if (i >= lastFourMatchIndex || matchForms.length === 1) {
                        lastFourTotal += value;
                    }
                }
                return (
                    <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                        {lastFourTotal}
                    </Text>
                );
            case 'standForms':
            case 'superForms':
                return getNAComponent();
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
                <Flex>
                    <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                        Avg: {values.lastFourTotal}{' '}
                        <Text fontSize={'80%'} fontWeight={'semibold'} textAlign={'center'} as={'span'}>
                            Max: {values.lastFourMax}
                        </Text>
                    </Text>
                    <Center>
                        {values.lastFourTotal > values.prevFourTotal * 1.25 ? (
                            <Icon as={FaCircleArrowUp} color={'green'} />
                        ) : values.lastFourTotal < values.prevFourTotal * 0.75 ? (
                            <Icon as={FaCircleArrowDown} color={'red'} />
                        ) : (
                            <Icon as={FaCircleArrowRight} color={'gray'} />
                        )}
                    </Center>
                </Flex>
            );
        } else {
            return (
                <Flex>
                    <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                        {values.lastFourTotal}
                    </Text>
                    <Center>
                        {values.lastFourTotal > values.prevFourTotal * 1.25 ? (
                            <Icon as={FaCircleArrowUp} color={'green'} />
                        ) : values.lastFourTotal < values.prevFourTotal * 0.75 ? (
                            <Icon as={FaCircleArrowDown} color={'red'} />
                        ) : (
                            <Icon as={FaCircleArrowRight} color={'gray'} />
                        )}
                    </Center>
                </Flex>
            );
        }
    }

    function getL4MCompoenent(field, matchForms) {
        if (field.specialField || field.specialL4MField) {
            return getL4MSpecialComponentHelper(field, matchForms);
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
                                                Last{' '}
                                                {matchForms[teamNumber].length === 1
                                                    ? 1
                                                    : matchForms[teamNumber].length -
                                                      getLastFourMatchIndex(matchForms[teamNumber])}{' '}
                                                Matches
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
                                                    {getOverallComponent(subField, multiTeamEventsDatas[teamNumber])}
                                                </GridItem>
                                                <GridItem
                                                    display={'flex'}
                                                    justifyContent={'center'}
                                                    alignItems={'center'}
                                                    backgroundColor={'gray.200'}
                                                    borderBottom={'1px solid black'}
                                                >
                                                    {getL4MCompoenent(subField, matchForms[teamNumber])}
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

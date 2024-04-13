import React, { useLayoutEffect, useState } from 'react';
import { leafGet, roundToTenth, roundToWhole, sortMatches } from '../util/helperFunctions';
import { climbFields, matchFormStatus } from '../util/helperConstants';
import { Box, Button, Center, Flex, Grid, GridItem, Icon, Spinner, Text } from '@chakra-ui/react';
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
            { label: 'Ferry', field: 'autoGP.autoFerry' },
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
            { label: 'Subwoofer Speaker', field: 'teleopGP.subwooferScore' },
            { label: 'Subwoofer Speaker Miss', field: 'teleopGP.subwooferMiss' },
            { label: 'Range Speaker', field: 'teleopGP.otherScore' },
            { label: 'Range Speaker Miss', field: 'teleopGP.otherMiss' },
            { label: 'Deposit Ferry', field: 'teleopGP.ferry' },
            { label: 'Shot Ferry', field: 'teleopGP.centerFerry' },
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
            { label: 'Climb Location Counts', field: 'climbLocationCounts', specialField: true },
            { label: 'Harmony', field: 'climb.harmony', specialField: true },
            { label: '# of Successful Climbs', field: 'climb.success', simple: true, specialL4MField: true },
            { label: '# of Failed Climbs', field: 'climb.fail', simple: true, specialL4MField: true },
            { label: '# of Parks', field: 'climb.park', simple: true, specialL4MField: true },
            { label: '# of Not Attempted Climbs', field: 'climb.noAttempt', simple: true, specialL4MField: true },
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

function TeamStatsList({ teamNumbers, multiTeamEventsData, multiTeamMatchForms, onTeamPage = true }) {
    const [standForms, setStandForms] = useState(null);
    const [superForms, setSuperForms] = useState(null);
    const [lastFourMatchesVisible, setlastFourMatchesVisible] = useState(
        Object.fromEntries(teamNumbers.map((teamNumber) => [teamNumber, false]))
    );

    useLayoutEffect(() => {
        let standForms = {};
        let superForms = {};
        for (const teamNumber of teamNumbers) {
            let matchForms = sortMatches(multiTeamMatchForms[teamNumber]);
            standForms[teamNumber] = [];
            superForms[teamNumber] = [];
            for (const matchForm of matchForms) {
                if ([matchFormStatus.complete, matchFormStatus.noShow].includes(matchForm.standStatus)) {
                    standForms[teamNumber].push(matchForm);
                }
                if ([matchFormStatus.complete, matchFormStatus.noShow].includes(matchForm.superStatus)) {
                    superForms[teamNumber].push(matchForm);
                }
            }
        }
        setStandForms(standForms);
        setSuperForms(superForms);
    }, [teamNumbers, multiTeamMatchForms]);

    function getAverageMaxComponent(field, teamEventData) {
        return (
            <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                Avg: {roundToTenth(leafGet(teamEventData, `${field.field}.avg`))}{' '}
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
                            {`Center: ${teamEventData.climb.center}, Side: ${teamEventData.climb.side}`}
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

    function getLastFourMatchIndex(matchFormsLength) {
        if (matchFormsLength > 8) {
            //This is the breakpoint when we can actually get the last four matches
            return matchFormsLength - 4;
        } else {
            return Math.ceil(matchFormsLength / 2);
        }
    }

    function getLastFourMatchString(standFormsLength, superFormsLength) {
        if (standFormsLength !== superFormsLength) {
            let standFormString;
            let superFormString;

            if (standFormsLength === 1) {
                standFormString = 'Only 1 Stand Form';
            } else {
                standFormString = `Last ${
                    standFormsLength === 1 ? 1 : standFormsLength - getLastFourMatchIndex(standFormsLength)
                } Stand Forms(s)`;
            }

            if (superFormsLength === 1) {
                superFormString = 'Only 1 Super Form';
            } else {
                superFormString = `Last ${
                    superFormsLength === 1 ? 1 : superFormsLength - getLastFourMatchIndex(superFormsLength)
                } Super Forms(s)`;
            }

            return `${standFormString}\n${superFormString}`;
        } else {
            if (standFormsLength === 1) {
                return `Only 1 Match Form`;
            }
            return `Last ${
                standFormsLength === 1 ? 1 : standFormsLength - getLastFourMatchIndex(standFormsLength)
            } Match(s)`;
        }
    }

    function getL4MValues(field, standForms, superForms) {
        let matchForms = field.superField ? superForms : standForms;
        let prevFourTotal = 0;
        let prevFourMatchCount = 0;
        let lastFourTotal = 0;
        let lastFourMax = 0;
        let lastFourMatchCount = 0;
        let lastFourMatchIndex = getLastFourMatchIndex(matchForms.length);
        for (let i = 0; i < matchForms.length; i++) {
            let value;
            if (field.superField && matchForms[i].superStatus === matchFormStatus.noShow) {
                // This is really only for agility and field awareness since we want to count a noShow as 1 rating
                if (field.noShowValue) {
                    value = field.noShowValue;
                } else {
                    continue;
                }
            } else if (!field.superField && matchForms[i].standStatus === matchFormStatus.noShow) {
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

    function getL4MSpecialComponentHelper(field, standForms, superForms) {
        let matchForms = field.superField ? superForms : standForms;
        let prevFourTotal = 0;
        let lastFourTotal = 0;
        let lastFourMax = 0;
        let prevFourPercentage;
        let lastFourPercentage;
        let lastFourMatchIndex = getLastFourMatchIndex(matchForms.length);
        switch (field.field) {
            case 'defenseRating':
            case 'defenseAllocation':
                let prevFourPlayedDefense = 0;
                let lastFourPlayedDefense = 0;
                for (let i = 0; i < matchForms.length; i++) {
                    let value;
                    if (matchForms[i].standStatus === matchFormStatus.noShow) {
                        continue;
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
                    <Flex columnGap={'10px'}>
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            Avg: {roundToTenth(lastFourTotal)}{' '}
                            <Text fontSize={'80%'} fontWeight={'semibold'} textAlign={'center'} as={'span'}>
                                Max: {lastFourMax}
                            </Text>
                        </Text>
                        {prevFourPlayedDefense > 0 && field.field !== 'defenseAllocation' && (
                            <Center>
                                {lastFourTotal >= prevFourTotal * 1.25 ? (
                                    <Icon as={FaCircleArrowUp} boxSize={'1.25rem'} color={'green'} />
                                ) : lastFourTotal <= prevFourTotal * 0.75 ? (
                                    <Icon as={FaCircleArrowDown} boxSize={'1.25rem'} color={'crimson'} />
                                ) : (
                                    <Icon as={FaCircleArrowRight} boxSize={'1.25rem'} color={'gray'} />
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
                    <Flex columnGap={'10px'}>
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            {lastFourPercentage}%
                        </Text>
                        <Center>
                            {lastFourPercentage >= prevFourPercentage * 1.25 ? (
                                <Icon as={FaCircleArrowUp} boxSize={'1.25rem'} color={'green'} />
                            ) : lastFourPercentage <= prevFourPercentage * 0.75 ? (
                                <Icon as={FaCircleArrowDown} boxSize={'1.25rem'} color={'crimson'} />
                            ) : (
                                <Icon as={FaCircleArrowRight} boxSize={'1.25rem'} color={'gray'} />
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
                        value = climbFields[matchForms[i].climb.attempt].field === climbFieldToCount;
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
            case 'climb.park':
                for (let i = 0; i < matchForms.length; i++) {
                    let value;
                    if (matchForms[i].standStatus === matchFormStatus.noShow) {
                        continue;
                    } else {
                        value = matchForms[i].climb.park;
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
                let climbCounts = { center: 0, side: 0 };
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
                if (climbCounts.center + climbCounts.side === 0) {
                    return getNAComponent();
                } else {
                    return (
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            {`Center: ${climbCounts.center}, Side: ${climbCounts.side}`}
                        </Text>
                    );
                }
            case 'climb.harmony':
                let lastFourSuccessfulClimbs = 0;
                let prevFourSuccessfulClimbs = 0;
                for (let i = 0; i < matchForms.length; i++) {
                    if (matchForms[i].standStatus === matchFormStatus.noShow) {
                        continue;
                    }
                    if (i < lastFourMatchIndex) {
                        if (matchForms[i].climb.harmony !== null) {
                            prevFourTotal += matchForms[i].climb.harmony;
                            prevFourSuccessfulClimbs += 1;
                        }
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
                prevFourTotal = prevFourSuccessfulClimbs === 0 ? 0 : prevFourTotal / prevFourSuccessfulClimbs;
                lastFourTotal /= lastFourSuccessfulClimbs;
                return (
                    <Flex columnGap={'10px'}>
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            Avg: {roundToTenth(lastFourTotal)}{' '}
                            <Text fontSize={'80%'} fontWeight={'semibold'} textAlign={'center'} as={'span'}>
                                Max: {lastFourMax}
                            </Text>
                        </Text>
                        <Center>
                            {lastFourTotal > prevFourTotal * 1.25 ? (
                                <Icon as={FaCircleArrowUp} boxSize={'1.25rem'} color={'green'} />
                            ) : lastFourTotal < prevFourTotal * 0.75 ? (
                                <Icon as={FaCircleArrowDown} boxSize={'1.25rem'} color={'crimson'} />
                            ) : (
                                <Icon as={FaCircleArrowRight} boxSize={'1.25rem'} color={'gray'} />
                            )}
                        </Center>
                    </Flex>
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
                        : roundToWhole((prevFourScore / (prevFourScore + prevFourMiss)) * 100);
                lastFourPercentage = roundToWhole((lastFourScore / (lastFourScore + lastFourMiss)) * 100);
                return (
                    <Flex columnGap={'10px'}>
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            {lastFourPercentage}%
                        </Text>
                        <Center>
                            {lastFourPercentage >= prevFourPercentage * 1.25 ? (
                                <Icon as={FaCircleArrowUp} boxSize={'1.25rem'} color={'green'} />
                            ) : lastFourPercentage <= prevFourPercentage * 0.75 ? (
                                <Icon as={FaCircleArrowDown} boxSize={'1.25rem'} color={'crimson'} />
                            ) : (
                                <Icon as={FaCircleArrowRight} boxSize={'1.25rem'} color={'gray'} />
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
                    if (i < lastFourMatchIndex) {
                        prevFourTotal += value;
                    }
                    if (i >= lastFourMatchIndex || matchForms.length === 1) {
                        lastFourTotal += value;
                    }
                }
                return (
                    <Flex columnGap={'10px'}>
                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                            {lastFourTotal}
                        </Text>
                        <Center>
                            {lastFourTotal > prevFourTotal * 1.25 ? (
                                <Icon as={FaCircleArrowUp} boxSize={'1.25rem'} color={'green'} />
                            ) : lastFourTotal < prevFourTotal * 0.75 ? (
                                <Icon as={FaCircleArrowDown} boxSize={'1.25rem'} color={'crimson'} />
                            ) : (
                                <Icon as={FaCircleArrowRight} boxSize={'1.25rem'} color={'gray'} />
                            )}
                        </Center>
                    </Flex>
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

    function getL4MComponentHelper(field, standForms, superForms) {
        let values = getL4MValues(field, standForms, superForms);
        if (!field.simple) {
            return (
                <Flex columnGap={'10px'}>
                    <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                        Avg: {roundToTenth(values.lastFourTotal)}{' '}
                        <Text fontSize={'80%'} fontWeight={'semibold'} textAlign={'center'} as={'span'}>
                            Max: {values.lastFourMax}
                        </Text>
                    </Text>
                    <Center>
                        {values.lastFourTotal > values.prevFourTotal * 1.25 ? (
                            <Icon as={FaCircleArrowUp} boxSize={'1.25rem'} color={'green'} />
                        ) : values.lastFourTotal < values.prevFourTotal * 0.75 ? (
                            <Icon as={FaCircleArrowDown} boxSize={'1.25rem'} color={'crimson'} />
                        ) : (
                            <Icon as={FaCircleArrowRight} boxSize={'1.25rem'} color={'gray'} />
                        )}
                    </Center>
                </Flex>
            );
        } else {
            return (
                <Flex columnGap={'10px'}>
                    <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                        {values.lastFourTotal}
                    </Text>
                    <Center>
                        {values.lastFourTotal > values.prevFourTotal * 1.25 ? (
                            <Icon as={FaCircleArrowUp} boxSize={'1.25rem'} color={'green'} />
                        ) : values.lastFourTotal < values.prevFourTotal * 0.75 ? (
                            <Icon as={FaCircleArrowDown} boxSize={'1.25rem'} color={'crimson'} />
                        ) : (
                            <Icon as={FaCircleArrowRight} boxSize={'1.25rem'} color={'gray'} />
                        )}
                    </Center>
                </Flex>
            );
        }
    }

    function getL4MCompoenent(field, standForms, superForms) {
        if (field.specialField || field.specialL4MField) {
            return getL4MSpecialComponentHelper(field, standForms, superForms);
        } else {
            return getL4MComponentHelper(field, standForms, superForms);
        }
    }

    if (standForms === null && superForms === null) {
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
            rowGap={'40px'}
            justifyContent={'center'}
        >
            {teamNumbers.map((teamNumber, index) => (
                <Flex
                    key={teamNumber}
                    justifyContent={'center'}
                    width={{ base: '90%', lg: `calc(90% / ${Math.min(teamNumbers.length, 3)})` }}
                    height={
                        !multiTeamEventsData[teamNumber] ||
                        standForms[teamNumber].length === 0 ||
                        superForms[teamNumber].length === 0
                            ? 'fit-content'
                            : {
                                  base: `max(60vh, 280px + ${50 + (!onTeamPage ? 27 : 0)}px)`,
                                  lg: `max(calc(120vh / ${teamNumbers.length > 3 ? 3 : 2}), 280px + ${
                                      50 + (!onTeamPage ? 27 : 0)
                                  }px)`
                              }
                    }
                >
                    {multiTeamEventsData[teamNumber] &&
                    standForms[teamNumber].length > 0 &&
                    superForms[teamNumber].length > 0 ? (
                        <Box width={{ base: '100%', lg: onTeamPage ? '50%' : '100%' }}>
                            {!onTeamPage && (
                                <Text
                                    fontSize={'xl'}
                                    fontWeight={'semibold'}
                                    textAlign={'center'}
                                    color={index > 2 ? 'blue.500' : 'red.500'}
                                >
                                    {index > 2 ? `Blue ${index - 2}: ${teamNumber}` : `Red ${index + 1}: ${teamNumber}`}
                                </Text>
                            )}
                            <Flex justifyContent={'center'} columnGap={'25px'} marginBottom={'10px'}>
                                <Button
                                    width={'125px'}
                                    colorScheme={!lastFourMatchesVisible[teamNumber] ? 'green' : 'gray'}
                                    onClick={() =>
                                        setlastFourMatchesVisible({
                                            ...lastFourMatchesVisible,
                                            [teamNumber]: false
                                        })
                                    }
                                >
                                    Event
                                </Button>
                                <Button
                                    width={'125px'}
                                    colorScheme={lastFourMatchesVisible[teamNumber] ? 'green' : 'gray'}
                                    onClick={() =>
                                        setlastFourMatchesVisible({ ...lastFourMatchesVisible, [teamNumber]: true })
                                    }
                                >
                                    Most Recent
                                </Button>
                            </Flex>
                            <Box
                                height={{
                                    base: `max(calc(60vh - ${50 + (!onTeamPage ? 27 : 0)}px), 280px)`,
                                    lg: `max(calc(120vh / ${teamNumbers.length > 3 ? 3 : 2} - ${
                                        50 + (!onTeamPage ? 27 : 0)
                                    }px), 280px)`
                                }}
                                overflowY={'auto'}
                                borderRadius={'5px'}
                            >
                                <Grid templateColumns={'2fr 5fr'}>
                                    {fields.map((mainField, index) => (
                                        <React.Fragment key={mainField.label}>
                                            <GridItem
                                                colSpan={2}
                                                backgroundColor={'gray.300'}
                                                padding={'4px 0px'}
                                                borderBottom={'1px solid black'}
                                                position={'sticky'}
                                                top={0}
                                                zIndex={index + 1}
                                            >
                                                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                                    {mainField.label}
                                                </Text>
                                            </GridItem>
                                            {index === 0 && (
                                                <React.Fragment>
                                                    <GridItem
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        backgroundColor={'gray.300'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        padding={'4px 0px'}
                                                    >
                                                        <Text
                                                            fontSize={'md'}
                                                            fontWeight={'semibold'}
                                                            textAlign={'center'}
                                                        >
                                                            Field
                                                        </Text>
                                                    </GridItem>
                                                    <GridItem
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        backgroundColor={'gray.300'}
                                                        borderBottom={'1px solid black'}
                                                        padding={'3px 0px'}
                                                    >
                                                        <Text
                                                            fontSize={'md'}
                                                            fontWeight={'semibold'}
                                                            textAlign={'center'}
                                                            whiteSpace={'pre-line'}
                                                        >
                                                            {lastFourMatchesVisible[teamNumber]
                                                                ? getLastFourMatchString(
                                                                      standForms[teamNumber].length,
                                                                      superForms[teamNumber].length
                                                                  )
                                                                : 'Event'}
                                                        </Text>
                                                    </GridItem>
                                                </React.Fragment>
                                            )}
                                            {mainField.fields.map((subField) => (
                                                <React.Fragment key={mainField.label + subField.label}>
                                                    <GridItem
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        backgroundColor={'gray.100'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        padding={'10px 5px'}
                                                    >
                                                        <Text
                                                            fontSize={'md'}
                                                            fontWeight={'semibold'}
                                                            textAlign={'center'}
                                                        >
                                                            {subField.label}
                                                        </Text>
                                                    </GridItem>
                                                    {!lastFourMatchesVisible[teamNumber] ? (
                                                        <GridItem
                                                            display={'flex'}
                                                            justifyContent={'center'}
                                                            alignItems={'center'}
                                                            backgroundColor={'gray.100'}
                                                            borderBottom={'1px solid black'}
                                                        >
                                                            {getOverallComponent(
                                                                subField,
                                                                multiTeamEventsData[teamNumber]
                                                            )}
                                                        </GridItem>
                                                    ) : (
                                                        <GridItem
                                                            display={'flex'}
                                                            justifyContent={'center'}
                                                            alignItems={'center'}
                                                            backgroundColor={'gray.100'}
                                                            borderBottom={'1px solid black'}
                                                        >
                                                            {getL4MCompoenent(
                                                                subField,
                                                                standForms[teamNumber],
                                                                superForms[teamNumber]
                                                            )}
                                                        </GridItem>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </Grid>
                            </Box>
                        </Box>
                    ) : (
                        <Box key={teamNumber}>
                            {!onTeamPage && (
                                <Text
                                    fontSize={'xl'}
                                    fontWeight={'semibold'}
                                    textAlign={'center'}
                                    color={index > 2 ? 'blue.500' : 'red.500'}
                                >
                                    {index > 2 ? `Blue ${index - 2}: ${teamNumber}` : `Red ${index + 1}: ${teamNumber}`}
                                </Text>
                            )}
                            <Text fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'}>
                                Need at least one stand and super form completed
                            </Text>
                        </Box>
                    )}
                </Flex>
            ))}
        </Flex>
    );
}

export default TeamStatsList;

import React, { useCallback, useEffect, useState } from 'react';
import { year, timeZone, teamPageTabs } from '../util/helperConstants';
import { convertMatchKeyToString, getMatchDifference, sortMatches } from '../util/helperFunctions';
import { Box, Button, Center, Divider, Flex, Grid, GridItem, Spinner, Text, Tooltip } from '@chakra-ui/react';
import { ConditionalWrapper } from './ConditionalWrapper';
import { Link } from 'react-router-dom';

const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function MatchAnalystScheduleTable({ teamNumber, event, initialCollapse = true }) {
    const [error, setError] = useState(null);
    const [eventInfo, setEventInfo] = useState({ inEvent: null, matchTable: null });
    const [matchTable, setMatchTable] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 650);
    const [collapsed, setCollapsed] = useState(initialCollapse);

    useEffect(() => {
        fetch(`/blueAlliance/team/frc${teamNumber}/events/${year}/keys`)
            .then((response) => response.json())
            .then((data) => {
                if (!data.Error) {
                    if (data.includes(event.key)) {
                        fetch(`/blueAlliance/event/${event.key}/matches`)
                            .then((response) => response.json())
                            .then((data) => {
                                let allies = {};
                                let opponents = {};
                                let matches = [];
                                if (!data.Error) {
                                    data.forEach((match) => (match.key = match.key.split('_')[1]));
                                    data = sortMatches(data, 'key', false);

                                    for (let match of data) {
                                        let allyTeams = [];
                                        let opponentTeams = [];
                                        if (match.actual_time === null) {
                                            if (match.alliances.red.team_keys.includes(`frc${teamNumber}`)) {
                                                allyTeams = match.alliances.red.team_keys;
                                                opponentTeams = match.alliances.blue.team_keys;
                                            } else if (match.alliances.blue.team_keys.includes(`frc${teamNumber}`)) {
                                                allyTeams = match.alliances.blue.team_keys;
                                                opponentTeams = match.alliances.red.team_keys;
                                            }

                                            if (allyTeams.length !== 0 && opponentTeams.length !== 0) {
                                                for (let teamKey of allyTeams) {
                                                    if (
                                                        !Object.hasOwn(allies, teamKey) &&
                                                        !Object.hasOwn(opponents, teamKey)
                                                    ) {
                                                        allies[teamKey] = match.key;
                                                    }
                                                }
                                                for (let teamKey of opponentTeams) {
                                                    if (
                                                        !Object.hasOwn(allies, teamKey) &&
                                                        !Object.hasOwn(opponents, teamKey)
                                                    ) {
                                                        opponents[teamKey] = match.key;
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    delete allies[`frc${teamNumber}`];

                                    for (let match of data) {
                                        if (match.actual_time === null) {
                                            let matchAllies = {};
                                            let matchOpponents = {};

                                            for (let teamKey of [
                                                ...match.alliances.red.team_keys,
                                                ...match.alliances.blue.team_keys
                                            ]) {
                                                if (
                                                    Object.hasOwn(allies, teamKey) &&
                                                    getMatchDifference(match.key, allies[teamKey]) < 0
                                                ) {
                                                    matchAllies[teamKey] = allies[teamKey];
                                                } else if (
                                                    Object.hasOwn(opponents, teamKey) &&
                                                    getMatchDifference(match.key, opponents[teamKey]) < 0
                                                ) {
                                                    matchOpponents[teamKey] = opponents[teamKey];
                                                }
                                            }

                                            if (
                                                Object.keys(matchAllies).length !== 0 ||
                                                Object.keys(matchOpponents).length !== 0
                                            ) {
                                                matches.push({
                                                    matchNumber: match.key,
                                                    redAlliance: match.alliances.red.team_keys,
                                                    blueAlliance: match.alliances.blue.team_keys,
                                                    predictedTime: match.predicted_time,
                                                    scheduledTime: match.time,
                                                    actualTime: match.actual_time,
                                                    allies: matchAllies,
                                                    opponents: matchOpponents
                                                });
                                            }
                                        }
                                    }
                                }
                                setEventInfo({ inEvent: true, matchTable: matches });
                            })
                            .catch((error) => {
                                setError(error.message);
                            });
                    } else {
                        setEventInfo({ inEvent: false });
                    }
                } else {
                    setError(data.Error);
                }
            })
            .catch((error) => {
                setError(error.message);
            });
    }, [teamNumber, event]);

    const updateSizes = useCallback(() => {
        setIsMobile(window.innerWidth < 650);
    }, []);

    useEffect(() => {
        window.addEventListener('resize', updateSizes);

        return () => window.removeEventListener('resize', updateSizes);
    }, [updateSizes]);

    useEffect(() => {
        if (eventInfo.matchTable) {
            let newMatchTable = eventInfo.matchTable;
            if (collapsed) {
                newMatchTable = [];
                for (let i = 0; i < Math.min(eventInfo.matchTable.length, 5); i++) {
                    newMatchTable.push(eventInfo.matchTable[i]);
                }
            }
            setMatchTable(newMatchTable);
        }
    }, [collapsed, eventInfo.matchTable]);

    function getCurrentMatchString() {
        let match = eventInfo.matchTable.find((match) => match.actualTime === null);
        return `Next Match: ${convertMatchKeyToString(match.matchNumber)}, 
                                ${
                                    match.predictedTime
                                        ? `${weekday[new Date(match.predictedTime * 1000).getDay()]} ${new Date(
                                              match.predictedTime * 1000
                                          ).toLocaleString('en-US', {
                                              hour: 'numeric',
                                              minute: 'numeric',
                                              hour12: true,
                                              timeZone: timeZone
                                          })}`
                                        : match.scheduledTime
                                        ? `${weekday[new Date(match.scheduledTime * 1000).getDay()]} ${new Date(
                                              match.scheduledTime * 1000
                                          ).toLocaleString('en-US', {
                                              hour: 'numeric',
                                              minute: 'numeric',
                                              hour12: true,
                                              timeZone: timeZone
                                          })}`
                                        : 'No time available'
                                }`;
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

    if (eventInfo.inEvent === null) {
        return (
            <Center marginTop={'40px'}>
                <Spinner />
            </Center>
        );
    } else if (eventInfo.inEvent === false) {
        return null;
    } else if (eventInfo.matchTable === null || matchTable === null) {
        return (
            <Center marginTop={'40px'}>
                <Spinner />
            </Center>
        );
    }

    return (
        <Box
            width={{ base: '95vw', sm: '90vw', md: '80vw', lg: '670px' }}
            margin={'0 auto'}
            marginTop={'25px'}
            marginBottom={'25px'}
        >
            <Box>
                {eventInfo.matchTable.find((match) => match.actualTime === null) && (
                    <Text textAlign={'center'} fontSize={'lg'} fontWeight={'semibold'} marginBottom={'10px'}>
                        {getCurrentMatchString()}
                    </Text>
                )}
            </Box>
            {eventInfo.matchTable.length === 0 ? (
                <Text textAlign={'center'} fontSize={'lg'} fontWeight={'semibold'} marginBottom={'10px'}>
                    No matches to show
                </Text>
            ) : (
                <Box>
                    <Button
                        size={'sm'}
                        display={'flex'}
                        margin={'0 auto'}
                        marginBottom={'10px'}
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        {collapsed ? 'Recent/Upcoming' : 'Entire Schedule'}
                    </Button>
                    <Grid
                        border={'1px solid black'}
                        borderBottom={'none'}
                        borderRadius={'10px 10px 0px 0px'}
                        backgroundColor={'gray.300'}
                        templateColumns={isMobile ? '1fr 1fr 0.5fr' : '1.5fr 1fr 1fr 0.75fr'}
                    >
                        <GridItem
                            padding={'7px 0px'}
                            textAlign={'center'}
                            borderRight={'1px solid black'}
                            display={'flex'}
                            justifyContent={'center'}
                            alignItems={'center'}
                        >
                            Match
                        </GridItem>
                        <ConditionalWrapper
                            condition={isMobile}
                            wrapper={(children) => <GridItem borderRight={'1px solid black'}>{children}</GridItem>}
                        >
                            <GridItem
                                padding={!isMobile ? '0px' : '5px 0px'}
                                textAlign={'center'}
                                borderRight={!isMobile && '1px solid black'}
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                            >
                                Red Alliance
                            </GridItem>
                            {isMobile && <Divider borderColor={'black'} borderRadius={'5px'}></Divider>}
                            <GridItem
                                padding={!isMobile ? '0px' : '5px 0px'}
                                textAlign={'center'}
                                borderRight={!isMobile && '1px solid black'}
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                            >
                                Blue Alliance
                            </GridItem>
                        </ConditionalWrapper>
                        <GridItem textAlign={'center'} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                            Scores
                        </GridItem>
                    </Grid>
                    <Box borderRadius={'0px 0px 10px 10px'} border={'1px solid black'} borderTop={'none'}>
                        {matchTable.map((match, index) => (
                            <React.Fragment key={match.matchNumber}>
                                {index === 0 && (
                                    <Grid
                                        borderTop={index === 0 ? '1px solid black' : '1px solid gray'}
                                        backgroundColor={'gray.100'}
                                        borderRadius={matchTable.length - 1 === index && '0px 0px 10px 10px'}
                                        padding={'10px 0px'}
                                        textAlign={'center'}
                                    >
                                        {matchTable[index].matchNumber.substring(0, 2) === 'qm'
                                            ? 'Qualifications'
                                            : matchTable[index].matchNumber.substring(0, 2) === 'sf'
                                            ? 'Semifinals'
                                            : 'Finals'}
                                    </Grid>
                                )}
                                {index > 0 &&
                                    matchTable[index].matchNumber.substring(0, 2) === 'sf' &&
                                    matchTable[index - 1].matchNumber.substring(0, 2) === 'qm' && (
                                        <Grid
                                            borderTop={index === 0 ? '1px solid black' : '1px solid gray'}
                                            backgroundColor={'gray.100'}
                                            borderRadius={matchTable.length - 1 === index && '0px 0px 10px 10px'}
                                            padding={'10px 0px'}
                                            textAlign={'center'}
                                        >
                                            Semifinals
                                        </Grid>
                                    )}
                                {index > 0 &&
                                    matchTable[index].matchNumber.substring(0, 1) === 'f' &&
                                    matchTable[index - 1].matchNumber.substring(0, 2) === 'sf' && (
                                        <Grid
                                            borderTop={index === 0 ? '1px solid black' : '1px solid gray'}
                                            backgroundColor={'gray.100'}
                                            borderRadius={matchTable.length - 1 === index && '0px 0px 10px 10px'}
                                            padding={'10px 0px'}
                                            textAlign={'center'}
                                        >
                                            Finals
                                        </Grid>
                                    )}
                                <Grid
                                    borderTop={index === 0 ? '1px solid black' : '1px solid gray'}
                                    backgroundColor={index % 2 === 0 ? 'gray.100' : 'white'}
                                    borderRadius={matchTable.length - 1 === index && '0px 0px 10px 10px'}
                                    templateColumns={isMobile ? '1fr 1fr 0.5fr' : '1.5fr 1fr 1fr 0.75fr'}
                                >
                                    <GridItem
                                        minH={isMobile && '70px'}
                                        padding={'7px 0px 7px 0px'}
                                        textAlign={'center'}
                                        borderRight={'1px solid gray'}
                                        display={'flex'}
                                        justifyContent={'center'}
                                        alignItems={'center'}
                                        _hover={{ backgroundColor: index % 2 === 0 ? 'gray.200' : 'gray.50' }}
                                        _active={{ backgroundColor: index % 2 === 0 ? 'gray.300' : 'gray.100' }}
                                        borderRadius={matchTable.length - 1 === index && '0px 0px 0px 10px'}
                                        as={Link}
                                        to={`/matchAnalyst/${event.key}/${[
                                            ...match.redAlliance.map((team) => team.substring(3)),
                                            ...match.blueAlliance.map((team) => team.substring(3))
                                        ].join('/')}/${match.matchNumber}`}
                                    >
                                        {convertMatchKeyToString(match.matchNumber)}
                                    </GridItem>
                                    <ConditionalWrapper
                                        condition={isMobile}
                                        wrapper={(children) => <GridItem>{children}</GridItem>}
                                    >
                                        <GridItem height={isMobile && '50%'} textAlign={'center'}>
                                            <Flex minHeight={'40.11px'} height={'100%'}>
                                                {match.redAlliance.map((team) => (
                                                    <Flex
                                                        height={'100%'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        borderRight={'1px solid gray'}
                                                        width={`${100.0 / 3.0}%`}
                                                        key={`${team}${match.matchNumber}`}
                                                        textDecoration={
                                                            team === `frc${teamNumber}` ? 'underline' : 'none'
                                                        }
                                                        borderBottom={isMobile ? '1px solid gray' : 'none'}
                                                        textDecorationThickness={'2px'}
                                                        fontWeight={
                                                            Object.hasOwn(match.allies, team) ||
                                                            Object.hasOwn(match.opponents, team)
                                                                ? 'bold'
                                                                : 'normal'
                                                        }
                                                        as={Link}
                                                        to={`/team/${team.substring(3)}/${teamPageTabs.overview}`}
                                                        backgroundColor={
                                                            Object.hasOwn(match.allies, team)
                                                                ? 'green.200'
                                                                : Object.hasOwn(match.opponents, team)
                                                                ? 'red.200'
                                                                : 'gray.200'
                                                        }
                                                        _hover={{
                                                            backgroundColor: Object.hasOwn(match.allies, team)
                                                                ? 'green.300'
                                                                : Object.hasOwn(match.opponents, team)
                                                                ? 'red.300'
                                                                : 'gray.300'
                                                        }}
                                                        _active={{
                                                            backgroundColor: Object.hasOwn(match.allies, team)
                                                                ? 'green.400'
                                                                : Object.hasOwn(match.opponents, team)
                                                                ? 'red.400'
                                                                : 'gray.400'
                                                        }}
                                                    >
                                                        <Box>
                                                            {team.substring(3)}
                                                            {Object.hasOwn(match.allies, team) ? (
                                                                <Text fontSize={'65%'}>
                                                                    {convertMatchKeyToString(match.allies[team])}
                                                                </Text>
                                                            ) : Object.hasOwn(match.opponents, team) ? (
                                                                <Text fontSize={'65%'}>
                                                                    {convertMatchKeyToString(match.opponents[team])}
                                                                </Text>
                                                            ) : null}
                                                        </Box>
                                                    </Flex>
                                                ))}
                                            </Flex>
                                        </GridItem>
                                        <GridItem height={isMobile && '50%'} textAlign={'center'}>
                                            <Flex minHeight={'40.11px'} height={'100%'}>
                                                {match.blueAlliance.map((team) => (
                                                    <Flex
                                                        height={'100%'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        borderRight={'1px solid gray'}
                                                        width={`${100.0 / 3.0}%`}
                                                        key={`${team}${match.matchNumber}`}
                                                        textDecoration={
                                                            team === `frc${teamNumber}` ? 'underline' : 'none'
                                                        }
                                                        textDecorationThickness={'2px'}
                                                        fontWeight={
                                                            Object.hasOwn(match.allies, team) ||
                                                            Object.hasOwn(match.opponents, team)
                                                                ? 'bold'
                                                                : 'normal'
                                                        }
                                                        as={Link}
                                                        to={`/team/${team.substring(3)}/${teamPageTabs.overview}`}
                                                        backgroundColor={
                                                            Object.hasOwn(match.allies, team)
                                                                ? 'green.200'
                                                                : Object.hasOwn(match.opponents, team)
                                                                ? 'red.200'
                                                                : 'gray.200'
                                                        }
                                                        _hover={{
                                                            backgroundColor: Object.hasOwn(match.allies, team)
                                                                ? 'green.300'
                                                                : Object.hasOwn(match.opponents, team)
                                                                ? 'red.300'
                                                                : 'gray.300'
                                                        }}
                                                        _active={{
                                                            backgroundColor: Object.hasOwn(match.allies, team)
                                                                ? 'green.400'
                                                                : Object.hasOwn(match.opponents, team)
                                                                ? 'red.400'
                                                                : 'gray.400'
                                                        }}
                                                    >
                                                        <Box>
                                                            {team.substring(3)}
                                                            {Object.hasOwn(match.allies, team) ? (
                                                                <Text fontSize={'65%'}>
                                                                    {convertMatchKeyToString(match.allies[team])}
                                                                </Text>
                                                            ) : Object.hasOwn(match.opponents, team) ? (
                                                                <Text fontSize={'65%'}>
                                                                    {convertMatchKeyToString(match.opponents[team])}
                                                                </Text>
                                                            ) : null}
                                                        </Box>
                                                    </Flex>
                                                ))}
                                            </Flex>
                                        </GridItem>
                                    </ConditionalWrapper>
                                    <GridItem textAlign={'center'}>
                                        <Tooltip
                                            isDisabled={!match.predictedTime}
                                            label={
                                                !match.scheduledTime
                                                    ? 'No time scheduled' //this will likely never occur because our tooltip is only enabled if theres a predicted time which means there should also be a scheduled time
                                                    : `Scheduled at ${
                                                          weekday[new Date(match.scheduledTime * 1000).getDay()]
                                                      } ${new Date(match.scheduledTime * 1000).toLocaleString('en-US', {
                                                          hour: 'numeric',
                                                          minute: 'numeric',
                                                          hour12: true,
                                                          timeZone: timeZone
                                                      })}`
                                            }
                                        >
                                            <Text
                                                fontStyle={match.predictedTime ? 'italic' : 'normal'}
                                                pos={'relative'}
                                                top={'50%'}
                                                transform={'translateY(-50%)'}
                                            >
                                                {match.predictedTime
                                                    ? `${
                                                          weekday[new Date(match.predictedTime * 1000).getDay()]
                                                      } ${new Date(match.predictedTime * 1000).toLocaleString('en-US', {
                                                          hour: 'numeric',
                                                          minute: 'numeric',
                                                          hour12: true,
                                                          timeZone: timeZone
                                                      })}*`
                                                    : match.scheduledTime
                                                    ? `${
                                                          weekday[new Date(match.scheduledTime * 1000).getDay()]
                                                      } ${new Date(match.scheduledTime * 1000).toLocaleString('en-US', {
                                                          hour: 'numeric',
                                                          minute: 'numeric',
                                                          hour12: true,
                                                          timeZone: timeZone
                                                      })}`
                                                    : '?'}
                                            </Text>
                                        </Tooltip>
                                    </GridItem>
                                </Grid>
                            </React.Fragment>
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    );
}

export default MatchAnalystScheduleTable;

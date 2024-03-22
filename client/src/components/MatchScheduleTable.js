import React, { useCallback, useEffect, useState } from 'react';
import { year, timeZone, teamPageTabs } from '../util/helperConstants';
import { convertMatchKeyToString, sortMatches } from '../util/helperFunctions';
import { Box, Button, Center, Divider, Flex, Grid, GridItem, Spinner, Text, Tooltip } from '@chakra-ui/react';
import { ConditionalWrapper } from './ConditionalWrapper';
import { Link } from 'react-router-dom';

const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function MatchScheduleTable({ teamNumber, event, teamPage = true, initialCollapse = true }) {
    const [error, setError] = useState(null);
    const [eventInfo, setEventInfo] = useState({ inEvent: null, matchTable: null, teamStatus: null });
    const [matchTable, setMatchTable] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 650 || teamPage);
    const [collapsed, setCollapsed] = useState(initialCollapse);

    useEffect(() => {
        fetch(`/blueAlliance/team/frc${teamNumber}/events/${year}/keys`)
            .then((response) => response.json())
            .then((data) => {
                if (!data.Error) {
                    if (data.includes(event.key)) {
                        let matchDataPromise = fetch(`/blueAlliance/team/frc${teamNumber}/event/${event.key}/matches`);

                        let teamStatusPromise = fetch(`/blueAlliance/team/frc${teamNumber}/event/${event.key}/status`);

                        Promise.all([matchDataPromise, teamStatusPromise])
                            .then((responses) => Promise.all(responses.map((response) => response.json())))
                            .then((data) => {
                                let matchData = data[0];
                                let matches = [];
                                if (matchData && !matchData.Error) {
                                    for (let match of matchData) {
                                        matches.push({
                                            matchNumber: match.key.split('_')[1],
                                            redAlliance: match.alliances.red.team_keys,
                                            blueAlliance: match.alliances.blue.team_keys,
                                            redScore: {
                                                score: match.alliances.red.score,
                                                melodyRP: match.score_breakdown?.red.melodyBonusAchieved,
                                                ensembleRP: match.score_breakdown?.red.ensembleBonusAchieved
                                            },
                                            blueScore: {
                                                score: match.alliances.blue.score,
                                                melodyRP: match.score_breakdown?.blue.melodyBonusAchieved,
                                                ensembleRP: match.score_breakdown?.blue.ensembleBonusAchieved
                                            },
                                            winner: match.winning_alliance,
                                            predictedTime: match.predicted_time,
                                            scheduledTime: match.time,
                                            actualTime: match.actual_time
                                        });
                                    }
                                }

                                let statusData = data[1];
                                let status = {};
                                if (
                                    statusData &&
                                    Object.keys(statusData).length > 0 &&
                                    statusData.qual !== null &&
                                    !statusData.Error
                                ) {
                                    status.qual = statusData.qual.ranking;
                                    status.playoff = statusData.playoff;
                                }
                                setEventInfo({ inEvent: true, matchTable: sortMatches(matches), teamStatus: status });
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
        setIsMobile(teamPage || window.innerWidth < 650);
    }, [teamPage]);

    useEffect(() => {
        window.addEventListener('resize', updateSizes);

        return () => window.removeEventListener('resize', updateSizes);
    }, [updateSizes]);

    useEffect(() => {
        if (eventInfo.matchTable) {
            let newMatchTable = eventInfo.matchTable;
            if (collapsed) {
                newMatchTable = [];
                for (let i = 0; i < eventInfo.matchTable.length; i++) {
                    if (eventInfo.matchTable[i].actualTime === null) {
                        if (i > 0) {
                            newMatchTable = [eventInfo.matchTable[i - 1], eventInfo.matchTable[i]];
                        } else {
                            newMatchTable = [eventInfo.matchTable[i]];
                        }
                        break;
                    }
                }
                if (newMatchTable.length === 0) {
                    newMatchTable = [eventInfo.matchTable[eventInfo.matchTable.length - 1]];
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

    function getTeamStatusString() {
        let qualRecord = `${eventInfo.teamStatus.qual.record.wins}-${eventInfo.teamStatus.qual.record.ties}-${eventInfo.teamStatus.qual.record.losses} in quals`;
        let playoffRecord = eventInfo.teamStatus.playoff
            ? `, ${eventInfo.teamStatus.playoff.record.wins}-${eventInfo.teamStatus.playoff.record.ties}-${eventInfo.teamStatus.playoff.record.losses} in playoffs`
            : '';

        return `Rank ${eventInfo.teamStatus.qual.rank || 'N/A'}, ${qualRecord}${playoffRecord}`;
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
    } else if (eventInfo.matchTable === null || eventInfo.teamStatus === null || matchTable === null) {
        return (
            <Center marginTop={'40px'}>
                <Spinner />
            </Center>
        );
    }

    return (
        <Box
            width={
                teamPage
                    ? { base: '95vw', sm: '80%', md: '65%', lg: '85%' }
                    : { base: '95vw', sm: '90vw', md: '80vw', lg: '670px' }
            }
            margin={'0 auto'}
            marginTop={teamPage ? '15px' : '25px'}
            marginBottom={teamPage ? '0px' : '25px'}
        >
            {Object.keys(eventInfo.teamStatus).length === 0 ? (
                <Text
                    textAlign={'center'}
                    fontSize={'lg'}
                    fontWeight={'semibold'}
                    marginBottom={eventInfo.matchTable.length === 0 ? '10px' : '20px'}
                >
                    No status posted yet
                </Text>
            ) : (
                <Box>
                    {eventInfo.matchTable.find((match) => match.actualTime === null) && (
                        <Text textAlign={'center'} fontSize={'lg'} fontWeight={'semibold'} marginBottom={'10px'}>
                            {getCurrentMatchString()}
                        </Text>
                    )}
                    <Text textAlign={'center'} fontSize={'lg'} fontWeight={'semibold'} marginBottom={'10px'}>
                        {getTeamStatusString()}
                    </Text>
                </Box>
            )}
            {eventInfo.matchTable.length === 0 ? (
                <Text textAlign={'center'} fontSize={'lg'} fontWeight={'semibold'} marginBottom={'10px'}>
                    No matches posted yet
                </Text>
            ) : (
                <Box>
                    {teamPage && (
                        <Button
                            size={'sm'}
                            display={'flex'}
                            margin={'0 auto'}
                            marginBottom={'10px'}
                            onClick={() => setCollapsed(!collapsed)}
                        >
                            {collapsed ? 'Recent/Upcoming' : 'Entire Schedule'}
                        </Button>
                    )}
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
                                            <Flex height={'100%'}>
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
                                                        textDecorationThickness={'2px'}
                                                        fontWeight={
                                                            match.redScore.score > match.blueScore.score
                                                                ? 'bold'
                                                                : 'normal'
                                                        }
                                                        as={Link}
                                                        to={`/team/${team.substring(3)}/${teamPageTabs.overview}`}
                                                        backgroundColor={'red.200'}
                                                        _hover={{ backgroundColor: 'red.300' }}
                                                        _active={{ backgroundColor: 'red.400' }}
                                                    >
                                                        {team.substring(3)}
                                                    </Flex>
                                                ))}
                                            </Flex>
                                        </GridItem>
                                        <GridItem height={isMobile && '50%'} textAlign={'center'}>
                                            <Flex height={'100%'}>
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
                                                            match.redScore.score < match.blueScore.score
                                                                ? 'bold'
                                                                : 'normal'
                                                        }
                                                        as={Link}
                                                        to={`/team/${team.substring(3)}/${teamPageTabs.overview}`}
                                                        backgroundColor={'blue.200'}
                                                        _hover={{ backgroundColor: 'blue.300' }}
                                                        _active={{ backgroundColor: 'blue.400' }}
                                                    >
                                                        {team.substring(3)}
                                                    </Flex>
                                                ))}
                                            </Flex>
                                        </GridItem>
                                    </ConditionalWrapper>
                                    <GridItem textAlign={'center'}>
                                        {match.actualTime !== null ? (
                                            <Flex height={'100%'} position={'relative'} flexWrap={'wrap'}>
                                                <Flex
                                                    flexGrow={1}
                                                    minW={isMobile && '100%'}
                                                    height={!isMobile && '100%'}
                                                    justifyContent={'center'}
                                                    alignItems={'center'}
                                                    width={'50%'}
                                                    backgroundColor={'red.200'}
                                                    borderRight={!isMobile && '1px solid gray'}
                                                    fontWeight={
                                                        match.redScore.score > match.blueScore.score ? 'bold' : 'normal'
                                                    }
                                                    textDecoration={
                                                        match.redAlliance.includes(`frc${teamNumber}`)
                                                            ? 'underline'
                                                            : 'none'
                                                    }
                                                    textDecorationThickness={'2px'}
                                                >
                                                    {match.redScore.score}
                                                </Flex>
                                                {match.redScore.melodyRP && (
                                                    <Tooltip label={'Melody Bonus'} placement={'top'}>
                                                        <Box
                                                            position={'absolute'}
                                                            borderRadius={'5px'}
                                                            width={'5px'}
                                                            height={'5px'}
                                                            backgroundColor={'black'}
                                                            left={'4px'}
                                                            top={'5px'}
                                                        ></Box>
                                                    </Tooltip>
                                                )}
                                                {match.redScore.ensembleRP && (
                                                    <Tooltip label={'Ensemble Bonus'} placement={'top'}>
                                                        <Box
                                                            position={'absolute'}
                                                            borderRadius={'5px'}
                                                            width={'5px'}
                                                            height={'5px'}
                                                            backgroundColor={'black'}
                                                            left={'12px'}
                                                            top={'5px'}
                                                        ></Box>
                                                    </Tooltip>
                                                )}
                                                <Flex
                                                    borderRadius={matchTable.length - 1 === index && '0px 0px 10px 0px'}
                                                    flexGrow={1}
                                                    minW={isMobile && '100%'}
                                                    height={!isMobile && '100%'}
                                                    justifyContent={'center'}
                                                    alignItems={'center'}
                                                    width={'50%'}
                                                    backgroundColor={'blue.200'}
                                                    fontWeight={
                                                        match.redScore.score < match.blueScore.score ? 'bold' : 'normal'
                                                    }
                                                    textDecoration={
                                                        match.blueAlliance.includes(`frc${teamNumber}`)
                                                            ? 'underline'
                                                            : 'none'
                                                    }
                                                    textDecorationThickness={'2px'}
                                                >
                                                    {match.blueScore.score}
                                                </Flex>
                                                {match.blueScore.melodyRP && (
                                                    <Tooltip label={'Melody Bonus'} placement={'top'}>
                                                        <Box
                                                            position={'absolute'}
                                                            borderRadius={'5px'}
                                                            width={'5px'}
                                                            height={'5px'}
                                                            backgroundColor={'black'}
                                                            left={isMobile ? '4px' : 'calc(50% + 4px)'}
                                                            top={isMobile ? 'calc(50% + 5px)' : '5px'}
                                                        ></Box>
                                                    </Tooltip>
                                                )}
                                                {match.blueScore.ensembleRP && (
                                                    <Tooltip label={'Ensemble Bonus'} placement={'top'}>
                                                        <Box
                                                            position={'absolute'}
                                                            borderRadius={'5px'}
                                                            width={'5px'}
                                                            height={'5px'}
                                                            backgroundColor={'black'}
                                                            left={isMobile ? '12px' : 'calc(50% + 12px)'}
                                                            top={isMobile ? 'calc(50% + 5px)' : '5px'}
                                                        ></Box>
                                                    </Tooltip>
                                                )}
                                            </Flex>
                                        ) : (
                                            <Tooltip
                                                isDisabled={!match.predictedTime}
                                                label={
                                                    !match.scheduledTime
                                                        ? 'No time scheduled' //this will likely never occur because our tooltip is only enabled if theres a predicted time which means there should also be a scheduled time
                                                        : `Scheduled at ${
                                                              weekday[new Date(match.scheduledTime * 1000).getDay()]
                                                          } ${new Date(match.scheduledTime * 1000).toLocaleString(
                                                              'en-US',
                                                              {
                                                                  hour: 'numeric',
                                                                  minute: 'numeric',
                                                                  hour12: true,
                                                                  timeZone: timeZone
                                                              }
                                                          )}`
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
                                                          } ${new Date(match.predictedTime * 1000).toLocaleString(
                                                              'en-US',
                                                              {
                                                                  hour: 'numeric',
                                                                  minute: 'numeric',
                                                                  hour12: true,
                                                                  timeZone: timeZone
                                                              }
                                                          )}*`
                                                        : match.scheduledTime
                                                        ? `${
                                                              weekday[new Date(match.scheduledTime * 1000).getDay()]
                                                          } ${new Date(match.scheduledTime * 1000).toLocaleString(
                                                              'en-US',
                                                              {
                                                                  hour: 'numeric',
                                                                  minute: 'numeric',
                                                                  hour12: true,
                                                                  timeZone: timeZone
                                                              }
                                                          )}`
                                                        : '?'}
                                                </Text>
                                            </Tooltip>
                                        )}
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

export default MatchScheduleTable;

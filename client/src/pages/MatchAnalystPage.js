import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { capitalizeFirstLetter, convertMatchKeyToString, roundToTenth, sortEvents } from '../util/helperFunctions';
import {
    Box,
    Button,
    Center,
    Flex,
    Grid,
    GridItem,
    IconButton,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    NumberInput,
    NumberInputField,
    Spinner,
    Text
} from '@chakra-ui/react';
import { matchFormStatus, teamPageTabs } from '../util/helperConstants';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { FaSearch } from 'react-icons/fa';
import MatchLineGraphs from '../components/MatchLineGraphs';
import AutoPaths from '../components/AutoPaths';
import TeamStatsList from '../components/TeamStatsList';
import { RiEditBoxFill } from 'react-icons/ri';
import { Link } from 'react-router-dom';

let matchTypes = [
    { label: 'Quals', value: 'q', id: uuidv4() },
    { label: 'Playoffs', value: 'sf', id: uuidv4() },
    { label: 'Finals', value: 'f', id: uuidv4() }
];
let tabs = {
    graphs: 'Graphs',
    autoPaths: 'Auto Paths',
    stats: 'Stats List'
};

function MatchAnalystPage() {
    const [error, setError] = useState(null);
    const [events, setEvents] = useState(null);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [focusedEvent, setFocusedEvent] = useState(null);
    const [matchType, setMatchType] = useState('');
    const [focusedMatchType, setFocusedMatchType] = useState('');
    const [matchNumber, setMatchNumber] = useState('');
    const [manualMode, setManualMode] = useState(null);
    const [teams, setTeams] = useState({ red: ['', '', ''], blue: ['', '', ''] });
    const [matchNumberError, setMatchNumberError] = useState('');
    const [fetchingTeamData, setFetchingTeamData] = useState('');
    const [multiTeamEventData, setMultiTeamEventData] = useState(null);
    const [multiOneValidMatchForms, setMutliOneValidMatchForms] = useState(null);
    const [tab, setTab] = useState(tabs.graphs);

    const abort = useRef(new AbortController());

    useEffect(() => {
        if (localStorage.getItem('MatchAnalystData')) {
            let data = JSON.parse(localStorage.getItem('MatchAnalystData'));
            setMatchType(data.matchType);
            setManualMode(data.manualMode);
        } else {
            setManualMode(false);
        }
    }, []);

    useEffect(() => {
        if (manualMode !== null) {
            localStorage.setItem('MatchAnalystData', JSON.stringify({ matchType, manualMode }));
        }
    }, [matchType, manualMode]);

    useEffect(() => {
        fetch('/event/getEventsSimple')
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    throw new Error(response.statusText);
                }
            })
            .then((data) => {
                let events = data;
                setEvents(sortEvents(events));
                if (events.length === 0) {
                    setError('No events are registered in the database');
                    return;
                }
                let currentEvent = events.find((event) => event.currentEvent);
                if (currentEvent) {
                    setCurrentEvent({ name: currentEvent.name, key: currentEvent.key });
                    setFocusedEvent(currentEvent.name);
                } else {
                    currentEvent = events[events.length - 1];
                    setCurrentEvent({ name: currentEvent.name, key: currentEvent.key });
                    setFocusedEvent(currentEvent.name);
                }
            })
            .catch((error) => setError(error.message));
    }, []);

    const getMatchKey = useCallback(() => {
        let matchKey;
        if (matchNumber === '') {
            return null;
        }
        if (matchType.value === 'p') {
            matchKey = `pm${matchNumber}`;
        } else if (matchType.value === 'q') {
            matchKey = `qm${matchNumber}`;
        } else if (matchType.value === 'sf') {
            if (matchNumber < 1 || matchNumber > 13) {
                setMatchNumberError('Error: Invalid match number for playoffs');
                return null;
            }
            matchKey = `sf${matchNumber}m1`;
        } else {
            matchKey = `f1m${matchNumber}`;
        }
        return matchKey;
    }, [matchNumber, matchType.value]);

    useLayoutEffect(() => {
        function getTeamNumbers() {
            abort.current = new AbortController();
            if (matchType === '') return;
            let matchKey = getMatchKey();
            if (matchKey === null) {
                return;
            }
            fetch(`/blueAlliance/match/${currentEvent.key}_${matchKey}/simple`, { signal: abort.current.signal })
                .then((response) => response.json())
                .then((data) => {
                    if (!data.Error) {
                        let teams = { red: [], blue: [] };
                        data.alliances.red.team_keys.forEach((teamNumber) => teams.red.push(teamNumber.substring(3)));
                        data.alliances.blue.team_keys.forEach((teamNumber) => teams.blue.push(teamNumber.substring(3)));
                        setTeams(teams);
                    } else {
                        setTeams({ red: ['', '', ''], blue: ['', '', ''] });
                        setMatchNumberError(`Error: (${data.Error})`);
                    }
                })
                .catch((error) => {
                    if (error?.name !== 'AbortError') {
                        console.log(error);
                        setError(error.message);
                    }
                });
        }
        abort.current.abort();
        if (!manualMode) {
            setMatchNumberError('');
            setTeams({ red: ['', '', ''], blue: ['', '', ''] });
            getTeamNumbers();
        }
    }, [matchType, matchNumber, currentEvent, getMatchKey, manualMode]);

    function doneFetching() {
        if (matchType === '' || matchNumber === '' || matchNumberError) {
            return true; // this means we are not trying to fetch anything because the required fields are missing
        }
        return (
            teams.red.filter((teamNumber) => teamNumber !== '').length === 3 &&
            teams.blue.filter((teamNumber) => teamNumber !== '').length === 3
        );
    }

    const validSetup = useCallback(() => {
        return (
            teams.red.filter((teamNumber) => teamNumber !== '').length === 3 &&
            teams.blue.filter((teamNumber) => teamNumber !== '').length === 3
        );
    }, [teams]);

    const fetchTeamInfo = useCallback(() => {
        // Even though we do this in get teams, we need this for manual mode
        setFetchingTeamData(true);
        Promise.all(
            teams.red.concat(teams.blue).map((teamNumber) =>
                fetch('/ted/getAllTeamEventData', {
                    headers: {
                        filters: JSON.stringify({ eventKey: currentEvent.key, teamNumber: parseInt(teamNumber) })
                    }
                })
            )
        )
            .then((responses) => {
                let responseError = responses.find((response) => response.status !== 200);
                if (responseError) {
                    throw new Error(responseError.statusText);
                } else {
                    return Promise.all(responses.map((response) => response.json()));
                }
            })
            .then((data) => {
                let allTeamData = data;
                let multiTeamEventData = {};
                let multiOneValidMatchForms = {};
                allTeamData.forEach((teamData, index) => {
                    let teamNumber = index > 2 ? teams.blue[index - 3] : teams.red[index];
                    multiTeamEventData[teamNumber] = teamData.teamEventData;
                    multiOneValidMatchForms[teamNumber] = teamData.matchForms.filter(
                        (matchForm) =>
                            [matchFormStatus.complete, matchFormStatus.noShow].includes(matchForm.standStatus) ||
                            [matchFormStatus.complete, matchFormStatus.noShow].includes(matchForm.superStatus)
                    );
                });
                setMultiTeamEventData(multiTeamEventData);
                setMutliOneValidMatchForms(multiOneValidMatchForms);
                setFetchingTeamData(false);
            })
            .catch((error) => {
                setError(error.message);
                setFetchingTeamData(false);
            });
    }, [currentEvent, teams]);

    function getAvgTotalPoints(alliance, amplify = 0) {
        let total = 0;
        for (const teamNumber of teams[alliance]) {
            let teamData = multiTeamEventData[teamNumber];
            if (teamData) {
                total +=
                    teamData.autoPoints.avg +
                    teamData.teleopGP.ampScore.avg +
                    teamData.teleopGP.speakerScore.avg * (1 - amplify) * 2 +
                    teamData.teleopGP.speakerScore.avg * amplify * 5 +
                    teamData.stagePoints.avg;
            }
        }
        return total;
    }

    function getMaxTotalPoints(alliance, amplify = 0) {
        let total = 0;
        for (const teamNumber of teams[alliance]) {
            let teamData = multiTeamEventData[teamNumber];
            if (teamData) {
                total +=
                    teamData.autoPoints.max +
                    teamData.teleopGP.ampScore.max +
                    teamData.teleopGP.speakerScore.max * (1 - amplify) * 2 +
                    teamData.teleopGP.speakerScore.max * amplify * 5 +
                    teamData.stagePoints.max;
            }
        }
        return total;
    }

    if (error) {
        return (
            <Box
                fontSize={'lg'}
                fontWeight={'semibold'}
                textAlign={'center'}
                margin={'0 auto'}
                width={{ base: '85%', md: '66%', lg: '50%' }}
            >
                {error}
            </Box>
        );
    }

    if (events === null || currentEvent === null || manualMode === null) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Box marginBottom={'25px'} position={'relative'}>
            <IconButton
                position={'absolute'}
                right={'15px'}
                onClick={() => {
                    setMultiTeamEventData(null);
                    setMutliOneValidMatchForms(null);
                }}
                icon={<FaSearch />}
            />
            {multiTeamEventData === null && multiOneValidMatchForms === null && (
                <React.Fragment>
                    <IconButton
                        position={'absolute'}
                        right={'15px'}
                        top={'50px'}
                        onClick={() => {
                            setManualMode(!manualMode);
                        }}
                        color={manualMode ? 'green' : 'black'}
                        icon={<RiEditBoxFill />}
                    />
                    <Center marginBottom={'25px'}>
                        <Menu placement={'bottom'}>
                            <MenuButton
                                maxW={'65vw'}
                                onClick={() => setFocusedEvent('')}
                                _focus={{ outline: 'none' }}
                                as={Button}
                                rightIcon={<ChevronDownIcon />}
                            >
                                <Box overflow={'hidden'} textOverflow={'ellipsis'}>
                                    {currentEvent.name}
                                </Box>
                            </MenuButton>
                            <MenuList zIndex={2}>
                                {events.map((eventItem) => (
                                    <MenuItem
                                        textAlign={'center'}
                                        justifyContent={'center'}
                                        _focus={{ backgroundColor: 'none' }}
                                        onMouseEnter={() => setFocusedEvent(eventItem.name)}
                                        backgroundColor={
                                            (currentEvent.name === eventItem.name && focusedEvent === '') ||
                                            focusedEvent === eventItem.name
                                                ? 'gray.100'
                                                : 'none'
                                        }
                                        maxW={'65vw'}
                                        key={eventItem.key}
                                        onClick={() => {
                                            setCurrentEvent({ name: eventItem.name, key: eventItem.key });
                                        }}
                                    >
                                        {eventItem.name}
                                    </MenuItem>
                                ))}
                            </MenuList>
                        </Menu>
                    </Center>
                    {!manualMode && (
                        <React.Fragment>
                            <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginBottom={'10px'}>
                                Match Number
                            </Text>
                            <Menu placement={'bottom'}>
                                <MenuButton
                                    display={'flex'}
                                    margin={'0 auto'}
                                    onClick={() => setFocusedMatchType(matchType)}
                                    as={Button}
                                    rightIcon={<ChevronDownIcon />}
                                >
                                    {matchType === '' ? 'Choose Match Type' : matchType.label}
                                </MenuButton>
                                <MenuList>
                                    {matchTypes.map((matchTypeItem) => (
                                        <MenuItem
                                            _focus={{ backgroundColor: 'none' }}
                                            onMouseEnter={() => setFocusedMatchType(matchTypeItem)}
                                            backgroundColor={
                                                (matchType.value === matchTypeItem.value && focusedMatchType === '') ||
                                                focusedMatchType.value === matchTypeItem.value
                                                    ? 'gray.100'
                                                    : 'none'
                                            }
                                            maxW={'80vw'}
                                            key={matchTypeItem.id}
                                            display={'flex'}
                                            justifyContent={'center'}
                                            onClick={() => {
                                                setMatchNumber('');
                                                setMatchType(matchTypeItem);
                                            }}
                                        >
                                            {matchTypeItem.label}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </Menu>
                            {matchType !== '' ? (
                                <NumberInput
                                    margin={'0 auto'}
                                    marginTop={'10px'}
                                    onChange={(value) => setMatchNumber(value)}
                                    value={matchNumber}
                                    min={1}
                                    precision={0}
                                    width={{
                                        base: '50%',
                                        md: '25%',
                                        lg: '20%'
                                    }}
                                >
                                    <NumberInputField
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                event.target.blur();
                                            }
                                        }}
                                        padding={'0px'}
                                        enterKeyHint='done'
                                        textAlign={'center'}
                                        placeholder='Enter Match #'
                                        disabled={fetchingTeamData}
                                    />
                                </NumberInput>
                            ) : null}
                            {!doneFetching() && (
                                <Center marginTop={'20px'}>
                                    <Spinner />
                                </Center>
                            )}
                            {matchNumberError && (
                                <Text
                                    fontSize={'lg'}
                                    fontWeight={'semibold'}
                                    textAlign={'center'}
                                    color={'red.500'}
                                    margin={'0 auto'}
                                    marginTop={'15px'}
                                    width={'85%'}
                                >
                                    {matchNumberError}
                                </Text>
                            )}
                            {validSetup() && (
                                <Flex
                                    margin={'0 auto'}
                                    flexWrap={'wrap'}
                                    justifyContent={'center'}
                                    alignItems={'center'}
                                    rowGap={'20px'}
                                    columnGap={'20px'}
                                    marginTop={'20px'}
                                    width={'80%'}
                                >
                                    {['red', 'blue'].map((station) => (
                                        <Flex
                                            key={station}
                                            justifyContent={'center'}
                                            alignItems={'center'}
                                            flexDirection={'column'}
                                            rowGap={'10px'}
                                        >
                                            {teams[station].map((teamNumber, stationIndex) => (
                                                <Flex
                                                    key={stationIndex}
                                                    justifyContent={'center'}
                                                    alignItems={'center'}
                                                    columnGap={'10px'}
                                                >
                                                    <Text fontSize={'lg'} fontWeight={'semibold'}>
                                                        {capitalizeFirstLetter(station)} Station {stationIndex + 1}:{' '}
                                                        {teamNumber}
                                                    </Text>
                                                </Flex>
                                            ))}
                                        </Flex>
                                    ))}
                                </Flex>
                            )}
                        </React.Fragment>
                    )}
                    {manualMode && (
                        <Box>
                            <Flex flexWrap={'wrap'} justifyContent={'center'} alignItems={'center'} rowGap={'20px'}>
                                {['red', 'blue'].map((station) => (
                                    <Flex
                                        key={station}
                                        justifyContent={'center'}
                                        alignItems={'center'}
                                        flexDirection={'column'}
                                        rowGap={'10px'}
                                    >
                                        {teams[station].map((teamNumber, stationIndex) => (
                                            <Flex
                                                key={stationIndex}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                                columnGap={'10px'}
                                            >
                                                <Text fontSize={'lg'} fontWeight={'semibold'}>
                                                    {capitalizeFirstLetter(station)} Station {stationIndex + 1}:
                                                </Text>
                                                <NumberInput
                                                    onChange={(value) => {
                                                        let temp = { ...teams };
                                                        temp[station][stationIndex] = value;
                                                        setTeams(temp);
                                                    }}
                                                    value={teamNumber}
                                                    min={1}
                                                    precision={0}
                                                    width={'30%'}
                                                >
                                                    <NumberInputField
                                                        onKeyDown={(event) => {
                                                            if (event.key === 'Enter') {
                                                                event.target.blur();
                                                            }
                                                        }}
                                                        enterKeyHint='done'
                                                        textAlign={'center'}
                                                        placeholder='Team #'
                                                    />
                                                </NumberInput>
                                            </Flex>
                                        ))}
                                    </Flex>
                                ))}
                            </Flex>
                        </Box>
                    )}
                    <Button
                        isDisabled={!validSetup() || fetchingTeamData}
                        display={'flex'}
                        margin={'0 auto'}
                        marginTop={'15px'}
                        onClick={() => fetchTeamInfo()}
                        isLoading={fetchingTeamData}
                    >
                        Confirm
                    </Button>
                </React.Fragment>
            )}
            {multiTeamEventData !== null && multiOneValidMatchForms !== null && validSetup() && (
                <Box>
                    <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginBottom={'5px'}>
                        {currentEvent.name}
                    </Text>
                    {matchType !== '' && matchNumber !== '' && (
                        <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginBottom={'10px'}>
                            {convertMatchKeyToString(getMatchKey())}
                        </Text>
                    )}
                    <Box width={{ base: '100%', lg: '85%' }} overflowX={'auto'} margin={'0 auto'} marginBottom={'15px'}>
                        <Grid
                            templateColumns={'1fr 2fr 1.5fr 1.5fr 2fr 1.75fr 1.75fr'}
                            borderTop={'1px solid black'}
                            minWidth={'1000px'}
                        >
                            {[
                                { label: 'Team #' },
                                { label: 'Total', subLabels: ['Avg', 'Max', 'GPCS'] },
                                { label: 'Auto', subLabels: ['Avg', 'Max'] },
                                { label: 'Teleop', subLabels: ['Avg', 'Max'] },
                                { label: 'Stage', subLabels: ['Avg', 'Max', 'Hangs'] },
                                { label: 'No Amplif.', subLabels: ['Pts', 'Max Pts'] },
                                { label: '75% Amplif.', subLabels: ['Pts', 'Max Pts'] }
                            ].map((element) => (
                                <React.Fragment key={element.label}>
                                    <GridItem
                                        fontSize={'lg'}
                                        fontWeight={'semibold'}
                                        textAlign={'center'}
                                        display={'flex'}
                                        flexDirection={'column'}
                                        justifyContent={'center'}
                                        alignItems={'center'}
                                        borderBottom={'1px solid black'}
                                        borderRight={'1px solid black'}
                                        backgroundColor={'gray.200'}
                                        padding={'0px 0px'}
                                        position={element.label === 'Team #' && 'sticky'}
                                        left={element.label === 'Team #' && 0}
                                        zIndex={element.label === 'Team #' && 1}
                                        borderLeft={element.label === 'Team #' && '1px solid black'}
                                    >
                                        {!element.subLabels ? (
                                            element.label
                                        ) : (
                                            <React.Fragment>
                                                <Text height={'27px'}>{element.label}</Text>
                                                <Flex height={'27px'} width={'100%'}>
                                                    {element.subLabels.map((subLabel) => (
                                                        <Text key={subLabel} flex={1 / element.subLabels.length}>
                                                            {subLabel}
                                                        </Text>
                                                    ))}
                                                </Flex>
                                            </React.Fragment>
                                        )}
                                    </GridItem>
                                </React.Fragment>
                            ))}
                            {['red', 'blue'].map((alliance, index) => (
                                <React.Fragment key={alliance}>
                                    <GridItem
                                        fontSize={'xl'}
                                        fontWeight={'medium'}
                                        textAlign={'center'}
                                        display={'flex'}
                                        justifyContent={'center'}
                                        alignItems={'center'}
                                        borderBottom={'1px solid black'}
                                        borderRight={'1px solid black'}
                                        backgroundColor={alliance === 'red' ? 'red.200' : 'blue.200'}
                                        rowEnd={index * 3 + 5}
                                        colEnd={7}
                                        rowSpan={3}
                                        colSpan={1}
                                    >
                                        <Text flex={1 / 2}>{roundToTenth(getAvgTotalPoints(alliance))}</Text>
                                        <Text flex={1 / 2}>{roundToTenth(getMaxTotalPoints(alliance))}</Text>
                                    </GridItem>
                                    <GridItem
                                        fontSize={'xl'}
                                        fontWeight={'medium'}
                                        textAlign={'center'}
                                        display={'flex'}
                                        justifyContent={'center'}
                                        alignItems={'center'}
                                        borderBottom={'1px solid black'}
                                        borderRight={'1px solid black'}
                                        backgroundColor={alliance === 'red' ? 'red.200' : 'blue.200'}
                                        rowEnd={index * 3 + 5}
                                        colEnd={8}
                                        rowSpan={3}
                                        colSpan={1}
                                    >
                                        <Text flex={1 / 2}>{roundToTenth(getAvgTotalPoints(alliance, 0.75))}</Text>
                                        <Text flex={1 / 2}>{roundToTenth(getMaxTotalPoints(alliance, 0.75))}</Text>
                                    </GridItem>
                                </React.Fragment>
                            ))}

                            {[...teams.red, ...teams.blue].map((teamNumber, index) => (
                                <React.Fragment key={teamNumber}>
                                    <GridItem
                                        fontSize={'lg'}
                                        fontWeight={'medium'}
                                        textAlign={'center'}
                                        display={'flex'}
                                        justifyContent={'center'}
                                        alignItems={'center'}
                                        borderBottom={'1px solid black'}
                                        borderRight={'1px solid black'}
                                        backgroundColor={index > 2 ? 'blue.200' : 'red.200'}
                                        minHeight={'35px'}
                                        position={'sticky'}
                                        left={0}
                                        zIndex={1}
                                        borderLeft={'1px solid black'}
                                        as={Link}
                                        to={`/team/${teamNumber}/${teamPageTabs.overview}`}
                                        _hover={
                                            index > 2 ? { backgroundColor: 'blue.300' } : { backgroundColor: 'red.300' }
                                        }
                                        _active={
                                            index > 2 ? { backgroundColor: 'blue.400' } : { backgroundColor: 'red.400' }
                                        }
                                    >
                                        {teamNumber}
                                    </GridItem>

                                    {multiTeamEventData[teamNumber] && (
                                        <React.Fragment>
                                            <Grid
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                                display={'flex'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                                borderBottom={'1px solid black'}
                                                borderRight={'1px solid black'}
                                                backgroundColor={index > 2 ? 'blue.200' : 'red.200'}
                                            >
                                                <Text flex={1 / 3}>
                                                    {roundToTenth(multiTeamEventData[teamNumber].offensivePoints.avg)}
                                                </Text>
                                                <Text flex={1 / 3}>
                                                    {multiTeamEventData[teamNumber].offensivePoints.max}
                                                </Text>
                                                <Text flex={1 / 3}>
                                                    {roundToTenth(
                                                        multiTeamEventData[teamNumber].autoGP.ampScore.avg +
                                                            multiTeamEventData[teamNumber].autoGP.speakerScore.avg +
                                                            multiTeamEventData[teamNumber].teleopGP.ampScore.avg +
                                                            multiTeamEventData[teamNumber].teleopGP.speakerScore.avg
                                                    )}
                                                </Text>
                                            </Grid>
                                            <Grid
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                                display={'flex'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                                borderBottom={'1px solid black'}
                                                borderRight={'1px solid black'}
                                                backgroundColor={index > 2 ? 'blue.200' : 'red.200'}
                                            >
                                                <Text flex={1 / 2}>
                                                    {roundToTenth(multiTeamEventData[teamNumber].autoPoints.avg)}
                                                </Text>
                                                <Text flex={1 / 2}>
                                                    {multiTeamEventData[teamNumber].autoPoints.max}
                                                </Text>
                                            </Grid>
                                            <Grid
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                                display={'flex'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                                borderBottom={'1px solid black'}
                                                borderRight={'1px solid black'}
                                                backgroundColor={index > 2 ? 'blue.200' : 'red.200'}
                                            >
                                                <Text flex={1 / 2}>
                                                    {roundToTenth(multiTeamEventData[teamNumber].teleopPoints.avg)}
                                                </Text>
                                                <Text flex={1 / 2}>
                                                    {multiTeamEventData[teamNumber].teleopPoints.max}
                                                </Text>
                                            </Grid>
                                            <Grid
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                                display={'flex'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                                borderBottom={'1px solid black'}
                                                borderRight={'1px solid black'}
                                                backgroundColor={index > 2 ? 'blue.200' : 'red.200'}
                                            >
                                                <Text flex={1 / 3}>
                                                    {roundToTenth(multiTeamEventData[teamNumber].stagePoints.avg)}
                                                </Text>
                                                <Text flex={1 / 3}>
                                                    {multiTeamEventData[teamNumber].stagePoints.max}
                                                </Text>
                                                <Text flex={1 / 3}>
                                                    {multiTeamEventData[teamNumber].climbSuccessFraction || 'N/A'}
                                                </Text>
                                            </Grid>
                                        </React.Fragment>
                                    )}
                                    {!multiTeamEventData[teamNumber] && (
                                        <React.Fragment>
                                            <GridItem
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                                display={'flex'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                                borderBottom={'1px solid black'}
                                                borderRight={'1px solid black'}
                                                backgroundColor={index > 2 ? 'blue.200' : 'red.200'}
                                                colSpan={4}
                                            >
                                                No data avaliable
                                            </GridItem>
                                        </React.Fragment>
                                    )}
                                </React.Fragment>
                            ))}
                        </Grid>
                    </Box>
                    <Flex
                        margin={'0 auto'}
                        justifyContent={'center'}
                        columnGap={'10px'}
                        rowGap={'5px'}
                        marginTop={matchType !== '' && matchNumber !== '' ? '0px' : '25px'}
                        marginBottom={'15px'}
                        flexWrap={'wrap'}
                        width={'80%'}
                    >
                        {Object.keys(tabs).map((tabKey) => (
                            <Button
                                key={tabs[tabKey]}
                                colorScheme={tabs[tabKey] === tab ? 'green' : 'gray'}
                                onClick={() => setTab(tabs[tabKey])}
                            >
                                {tabs[tabKey]}
                            </Button>
                        ))}
                    </Flex>
                    <Box hidden={tab !== tabs.graphs}>
                        <MatchLineGraphs
                            teamNumbers={[...teams.red, ...teams.blue]}
                            multiTeamMatchForms={Object.fromEntries(
                                [...teams.red, ...teams.blue].map((teamNumber) => [
                                    teamNumber,
                                    multiOneValidMatchForms[teamNumber]
                                ])
                            )}
                            onTeamPage={false}
                        />
                    </Box>
                    <Box hidden={tab !== tabs.autoPaths}>
                        <AutoPaths
                            teamNumbers={[...teams.red, ...teams.blue]}
                            autoPaths={Object.fromEntries(
                                [...teams.red, ...teams.blue].map((teamNumber) => [
                                    teamNumber,
                                    multiTeamEventData[teamNumber]?.autoPaths
                                ])
                            )}
                            onTeamPage={false}
                        />
                    </Box>
                    <Box hidden={tab !== tabs.stats}>
                        <TeamStatsList
                            teamNumbers={[...teams.red, ...teams.blue]}
                            multiTeamEventsData={Object.fromEntries(
                                [...teams.red, ...teams.blue].map((teamNumber) => [
                                    teamNumber,
                                    multiTeamEventData[teamNumber]
                                ])
                            )}
                            multiTeamMatchForms={Object.fromEntries(
                                [...teams.red, ...teams.blue].map((teamNumber) => [
                                    teamNumber,
                                    multiOneValidMatchForms[teamNumber]
                                ])
                            )}
                            onTeamPage={false}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
}

export default MatchAnalystPage;

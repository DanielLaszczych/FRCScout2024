import React, { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { capitalizeFirstLetter, convertMatchKeyToString, sortEvents } from '../util/helperFunctions';
import {
    Box,
    Button,
    Center,
    Flex,
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
import { matchFormStatus, year } from '../util/helperConstants';
import { MdOutlineWifi, MdOutlineWifiOff } from 'react-icons/md';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { FaSearch } from 'react-icons/fa';
import MatchLineGraphs from '../components/MatchLineGraphs';
import AutoPaths from '../components/AutoPaths';
import TeamStatsList from '../components/TeamStatsList';

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
                console.log(data);
                let events = data;
                events = events.filter((event) => event.key !== `${year}cmptx`);
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

    useEffect(() => {
        function getTeamNumbers() {
            if (matchType === '') return;
            let matchKey = getMatchKey();
            if (matchKey === null) {
                return;
            }
            setFetchingTeamData(true);
            fetch(`/blueAlliance/match/${currentEvent.key}_${matchKey}/simple`)
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
                        setFetchingTeamData(false);
                    }
                })
                .catch((error) => {
                    if (error?.name !== 'AbortError') {
                        console.log(error);
                        setError(error.message);
                        setFetchingTeamData(false);
                    }
                });
        }
        setMatchNumberError('');
        setTeams({ red: ['', '', ''], blue: ['', '', ''] });
        if (!manualMode) {
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
                console.log(data);
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

    useEffect(() => {
        if (!manualMode && validSetup() && matchType !== '' && matchNumber !== '') {
            fetchTeamInfo();
        }
    }, [manualMode, validSetup, fetchTeamInfo, matchType, matchNumber]);

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
                    setMatchNumber('');
                    setMultiTeamEventData(null);
                    setMutliOneValidMatchForms(null);
                }}
                icon={<FaSearch />}
            />
            {multiTeamEventData === null && multiOneValidMatchForms === null && (
                <React.Fragment>
                    <IconButton
                        position={'absolute'}
                        left={'15px'}
                        onClick={() => {
                            setMatchNumber('');
                            setManualMode(!manualMode);
                        }}
                        icon={manualMode ? <MdOutlineWifiOff /> : <MdOutlineWifi />}
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
                                        base: '65%',
                                        md: '30%',
                                        lg: '30%'
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
                                                    width={'50%'}
                                                >
                                                    <NumberInputField
                                                        onKeyDown={(event) => {
                                                            if (event.key === 'Enter') {
                                                                event.target.blur();
                                                            }
                                                        }}
                                                        enterKeyHint='done'
                                                        textAlign={'center'}
                                                        placeholder='Enter Team #'
                                                    />
                                                </NumberInput>
                                            </Flex>
                                        ))}
                                    </Flex>
                                ))}
                            </Flex>
                            <Button
                                isDisabled={!validSetup() || fetchingTeamData}
                                display={'flex'}
                                margin={'0 auto'}
                                marginTop={'20px'}
                                onClick={() => fetchTeamInfo()}
                            >
                                Confirm
                            </Button>
                        </Box>
                    )}
                </React.Fragment>
            )}
            {fetchingTeamData && (
                <Center marginTop={'15px'}>
                    <Spinner />
                </Center>
            )}
            {!manualMode && doneFetching() && matchNumberError && (
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
            {multiTeamEventData !== null && multiOneValidMatchForms !== null && (
                <Box>
                    <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginBottom={'5px'}>
                        {currentEvent.name}
                    </Text>
                    {matchType !== '' && matchNumber !== '' && (
                        <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginBottom={'10px'}>
                            {convertMatchKeyToString(getMatchKey())}
                        </Text>
                    )}
                    <Flex
                        justifyContent={'center'}
                        columnGap={'10px'}
                        marginTop={matchType !== '' && matchNumber !== '' ? '0px' : '25px'}
                        marginBottom={'15px'}
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
                    {tab === tabs.graphs && (
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
                    )}
                    {tab === tabs.autoPaths && (
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
                    )}
                    {tab === tabs.stats && (
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
                    )}
                </Box>
            )}
        </Box>
    );
}

export default MatchAnalystPage;

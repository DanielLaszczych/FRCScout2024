import { ChevronDownIcon, StarIcon } from '@chakra-ui/icons';
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
import { React, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { fetchAndCache, sortEvents } from '../util/helperFunctions';
import { MdOutlineWifi, MdOutlineWifiOff } from 'react-icons/md';
import { GlobalContext } from '../context/globalState';

let stations = [
    { label: 'Red Station 1', value: 'r1', id: uuidv4() },
    { label: 'Red Station 2', value: 'r2', id: uuidv4() },
    { label: 'Red Station 3', value: 'r3', id: uuidv4() },
    { label: 'Blue Station 1', value: 'b1', id: uuidv4() },
    { label: 'Blue Station 2', value: 'b2', id: uuidv4() },
    { label: 'Blue Station 3', value: 'b3', id: uuidv4() }
];
let matchTypes = [
    { label: 'Practice', value: 'p', id: uuidv4() },
    { label: 'Quals', value: 'q', id: uuidv4() },
    { label: 'Playoffs', value: 'sf', id: uuidv4() },
    { label: 'Finals', value: 'f', id: uuidv4() }
];
let enableEventDropdown = true;

function PreStandForm() {
    let navigate = useNavigate();

    const { offline } = useContext(GlobalContext);

    const [error, setError] = useState(null);
    const [events, setEvents] = useState(null);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [focusedEvent, setFocusedEvent] = useState(null);
    const [station, setStation] = useState('');
    const [focusedStation, setFocusedStation] = useState('');
    const [matchType, setMatchType] = useState('');
    const [focusedMatchType, setFocusedMatchType] = useState('');
    const [matchNumber, setMatchNumber] = useState('');
    const [teamNumber, setTeamNumber] = useState(null);
    const [teamName, setTeamName] = useState(null);
    const [futureAlly, setFutureAlly] = useState(null);
    const [teamNumberError, setTeamNumberError] = useState('');
    const [manualMode, setManualMode] = useState(null);

    const abort = useRef(new AbortController());

    useEffect(() => {
        if (localStorage.getItem('PreStandFormData')) {
            let data = JSON.parse(localStorage.getItem('PreStandFormData'));
            setStation(data.station);
            setMatchType(data.matchType);
            setManualMode(data.manualMode);
        } else {
            setManualMode(false);
        }
    }, []);

    useEffect(() => {
        fetchAndCache('/event/getEventsSimple')
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
                if (enableEventDropdown) {
                    let data = JSON.parse(localStorage.getItem('PreStandFormData'));
                    currentEvent = events.find((event) => event.key === data.event);
                }
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
                setTeamNumberError('Error: Invalid match number for playoffs');
                return null;
            }
            matchKey = `sf${matchNumber}m1`;
        } else {
            matchKey = `f1m${matchNumber}`;
        }
        return matchKey;
    }, [matchNumber, matchType.value]);

    const enableManualMode = useCallback(() => {
        return manualMode || matchType.value === 'p' || offline;
    }, [manualMode, matchType.value, offline]);

    useEffect(() => {
        function getTeamNumber() {
            abort.current = new AbortController();
            if (station === '' || matchType === '') return;
            let matchKey = getMatchKey();
            if (matchKey === null) {
                return;
            }
            fetch(`/blueAlliance/match/${currentEvent.key}_${matchKey}/simple`, { signal: abort.current.signal })
                .then((response) => response.json())
                .then((data) => {
                    if (!data.Error) {
                        let teamNumber;
                        let stationNumber = parseInt(station.value.charAt(1)) - 1;
                        if (station.value.charAt(0) === 'r') {
                            teamNumber = data.alliances.red.team_keys[stationNumber].substring(3);
                        } else {
                            teamNumber = data.alliances.blue.team_keys[stationNumber].substring(3);
                        }
                        setTeamNumber(teamNumber);
                        fetch(`/blueAlliance/isFutureAlly/${currentEvent.key}/${teamNumber}/${matchKey}/${false}`, {
                            signal: abort.current.signal
                        })
                            .then((response) => response.json())
                            .then((data) => {
                                setFutureAlly(data);
                            })
                            .catch((error) => {
                                if (error?.name !== 'AbortError') {
                                    console.log(error);
                                    setError(error.message);
                                }
                            });
                        fetch(`/blueAlliance/team/frc${teamNumber}/simple`, { signal: abort.current.signal })
                            .then((response) => response.json())
                            .then((data) => {
                                if (!data.Error) {
                                    setTeamName(data.nickname);
                                } else {
                                    setTeamNumber(null);
                                    setTeamName(null);
                                    setFutureAlly(null);
                                    setTeamNumberError(`Error: (${data.Error})`);
                                }
                            })
                            .catch((error) => {
                                if (error?.name !== 'AbortError') {
                                    console.log(error);
                                    setError(error.message);
                                }
                            });
                    } else {
                        setTeamNumber(null);
                        setTeamName(null);
                        setFutureAlly(null);
                        setTeamNumberError(`Error: (${data.Error})`);
                    }
                })
                .catch((error) => {
                    if (error?.name !== 'AbortError') {
                        console.log(error);
                        setError(error.message);
                    }
                });
        }
        setTeamNumberError('');
        setTeamNumber(null);
        setTeamName(null);
        setFutureAlly(null);
        abort.current.abort();
        if (!enableManualMode()) {
            getTeamNumber();
        }
    }, [station, matchType, matchNumber, currentEvent, getMatchKey, enableManualMode]);

    function validSetup() {
        return (
            station !== '' &&
            matchType !== '' &&
            matchNumber !== '' &&
            teamNumber &&
            ((teamName && futureAlly !== null) || enableManualMode())
        );
    }

    function doneFetching() {
        if (station === '' || matchType === '' || matchNumber === '' || teamNumberError) {
            return true; // this means we are not trying to fetch anything because the required fields are missing
        }
        return teamNumber && futureAlly !== null && teamName;
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

    if (currentEvent === null || manualMode === null) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Box margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
            <IconButton
                position={'absolute'}
                right={'15px'}
                isDisabled={matchType.value === 'p' || offline}
                onClick={() => setManualMode(!manualMode)}
                icon={enableManualMode() ? <MdOutlineWifiOff /> : <MdOutlineWifi />}
            />
            {enableEventDropdown && (
                <Center marginBottom={'15px'}>
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
            )}
            <Text
                fontSize={'xl'}
                fontWeight={'semibold'}
                textAlign={'center'}
                margin={'0 auto'}
                marginBottom={'20px'}
                maxWidth={'calc(100% - 100px)'}
            >
                Competition: {currentEvent.name}
            </Text>
            <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginBottom={'10px'}>
                Alliance Station
            </Text>
            <Menu placement={'bottom'}>
                <MenuButton
                    display={'flex'}
                    margin={'0 auto'}
                    onClick={() => setFocusedStation(station)}
                    as={Button}
                    rightIcon={<ChevronDownIcon />}
                >
                    {station === '' ? 'Choose Station' : station.label}
                </MenuButton>
                <MenuList>
                    {stations.map((stationItem) => (
                        <MenuItem
                            _focus={{ backgroundColor: 'none' }}
                            onMouseEnter={() => setFocusedStation(stationItem)}
                            backgroundColor={
                                (station.value === stationItem.value && focusedStation === '') ||
                                focusedStation.value === stationItem.value
                                    ? 'gray.100'
                                    : 'none'
                            }
                            maxW={'80vw'}
                            key={stationItem.id}
                            display={'flex'}
                            justifyContent={'center'}
                            onClick={() => setStation(stationItem)}
                        >
                            {stationItem.label}
                        </MenuItem>
                    ))}
                </MenuList>
            </Menu>
            <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginTop={'20px'} marginBottom={'10px'}>
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
                    />
                </NumberInput>
            ) : null}
            <Flex
                alignItems={'center'}
                justifyContent={'center'}
                marginTop={'20px'}
                marginBottom={'10px'}
                columnGap={'10px'}
            >
                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                    Team Number{enableManualMode() ? '' : doneFetching() ? `: ${teamNumber || ''}` : ': '}
                </Text>
                {!enableManualMode() && doneFetching() && futureAlly ? (
                    <StarIcon stroke={'black'} viewBox={'-1 -1 26 26'} fontSize={'lg'} color={'yellow.300'} />
                ) : null}
                {!enableManualMode() && teamNumberError !== '' && (
                    //width={'calc(100% - 73px)'} make the px slightly bigger than the width of the text from above
                    <Text
                        color={'red.500'}
                        fontSize={'lg'}
                        fontWeight={'semibold'}
                        textAlign={'center'}
                        maxWidth={'calc(100% - 122px)'}
                    >
                        {teamNumberError}
                    </Text>
                )}
                {!enableManualMode() && !doneFetching() ? <Spinner fontSize={'lg'} /> : null}
            </Flex>
            {!enableManualMode() ? (
                <Flex alignItems={'center'} justifyContent={'center'} marginTop={'10px'} columnGap={'10px'}>
                    <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                        Team Name: {!doneFetching() ? '' : teamName}
                    </Text>
                    {teamNumberError !== '' && (
                        //width={'calc(100% - 63px)'} make the px slightly bigger than the width of the text from above
                        <Text
                            color={'red.500'}
                            fontSize={'lg'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            maxWidth={'calc(100% - 102px)'}
                        >
                            {teamNumberError}
                        </Text>
                    )}
                    {!doneFetching() ? <Spinner fontSize={'lg'} /> : null}
                </Flex>
            ) : null}
            {enableManualMode() ? (
                <NumberInput
                    margin={'0 auto'}
                    onChange={(value) => setTeamNumber(value)}
                    value={teamNumber || ''}
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
                        placeholder='Enter Team #'
                    />
                </NumberInput>
            ) : null}
            <Button
                isDisabled={!validSetup()}
                display={'flex'}
                margin={'0 auto'}
                marginBottom={'15px'}
                marginTop={'20px'}
                onClick={() => {
                    localStorage.setItem(
                        'PreStandFormData',
                        JSON.stringify({ station, matchType, manualMode, event: currentEvent.key })
                    );
                    navigate(`/standForm/${currentEvent.key}/${getMatchKey()}/${station.value}/${teamNumber}`);
                }}
            >
                Confirm
            </Button>
        </Box>
    );
}

export default PreStandForm;

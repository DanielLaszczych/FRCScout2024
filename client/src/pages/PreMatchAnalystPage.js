import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from '@chakra-ui/icons';
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
import { RiEditBoxFill } from 'react-icons/ri';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { capitalizeFirstLetter, sortEvents } from '../util/helperFunctions';

let matchTypes = [
    { label: 'Quals', value: 'q', id: uuidv4() },
    { label: 'Playoffs', value: 'sf', id: uuidv4() },
    { label: 'Finals', value: 'f', id: uuidv4() }
];

function MatchAnalystPage() {
    const navigate = useNavigate();
    const { state } = useLocation();

    const [error, setError] = useState(null);
    const [events, setEvents] = useState(null);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [focusedEvent, setFocusedEvent] = useState(null);
    const [matchType, setMatchType] = useState('');
    const [focusedMatchType, setFocusedMatchType] = useState('');
    const [matchNumber, setMatchNumber] = useState('');
    const [manualMode, setManualMode] = useState(null);
    const [teams, setTeams] = useState(state ? state.teams : { red: ['', '', ''], blue: ['', '', ''] });
    const [matchNumberError, setMatchNumberError] = useState('');

    const abort = useRef(new AbortController());

    useEffect(() => {
        if (localStorage.getItem('PreMatchAnalystData')) {
            let data = JSON.parse(localStorage.getItem('PreMatchAnalystData'));
            setMatchType(data.matchType);
            if (state) {
                setManualMode(true);
            } else {
                setManualMode(data.manualMode);
            }
        } else {
            setManualMode(false);
        }
    }, [state]);

    useEffect(() => {
        if (manualMode !== null && !state) {
            localStorage.setItem('PreMatchAnalystData', JSON.stringify({ matchType, manualMode }));
        }
    }, [matchType, manualMode, state]);

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
        if (manualMode === null) return;
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
                    setManualMode(!manualMode);
                }}
                size={'sm'}
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
                display={'flex'}
                margin={'0 auto'}
                marginTop={'15px'}
                onClick={() =>
                    navigate(
                        `/matchAnalyst/${currentEvent.key}/${[...teams.red, ...teams.blue].join('/')}/${
                            getMatchKey() || ''
                        }`
                    )
                }
                isDisabled={!validSetup()}
            >
                Confirm
            </Button>
        </Box>
    );
}

export default MatchAnalystPage;

import { useQuery } from '@apollo/client';
import { ChevronDownIcon, LockIcon, StarIcon, UnlockIcon } from '@chakra-ui/icons';
import { Box, Button, Center, Flex, HStack, IconButton, Menu, MenuButton, MenuItem, MenuList, NumberInput, NumberInputField, Spinner, Text } from '@chakra-ui/react';
import { React, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GET_CURRENT_EVENT } from '../graphql/queries';
import { v4 as uuidv4 } from 'uuid';

let stations = [
    { label: 'Red Station 1', value: 'r1', id: uuidv4() },
    { label: 'Red Station 2', value: 'r2', id: uuidv4() },
    { label: 'Red Station 3', value: 'r3', id: uuidv4() },
    { label: 'Blue Station 1', value: 'b1', id: uuidv4() },
    { label: 'Blue Station 2', value: 'b2', id: uuidv4() },
    { label: 'Blue Station 3', value: 'b3', id: uuidv4() },
];
let matchTypes = [
    { label: 'Quals', value: 'q', id: uuidv4() },
    { label: 'Playoffs', value: 'sf', id: uuidv4() },
    { label: 'Finals', value: 'f', id: uuidv4() },
];

function PreStandForm() {
    let navigate = useNavigate();

    const [error, setError] = useState(null);
    const abort = useRef(new AbortController());
    const [station, setStation] = useState('');
    const [focusedStation, setFocusedStation] = useState('');
    const [matchType, setMatchType] = useState('');
    const [focusedMatchType, setFocusedMatchType] = useState('');
    const [matchNumber, setMatchNumber] = useState('');
    const [teamNumber, setTeamNumber] = useState(null);
    const [teamName, setTeamName] = useState(null);
    const [futureAlly, setFutureAlly] = useState(null);
    const [teamNumberError, setTeamNumberError] = useState('');
    const [manualMode, setManualMode] = useState('');

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

    const {
        loading: loadingCurrentEvent,
        error: currentEventError,
        data: { getCurrentEvent: currentEvent } = {},
    } = useQuery(GET_CURRENT_EVENT, {
        onError(err) {
            if (err.message === 'Error: There is no current event') {
                setError('There is no current event');
            } else {
                console.log(JSON.stringify(err, null, 2));
                setError('Apollo error, could not retrieve current event data');
            }
        },
    });

    const getMatchKey = useCallback(() => {
        let matchKey;
        if (matchNumber === '') {
            return null;
        }
        if (matchType.value === 'q') {
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

    useEffect(() => {
        function getTeamNumber() {
            setTeamNumber(null);
            setTeamName(null);
            setFutureAlly(null);
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
                        fetch(`/blueAlliance/isFutureAlly/${currentEvent.key}/${teamNumber}/${matchKey}/${false}`, { signal: abort.current.signal })
                            .then((response) => response.json())
                            .then((data) => {
                                setFutureAlly(data);
                            })
                            .catch((error) => {
                                if (error?.name !== 'AbortError') {
                                    console.log(error);
                                    setError(error);
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
                                    setError(error);
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
                        setError(error);
                    }
                });
        }
        setTeamNumberError('');
        if (!manualMode) {
            setTeamNumber(null);
            setTeamName(null);
            setFutureAlly(null);
            abort.current.abort();
            getTeamNumber();
        }
    }, [station, matchType, matchNumber, currentEvent, getMatchKey, manualMode]);

    function validSetup() {
        return station !== '' && matchType !== '' && matchNumber !== '' && teamNumber && ((teamName && futureAlly !== null) || manualMode);
    }

    function doneFetching() {
        if (station === '' || matchType === '' || matchNumber === '' || teamNumberError) {
            return true; // this means we are not trying to fetch anything because the required fields are missing
        }
        return teamNumber && futureAlly !== null && teamName;
    }

    if (error) {
        return (
            <Box textAlign={'center'} fontSize={'25px'} fontWeight={'medium'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
                {error}
            </Box>
        );
    }

    if (loadingCurrentEvent || manualMode === '' || (currentEventError && error !== false)) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Box margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
            <Box>
                <Box boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'} borderRadius={'10px'} padding={'10px'}>
                    <HStack spacing={'auto'} marginBottom={'20px'}>
                        <Text fontWeight={'bold'} fontSize={'110%'}>
                            Competition: {currentEvent.name}
                        </Text>
                        <IconButton _focus={{ outline: 'none' }} onClick={() => setManualMode(!manualMode)} icon={!manualMode ? <LockIcon /> : <UnlockIcon />}></IconButton>
                    </HStack>
                    <Text marginBottom={'10px'} fontWeight={'bold'} fontSize={'110%'}>
                        Alliance Station:
                    </Text>
                    <Menu>
                        <MenuButton marginLeft={'10px'} onClick={() => setFocusedStation(station)} _focus={{ outline: 'none' }} as={Button} rightIcon={<ChevronDownIcon />}>
                            {station === '' ? 'Choose Station' : station.label}
                        </MenuButton>
                        <MenuList>
                            {stations.map((stationItem) => (
                                <MenuItem
                                    _focus={{ backgroundColor: 'none' }}
                                    onMouseEnter={() => setFocusedStation(stationItem)}
                                    backgroundColor={(station.value === stationItem.value && focusedStation === '') || focusedStation.value === stationItem.value ? 'gray.100' : 'none'}
                                    maxW={'80vw'}
                                    key={stationItem.id}
                                    onClick={() => setStation(stationItem)}
                                >
                                    {stationItem.label}
                                </MenuItem>
                            ))}
                        </MenuList>
                    </Menu>
                    <Text marginTop={'20px'} marginBottom={'10px'} fontWeight={'bold'} fontSize={'110%'}>
                        Match Number:
                    </Text>
                    <Menu>
                        <MenuButton marginLeft={'10px'} onClick={() => setFocusedMatchType(matchType)} _focus={{ outline: 'none' }} as={Button} rightIcon={<ChevronDownIcon />}>
                            {matchType === '' ? 'Choose Match Type' : matchType.label}
                        </MenuButton>
                        <MenuList>
                            {matchTypes.map((matchTypeItem) => (
                                <MenuItem
                                    _focus={{ backgroundColor: 'none' }}
                                    onMouseEnter={() => setFocusedMatchType(matchTypeItem)}
                                    backgroundColor={(matchType.value === matchTypeItem.value && focusedMatchType === '') || focusedMatchType.value === matchTypeItem.value ? 'gray.100' : 'none'}
                                    maxW={'80vw'}
                                    key={matchTypeItem.id}
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
                    <HStack marginTop={'10px'}>
                        {matchType !== '' ? (
                            <NumberInput
                                marginLeft={'10px'}
                                onChange={(value) => setMatchNumber(value)}
                                value={matchNumber}
                                min={1}
                                precision={0}
                                width={{
                                    base: matchType === 'Quals' ? '75%' : '62%',
                                    md: '66%',
                                    lg: '50%',
                                }}
                            >
                                <NumberInputField
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.target.blur();
                                        }
                                    }}
                                    enterKeyHint='done'
                                    _focus={{
                                        outline: 'none',
                                        boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                                    }}
                                    textAlign={'center'}
                                    placeholder='Enter Match #'
                                />
                            </NumberInput>
                        ) : null}
                    </HStack>
                    <Flex alignItems={'center'} marginTop={'10px'} marginBottom={'10px'}>
                        <Text fontWeight={'bold'} fontSize={'110%'}>
                            Team Number: {!manualMode ? (doneFetching() ? teamNumber : '') : ''}
                        </Text>
                        {!manualMode && doneFetching() && futureAlly ? <StarIcon stroke={'black'} viewBox={'-1 -1 26 26'} fontSize={'30px'} color={'yellow.300'} marginLeft={'10px'} /> : null}
                        {!manualMode && teamNumberError !== '' && (
                            <Text color={'red.500'} marginTop={'10px'} marginBottom={'10px'} fontWeight={'bold'} fontSize={'110%'}>
                                {teamNumberError}
                            </Text>
                        )}
                        {!doneFetching() && !manualMode ? <Spinner marginLeft={'15px'} fontSize={'50px'} /> : null}
                    </Flex>
                    {!manualMode ? (
                        <Flex alignItems={'center'} marginTop={'10px'} marginBottom={'10px'}>
                            <Text fontWeight={'bold'} fontSize={'110%'}>
                                Team Name: {!doneFetching() ? '' : teamName}
                            </Text>
                            {teamNumberError !== '' && (
                                <Text color={'red.500'} marginTop={'10px'} marginBottom={'10px'} fontWeight={'bold'} fontSize={'110%'}>
                                    {teamNumberError}
                                </Text>
                            )}
                            {!doneFetching() ? <Spinner marginLeft={'15px'} fontSize={'50px'} /> : null}
                        </Flex>
                    ) : null}
                    {manualMode ? (
                        <NumberInput
                            marginLeft={'10px'}
                            onChange={(value) => setTeamNumber(value)}
                            value={teamNumber || ''}
                            min={1}
                            precision={0}
                            width={{
                                base: '75%',
                                md: '66%',
                                lg: '50%',
                            }}
                        >
                            <NumberInputField
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.target.blur();
                                    }
                                }}
                                enterKeyHint='done'
                                _focus={{
                                    outline: 'none',
                                    boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                                }}
                                textAlign={'center'}
                                placeholder='Enter Team #'
                            />
                        </NumberInput>
                    ) : null}
                </Box>
                <Center>
                    <Button
                        isDisabled={!validSetup()}
                        _focus={{ outline: 'none' }}
                        marginBottom={'20px'}
                        marginTop={'20px'}
                        onClick={() => {
                            localStorage.setItem('PreStandFormData', JSON.stringify({ station, matchType, manualMode }));
                            navigate(`/standForm/${currentEvent.key}/${getMatchKey()}/${station.value}/${teamNumber}`);
                        }}
                    >
                        Confirm
                    </Button>
                </Center>
            </Box>
        </Box>
    );
}

export default PreStandForm;

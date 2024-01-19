import { ChevronDownIcon, LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { Box, Button, Center, Flex, HStack, IconButton, Menu, MenuButton, MenuItem, MenuList, NumberInput, NumberInputField, Spinner, Text } from '@chakra-ui/react';
import { React, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { fetchAndCache } from '../util/helperFunctions';

let alliances = [
    { label: 'Red', value: 'r', id: uuidv4() },
    { label: 'Blue', value: 'b', id: uuidv4() }
];
let matchTypes = [
    { label: 'Quals', value: 'q', id: uuidv4() },
    { label: 'Playoffs', value: 'sf', id: uuidv4() },
    { label: 'Finals', value: 'f', id: uuidv4() }
];

function PreSuperForm() {
    let navigate = useNavigate();

    const [error, setError] = useState(null);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [alliance, setAlliance] = useState('');
    const [focusedAlliance, setFocusedAlliance] = useState('');
    const [matchType, setMatchType] = useState('');
    const [focusedMatchType, setFocusedMatchType] = useState('');
    const [matchNumber, setMatchNumber] = useState('');
    const [teamNumbers, setTeamNumbers] = useState(['', '', '']);
    const [teamNumberError, setTeamNumberError] = useState('');
    const [manualMode, setManualMode] = useState(null);

    const abort = useRef(new AbortController());

    useEffect(() => {
        if (localStorage.getItem('PreSuperFormData')) {
            let data = JSON.parse(localStorage.getItem('PreSuperFormData'));
            setAlliance(data.alliance);
            setMatchType(data.matchType);
            setManualMode(data.manualMode);
        } else {
            setManualMode(false);
        }
    }, []);

    useEffect(() => {
        fetchAndCache('/event/getCurrentEvent')
            .then((response) => response.json())
            .then((data) => {
                if (!data) {
                    throw new Error('There is no event to scout 😔');
                } else {
                    setCurrentEvent(data);
                }
            })
            .catch((error) => {
                setError(error.message);
            });
    }, []);

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
        function getTeamNumbers() {
            abort.current = new AbortController();
            if (alliance === '' || matchType === '') return;
            let matchKey = getMatchKey();
            if (matchKey === null) {
                return;
            }
            fetch(`/blueAlliance/match/${currentEvent.key}_${matchKey}/simple`, { signal: abort.current.signal })
                .then((response) => response.json())
                .then((data) => {
                    if (!data.Error) {
                        let teamNumbers;
                        if (alliance.value === 'r') {
                            teamNumbers = data.alliances.red.team_keys.map((teamNumber) => teamNumber.substring(3));
                        } else {
                            teamNumbers = data.alliances.blue.team_keys.map((teamNumber) => teamNumber.substring(3));
                        }
                        setTeamNumbers(teamNumbers);
                    } else {
                        setTeamNumbers(['', '', '']);
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
        if (!manualMode) {
            setTeamNumbers(['', '', '']);
            abort.current.abort();
            getTeamNumbers();
        }
    }, [alliance, matchType, matchNumber, currentEvent, getMatchKey, manualMode]);

    function validSetup() {
        return alliance !== '' && matchType !== '' && matchNumber !== '' && teamNumbers.filter((teamNumber) => teamNumber !== '').length === 3;
    }

    function doneFetching() {
        if (alliance === '' || matchType === '' || matchNumber === '' || teamNumberError) {
            return true; // this means we are not trying to fetch anything because the required fields are missing
        }
        return teamNumbers.filter((teamNumber) => teamNumber !== '').length === 3;
    }

    if (error) {
        return (
            <Box textAlign={'center'} fontSize={'25px'} fontWeight={'medium'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
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
            <Box>
                <Box boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'} borderRadius={'10px'} padding={'10px'}>
                    <HStack justify={'space-between'} marginBottom={'20px'}>
                        <Text fontWeight={'bold'} fontSize={'110%'}>
                            Competition: {currentEvent.name}
                        </Text>
                        <IconButton onClick={() => setManualMode(!manualMode)} icon={!manualMode ? <LockIcon /> : <UnlockIcon />}></IconButton>
                    </HStack>
                    <Text marginBottom={'10px'} fontWeight={'bold'} fontSize={'110%'}>
                        Alliance:
                    </Text>
                    <Menu>
                        <MenuButton marginLeft={'10px'} onClick={() => setFocusedAlliance(alliance)} as={Button} rightIcon={<ChevronDownIcon />}>
                            {alliance === '' ? 'Choose Alliance' : alliance.label}
                        </MenuButton>
                        <MenuList>
                            {alliances.map((allianceItem) => (
                                <MenuItem
                                    _focus={{ backgroundColor: 'none' }}
                                    onMouseEnter={() => setFocusedAlliance(allianceItem)}
                                    backgroundColor={(alliance.value === allianceItem.value && focusedAlliance === '') || focusedAlliance.value === allianceItem.value ? 'gray.100' : 'none'}
                                    maxW={'80vw'}
                                    key={allianceItem.id}
                                    onClick={() => setAlliance(allianceItem)}
                                >
                                    {allianceItem.label}
                                </MenuItem>
                            ))}
                        </MenuList>
                    </Menu>
                    <Text marginTop={'20px'} marginBottom={'10px'} fontWeight={'bold'} fontSize={'110%'}>
                        Match Number:
                    </Text>
                    <Menu>
                        <MenuButton marginLeft={'10px'} onClick={() => setFocusedMatchType(matchType)} as={Button} rightIcon={<ChevronDownIcon />}>
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
                                    lg: '50%'
                                }}
                            >
                                <NumberInputField
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.target.blur();
                                        }
                                    }}
                                    enterKeyHint='done'
                                    textAlign={'center'}
                                    placeholder='Enter Match #'
                                />
                            </NumberInput>
                        ) : null}
                    </HStack>
                    <Flex alignItems={'center'} marginTop={'10px'} marginBottom={'10px'}>
                        <Box fontWeight={'bold'} fontSize={'110%'}>
                            Team Numbers:
                            {!manualMode
                                ? teamNumbers.filter((teamNumber) => teamNumber !== '').length === 3
                                    ? teamNumbers.map((teamNumber, index) => (
                                          //not good practice to use index for key
                                          <Text key={index} marginLeft={'10px'} marginTop={index === 0 && '10px'} marginBottom={index < 2 && '5px'}>
                                              Station {index + 1}: {teamNumber}
                                          </Text>
                                      ))
                                    : ''
                                : ''}
                        </Box>
                        {!manualMode && teamNumberError !== '' && (
                            <Text color={'red.500'} marginTop={'10px'} marginBottom={'10px'} fontWeight={'bold'} fontSize={'110%'}>
                                {teamNumberError}
                            </Text>
                        )}
                        {!doneFetching() && !manualMode ? <Spinner marginLeft={'15px'} fontSize={'50px'} /> : null}
                    </Flex>
                    {manualMode
                        ? teamNumbers.map((teamNumber, index) => (
                              // not good practice to use index for key
                              <HStack key={index} marginLeft={'10px'} marginTop={index === 0 && '10px'} marginBottom={index < 2 && '5px'}>
                                  <Text fontWeight={'bold'} fontSize={'110%'}>
                                      Station {index + 1}:
                                  </Text>
                                  <NumberInput
                                      onChange={(value) => {
                                          let temp = [...teamNumbers];
                                          temp[index] = value;
                                          setTeamNumbers(temp);
                                      }}
                                      value={teamNumber}
                                      min={1}
                                      precision={0}
                                      width={{
                                          base: '50%',
                                          md: '66%',
                                          lg: '50%'
                                      }}
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
                              </HStack>
                          ))
                        : null}
                </Box>
                <Center>
                    <Button
                        isDisabled={!validSetup()}
                        _focus={{ outline: 'none' }}
                        marginBottom={'20px'}
                        marginTop={'20px'}
                        onClick={() => {
                            localStorage.setItem('PreSuperFormData', JSON.stringify({ alliance, matchType, manualMode }));
                            navigate(`/superForm/${currentEvent.key}/${getMatchKey()}/${alliance.value}/${teamNumbers[0]}/${teamNumbers[1]}/${teamNumbers[2]}`);
                        }}
                    >
                        Confirm
                    </Button>
                </Center>
            </Box>
        </Box>
    );
}

export default PreSuperForm;

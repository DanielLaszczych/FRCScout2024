import { ChevronDownIcon } from '@chakra-ui/icons';
import { Box, Button, Center, Flex, IconButton, Menu, MenuButton, MenuItem, MenuList, NumberInput, NumberInputField, Spinner, Text } from '@chakra-ui/react';
import { React, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { fetchAndCache } from '../util/helperFunctions';
import { MdOutlineWifi, MdOutlineWifiOff } from 'react-icons/md';

let alliances = [
    { label: 'Red', value: 'r', id: uuidv4() },
    { label: 'Blue', value: 'b', id: uuidv4() }
];
let matchTypes = [
    { label: 'Practice', value: 'p', id: uuidv4() },
    { label: 'Quals', value: 'q', id: uuidv4() },
    { label: 'Playoffs', value: 'sf', id: uuidv4() },
    { label: 'Finals', value: 'f', id: uuidv4() }
];
let stations = [uuidv4(), uuidv4(), uuidv4()];

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
        return manualMode || matchType.value === 'p';
    }, [manualMode, matchType.value]);

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
        setTeamNumbers(['', '', '']);
        abort.current.abort();
        if (!enableManualMode()) {
            getTeamNumbers();
        }
    }, [alliance, matchType, matchNumber, currentEvent, getMatchKey, enableManualMode]);

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
            <Box textAlign={'center'} fontSize={'lg'} fontWeight={'semibold'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
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
                isDisabled={matchType.value === 'p'}
                onClick={() => setManualMode(!manualMode)}
                icon={enableManualMode() ? <MdOutlineWifiOff /> : <MdOutlineWifi />}
            />
            <Text fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'} margin={'0 auto'} marginBottom={'20px'} maxWidth={'calc(100% - 100px)'}>
                Competition: {currentEvent.name}
            </Text>
            <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginBottom={'10px'}>
                Alliance
            </Text>
            <Menu placement={'bottom'}>
                <MenuButton display={'flex'} margin={'0 auto'} onClick={() => setFocusedAlliance(alliance)} as={Button} rightIcon={<ChevronDownIcon />}>
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
                            display={'flex'}
                            justifyContent={'center'}
                            onClick={() => setAlliance(allianceItem)}
                        >
                            {allianceItem.label}
                        </MenuItem>
                    ))}
                </MenuList>
            </Menu>
            <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginTop={'20px'} marginBottom={'10px'}>
                Match Number
            </Text>
            <Menu placement={'bottom'}>
                <MenuButton display={'flex'} margin={'0 auto'} onClick={() => setFocusedMatchType(matchType)} as={Button} rightIcon={<ChevronDownIcon />}>
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
                        enterKeyHint='done'
                        textAlign={'center'}
                        placeholder='Enter Match #'
                    />
                </NumberInput>
            ) : null}
            <Flex alignItems={'center'} justifyContent={'center'} marginTop={'20px'} columnGap={'10px'}>
                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                    Team Numbers{enableManualMode() ? '' : doneFetching() && teamNumberError === '' ? '' : ': '}
                </Text>
                {!enableManualMode() && teamNumberError !== '' && (
                    <Text color={'red.500'} fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} maxWidth={'calc(100% - 124px)'}>
                        {teamNumberError}
                    </Text>
                )}
                {!enableManualMode() && !doneFetching() ? <Spinner fontSize={'lg'} /> : null}
            </Flex>
            <Flex flexDirection={'column'} alignItems={'center'} rowGap={'5px'} marginTop={'10px'}>
                {!enableManualMode()
                    ? teamNumbers.filter((teamNumber) => teamNumber !== '').length === 3 &&
                      teamNumbers.map((teamNumber, index) => (
                          <Text fontSize={'lg'} fontWeight={'semibold'} key={stations[index]}>
                              Station {index + 1}: {teamNumber}
                          </Text>
                      ))
                    : teamNumbers.map((teamNumber, index) => (
                          <Flex key={stations[index]} justifyContent={'center'} alignItems={'center'} rowGap={'5px'} columnGap={'10px'}>
                              <Text fontSize={'lg'} fontWeight={'semibold'}>
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

            <Button
                isDisabled={!validSetup()}
                display={'flex'}
                margin={'0 auto'}
                marginBottom={'15px'}
                marginTop={'20px'}
                onClick={() => {
                    localStorage.setItem('PreSuperFormData', JSON.stringify({ alliance, matchType, manualMode }));
                    navigate(`/superForm/${currentEvent.key}/${getMatchKey()}/${alliance.value}/${teamNumbers[0]}/${teamNumbers[1]}/${teamNumbers[2]}`);
                }}
            >
                Confirm
            </Button>
        </Box>
    );
}

export default PreSuperForm;

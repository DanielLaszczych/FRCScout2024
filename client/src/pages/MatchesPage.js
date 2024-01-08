import { useQuery } from '@apollo/client';
import { ChevronDownIcon, QuestionIcon, WarningIcon } from '@chakra-ui/icons';
import {
    Box,
    Button,
    Center,
    Grid,
    GridItem,
    IconButton,
    Input,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    Spinner,
    Text,
} from '@chakra-ui/react';
import { React, useEffect, useState } from 'react';
import { GET_EVENTS_KEYS_NAMES, GET_MATCHFORMS_BY_EVENT } from '../graphql/queries';
import { sortMatches, sortRegisteredEvents } from '../util/helperFunctions';
import { MdOutlineDoNotDisturbAlt } from 'react-icons/md';
import MatchesMemo from '../components/MatchesMemo';
import { circularLinkedList } from '../util/circularlinkedlist';
import { AiFillFilter } from 'react-icons/ai';
import { v4 as uuidv4 } from 'uuid';
import { matchFormStatus } from '../util/helperConstants';
import { FcInspection } from 'react-icons/fc';
import { useLocation } from 'react-router-dom';

let matchFormCLL = new circularLinkedList();
matchFormCLL.append({ key: 'none', emptyMsg: 'No matches have been scouted yet' });
matchFormCLL.append({ key: 'followUp', emptyMsg: 'No matches marked as follow up' });
matchFormCLL.append({ key: 'scoutError', emptyMsg: 'No scouting errors' });
matchFormCLL.append({ key: 'noShow', emptyMsg: 'No matches marked as no show' });
matchFormCLL.append({ key: 'missing', emptyMsg: 'No missing matches' });

function MatchesPage() {
    const location = useLocation();

    const [error, setError] = useState(null);
    const [currentEvent, setCurrentEvent] = useState({ name: '', key: '' });
    const [focusedEvent, setFocusedEvent] = useState('');
    const [matchFilter, setMatchFilter] = useState('');
    const [teamFilter, setTeamFilter] = useState('');
    const [scouterFilter, setScouterFilter] = useState('');
    const [matchFormFilter, setMatchFormFilter] = useState(matchFormCLL.getHead());
    const [filteredMatches, setFilteredMatches] = useState(null);
    const [matchListVersion, setMatchListVersion] = useState(0);
    const [allMatches, setAllMatches] = useState(null);
    const [accuarcyData, setAccuarcyData] = useState(null);
    const [loadingAccuarcy, setLoadingAccuracy] = useState(false);

    function fetchAllMatches(eventKey) {
        fetch(`/blueAlliance/event/${eventKey}/matches/simple`)
            .then((response) => response.json())
            .then((data) => {
                if (!data.Error) {
                    let matches = [];
                    for (let match of data) {
                        let index = 0;
                        for (let team of match.alliances.blue.team_keys) {
                            let allianceNumbers = match.alliances.blue.team_keys.map((teamKey) => teamKey.substring(3));
                            matches.push({ matchNumber: match.key.split('_')[1], teamNumber: team.substring(3), station: `b${index + 1}`, allianceNumbers: allianceNumbers, _id: uuidv4() });
                            index += 1;
                        }
                        index = 0;
                        for (let team of match.alliances.red.team_keys) {
                            let allianceNumbers = match.alliances.red.team_keys.map((teamKey) => teamKey.substring(3));
                            matches.push({ matchNumber: match.key.split('_')[1], teamNumber: team.substring(3), station: `r${index + 1}`, allianceNumbers: allianceNumbers, _id: uuidv4() });
                            index += 1;
                        }
                    }
                    setAllMatches(sortMatches(matches));
                } else {
                    setError(data.Error);
                }
            })
            .catch((error) => {
                setError(error);
            });
    }

    const {
        loading: loadingEvents,
        error: eventsError,
        data: { getEvents: events } = {},
    } = useQuery(GET_EVENTS_KEYS_NAMES, {
        fetchPolicy: 'network-only',
        onError(err) {
            console.log(JSON.stringify(err, null, 2));
            setError('Apollo error, could not retrieve registered events');
        },
        onCompleted({ getEvents: events }) {
            let sortedEvents = sortRegisteredEvents(events);
            if (sortedEvents.length > 0) {
                let currentEvent = sortedEvents.find((event) => event.currentEvent);
                if (currentEvent === undefined) {
                    setCurrentEvent({ name: sortedEvents[sortedEvents.length - 1].name, key: sortedEvents[sortedEvents.length - 1].key, custom: sortedEvents[sortedEvents.length - 1].custom });
                    setFocusedEvent(sortedEvents[sortedEvents.length - 1].name);
                } else {
                    setCurrentEvent({ name: currentEvent.name, key: currentEvent.key, custom: currentEvent.custom });
                    setFocusedEvent(currentEvent.name);
                }
            } else {
                setError('No events registered in the database');
            }
        },
    });

    const {
        loading: loadingMatchForms,
        error: matchFormsError,
        data: { getMatchForms: matchForms } = {},
    } = useQuery(GET_MATCHFORMS_BY_EVENT, {
        skip: currentEvent.key === '',
        fetchPolicy: 'network-only',
        variables: {
            eventKey: currentEvent.key,
        },
        onError(err) {
            console.log(JSON.stringify(err, null, 2));
            setError('Apollo error, could not retrieve match forms');
        },
    });

    useEffect(() => {
        setAllMatches(null);
        if (currentEvent.key) {
            if (currentEvent.custom) {
                setAllMatches([]);
            } else {
                fetchAllMatches(currentEvent.key);
            }
        }
    }, [currentEvent]);

    useEffect(() => {
        if (accuarcyData === null && currentEvent.key !== '') {
            if (location.state && location.state.scoutingError) {
                setMatchFormFilter(matchFormCLL.getElementAt(2));
                getAccuracy(currentEvent);
            } else {
                setAccuarcyData([]);
            }
        }
    }, [location.state, currentEvent, accuarcyData]);

    useEffect(() => {
        let newMatches = [];
        if (matchForms && allMatches) {
            if (matchFormFilter.elem.key === 'missing') {
                outerloop: for (const allMatch of allMatches) {
                    let missingMatch = null;
                    for (const matchForm of matchForms) {
                        if (allMatch.matchNumber + allMatch.station === matchForm.matchNumber + matchForm.station) {
                            if (matchForm.standStatus !== matchFormStatus.missing && matchForm.superStatus !== matchFormStatus.missing) {
                                continue outerloop;
                            } else {
                                missingMatch = matchForm;
                                break;
                            }
                        }
                    }
                    if (missingMatch === null) {
                        missingMatch = allMatch;
                    }
                    if (
                        (matchFilter === '' || missingMatch.matchNumber.match(new RegExp(`^${matchFilter}`, 'gim'))) &&
                        (teamFilter === '' || missingMatch.teamNumber.toString().match(new RegExp(`^${teamFilter}`, 'gim')))
                    ) {
                        newMatches.push(missingMatch);
                    }
                }
                newMatches = sortMatches(newMatches);
            } else {
                for (const matchForm of matchForms) {
                    if (matchFormFilter.elem.key === 'followUp' && matchForm.standStatus !== matchFormStatus.followUp && matchForm.superStatus !== matchFormStatus.followUp) {
                        continue;
                    } else if (matchFormFilter.elem.key === 'noShow' && matchForm.standStatus !== matchFormStatus.noShow && matchForm.superStatus !== matchFormStatus.noShow) {
                        continue;
                    }
                    if (matchFormFilter.elem.key === 'scoutError' && getMatchAccuarcy(matchForm, accuarcyData) === null) {
                        continue;
                    }
                    if (
                        (matchFilter === '' || matchForm.matchNumber.match(new RegExp(`^${matchFilter}`, 'gim'))) &&
                        (teamFilter === '' || matchForm.teamNumber.toString().match(new RegExp(`^${teamFilter}`, 'gim'))) &&
                        (scouterFilter === '' || matchForm.standScouter?.match(new RegExp(`^${scouterFilter}`, 'gim')) || matchForm.superScouter?.match(new RegExp(`^${scouterFilter}`, 'gim')))
                    ) {
                        if (!currentEvent.custom) {
                            let allianceNumbers = allMatches.find((match) => match.matchNumber === matchForm.matchNumber && match.station === matchForm.station).allianceNumbers;
                            matchForm.allianceNumbers = allianceNumbers;
                        }
                        newMatches.push(matchForm);
                    }
                }
                newMatches = sortMatches(newMatches);
            }
            setFilteredMatches(newMatches);
        } else {
            setFilteredMatches(null);
        }
        setMatchListVersion((prevVersion) => prevVersion + 1);
    }, [matchForms, allMatches, matchFilter, matchFormFilter, scouterFilter, teamFilter, accuarcyData, currentEvent.custom]);

    function getAccuracy(currentEvent) {
        setLoadingAccuracy(true);
        fetch(`matchData/getEventAccuracy/${currentEvent.key}`)
            .then((response) => response.json())
            .then((data) => {
                setAccuarcyData(data);
                setLoadingAccuracy(false);
                setMatchListVersion((prevVersion) => prevVersion + 1);
            })
            .catch((error) => {
                setError(error);
                setLoadingAccuracy(false);
            });
    }

    function getMatchAccuarcy(match, accuarcyData) {
        if (!accuarcyData) {
            return null;
        }
        let matchData = accuarcyData.find((accuarcy) => accuarcy.matchKey === match.matchNumber);
        if (matchData) {
            let stationData;
            if (match.station.charAt(0) === 'r') {
                stationData = matchData.red?.errors[match.teamNumber];
            } else {
                stationData = matchData.blue?.errors[match.teamNumber];
            }
            if (stationData) {
                stationData = Object.keys(stationData).length === 0 ? null : stationData;
            }
            return stationData;
        } else {
            return null;
        }
    }

    function getIcon(filter) {
        switch (filter) {
            case 'none':
                return <AiFillFilter />;
            case 'followUp':
            case 'scoutError':
                return <WarningIcon />;
            case 'noShow':
                return <MdOutlineDoNotDisturbAlt />;
            case 'missing':
            default:
                return <QuestionIcon />;
        }
    }

    function getColor(filter) {
        switch (filter) {
            case 'none':
                return 'black';
            case 'followUp':
                return 'yellow';
            case 'scoutError':
                return 'orange';
            case 'noShow':
                return 'red';
            case 'missing':
            default:
                return 'purple';
        }
    }

    if (error) {
        return (
            <Box textAlign={'center'} fontSize={'25px'} fontWeight={'medium'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
                {error}
            </Box>
        );
    }

    if (loadingEvents || currentEvent.key === '' || accuarcyData === null || (eventsError && error !== false)) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Box margin={'0 auto'} width={{ base: '90%', md: '66%', lg: '66%' }}>
            {!currentEvent.custom && (
                <IconButton
                    position={'absolute'}
                    left={'10px'}
                    top={'95px'}
                    onClick={() => getAccuracy(currentEvent)}
                    icon={loadingAccuarcy ? <Spinner size={'sm'} /> : <FcInspection />}
                    colorScheme={'black'}
                    variant={'outline'}
                    _focus={{ outline: 'none' }}
                    fontSize={'20px'}
                    size='sm'
                />
            )}
            <IconButton
                position={'absolute'}
                right={'10px'}
                top={'95px'}
                onClick={() => setMatchFormFilter((prevFilter) => prevFilter.next)}
                icon={getIcon(matchFormFilter.elem.key)}
                colorScheme={getColor(matchFormFilter.elem.key)}
                variant={matchFormFilter.elem.key !== 'none' ? 'solid' : 'outline'}
                _focus={{ outline: 'none' }}
                size='sm'
            />
            <Center marginBottom={'25px'}>
                <Menu placement='bottom'>
                    <MenuButton maxW={'65vw'} onClick={() => setFocusedEvent('')} _focus={{ outline: 'none' }} as={Button} rightIcon={<ChevronDownIcon />}>
                        <Box overflow={'hidden'} textOverflow={'ellipsis'}>
                            {currentEvent.name}
                        </Box>
                    </MenuButton>
                    <MenuList>
                        {sortRegisteredEvents(events).map((eventItem) => (
                            <MenuItem
                                textAlign={'center'}
                                justifyContent={'center'}
                                _focus={{ backgroundColor: 'none' }}
                                onMouseEnter={() => setFocusedEvent(eventItem.name)}
                                backgroundColor={(currentEvent.name === eventItem.name && focusedEvent === '') || focusedEvent === eventItem.name ? 'gray.100' : 'none'}
                                maxW={'65vw'}
                                key={eventItem.key}
                                onClick={() => {
                                    if (eventItem.key !== currentEvent.key) {
                                        setCurrentEvent({ name: eventItem.name, key: eventItem.key, custom: eventItem.custom });
                                        setAccuarcyData([]);
                                    }
                                }}
                            >
                                {eventItem.name}
                            </MenuItem>
                        ))}
                    </MenuList>
                </Menu>
            </Center>
            {loadingMatchForms || allMatches === null || filteredMatches === null || (matchFormsError && error !== false) ? (
                <Center>
                    <Spinner></Spinner>
                </Center>
            ) : (
                <Box marginBottom={'25px'}>
                    <Grid
                        borderTop={'1px solid black'}
                        border={'1px solid black'}
                        borderBottom={'none'}
                        borderRadius={'10px 10px 0px 0px'}
                        backgroundColor={'gray.300'}
                        templateColumns='2fr 1fr 1fr 1fr'
                        gap={'5px'}
                    >
                        <GridItem padding={'10px 0px 10px 0px'} _focus={{ zIndex: 1 }} textAlign={'center'}>
                            <Input
                                value={matchFilter}
                                onChange={(event) => setMatchFilter(event.target.value)}
                                borderColor={'gray.600'}
                                placeholder='Match #'
                                _placeholder={{ color: 'black', opacity: '0.75' }}
                                _focus={{ outline: 'none', boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px', borderColor: 'black', width: 'max(80%, 100px)' }}
                                _hover={{ borderColor: 'black' }}
                                w={'80%'}
                                pos={'relative'}
                                top={'50%'}
                                transform={'translateY(-50%)'}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.target.blur();
                                    }
                                }}
                                enterKeyHint='done'
                            />
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} _focus={{ zIndex: 1 }} textAlign={'center'}>
                            <Input
                                value={teamFilter}
                                onChange={(event) => setTeamFilter(event.target.value)}
                                borderColor={'gray.600'}
                                placeholder='Team #'
                                margin={'0 auto'}
                                _placeholder={{ color: 'black', opacity: '0.75' }}
                                _focus={{ outline: 'none', boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px', borderColor: 'black', width: 'max(80%, 90px)', backgroundColor: 'gray.300', zIndex: 1 }}
                                _hover={{ borderColor: 'black' }}
                                w={'80%'}
                                pos={'relative'}
                                top={'50%'}
                                transform={'translateY(-50%)'}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.target.blur();
                                    }
                                }}
                                enterKeyHint='done'
                            />
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} _focus={{ zIndex: 1 }} textAlign={'center'}>
                            <Input
                                value={scouterFilter}
                                onChange={(event) => setScouterFilter(event.target.value)}
                                borderColor={'gray.600'}
                                placeholder='Scouter'
                                _placeholder={{ color: 'black', opacity: '0.75' }}
                                _focus={{ outline: 'none', boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px', borderColor: 'black', width: 'max(80%, 110px)', backgroundColor: 'gray.300', zIndex: 1 }}
                                _hover={{ borderColor: 'black' }}
                                w={'80%'}
                                pos={'relative'}
                                top={'50%'}
                                transform={'translateY(-50%)'}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.target.blur();
                                    }
                                }}
                                enterKeyHint='done'
                            />
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} _focus={{ zIndex: 1 }} textAlign={'center'}>
                            <Popover flip={true} placement='auto'>
                                <PopoverTrigger>
                                    <Text w='fit-content' margin={'0 auto'} cursor={'help'} pos={'relative'} fontSize={'20px'} top={'50%'} transform={'translateY(-50%)'}>
                                        ?
                                    </Text>
                                </PopoverTrigger>
                                <PopoverContent maxWidth={'50vw'} _focus={{ outline: 'none' }}>
                                    <PopoverArrow />
                                    <PopoverCloseButton />
                                    <PopoverHeader color='black' fontSize='md' fontWeight='bold'>
                                        Match Filter Rules
                                    </PopoverHeader>
                                    <PopoverBody>
                                        Quals = qm&lt;#&gt;
                                        <br />
                                        Quarters = qf&lt;#&gt;m&lt;#&gt;
                                        <br />
                                        Semis = sf&lt;#&gt;m&lt;#&gt;
                                        <br />
                                        Finals = f1m&lt;#&gt;
                                    </PopoverBody>
                                </PopoverContent>
                            </Popover>
                        </GridItem>
                    </Grid>
                    <MatchesMemo
                        noMatches={matchForms.length === 0}
                        matches={filteredMatches}
                        accuarcyData={accuarcyData}
                        currentEvent={currentEvent}
                        filter={matchFormFilter.elem}
                        hasSecondaryFilter={matchFilter !== '' || teamFilter !== '' || scouterFilter !== ''}
                        version={matchListVersion}
                    ></MatchesMemo>
                </Box>
            )}
        </Box>
    );
}

export default MatchesPage;

import { React, useEffect, useState } from 'react';
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
    Text
} from '@chakra-ui/react';
import { sortEvents, sortMatches, sortRegisteredEvents } from '../util/helperFunctions';
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
    const [events, setEvents] = useState(null);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [focusedEvent, setFocusedEvent] = useState(null);
    const [matchNameFilter, setMatchName] = useState('');
    const [teamFilter, setTeamFilter] = useState('');
    const [scouterFilter, setScouterFilter] = useState('');
    const [matchFormFilter, setMatchFormFilter] = useState(matchFormCLL.getHead());
    const [matchForms, setMatchForms] = useState(null);
    const [filteredMatchForms, setFilteredMatchForms] = useState(null);
    const [matchListVersion, setMatchListVersion] = useState(0);
    const [allMatches, setAllMatches] = useState(null);
    const [accuarcyData, setAccuarcyData] = useState(null);
    const [loadingAccuracy, setLoadingAccuracy] = useState(false);

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
                            matches.push({
                                matchNumber: match.key.split('_')[1],
                                teamNumber: team.substring(3),
                                station: `b${index + 1}`,
                                allianceNumbers: allianceNumbers,
                                _id: uuidv4()
                            });
                            index += 1;
                        }
                        index = 0;
                        for (let team of match.alliances.red.team_keys) {
                            let allianceNumbers = match.alliances.red.team_keys.map((teamKey) => teamKey.substring(3));
                            matches.push({
                                matchNumber: match.key.split('_')[1],
                                teamNumber: team.substring(3),
                                station: `r${index + 1}`,
                                allianceNumbers: allianceNumbers,
                                _id: uuidv4()
                            });
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

    useEffect(() => {
        setMatchForms(null);
        setAllMatches(null);
        if (currentEvent !== null) {
            fetch('/matchForm/getMatchFormsSimple', {
                headers: { filters: JSON.stringify({ eventKey: currentEvent.key }) }
            })
                .then((response) => {
                    if (response.status === 200) {
                        return response.json();
                    } else {
                        throw new Error(response.statusText);
                    }
                })
                .then((data) => {
                    setMatchForms(data);
                })
                .catch((error) => setError(error.message));

            if (currentEvent.custom) {
                setAllMatches([]);
            } else {
                fetchAllMatches(currentEvent.key);
            }
        }
    }, [currentEvent]);

    useEffect(() => {
        if (accuarcyData === null && currentEvent !== null) {
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
                            if (
                                matchForm.standStatus !== matchFormStatus.missing &&
                                matchForm.superStatus !== matchFormStatus.missing
                            ) {
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
                        (matchNameFilter === '' ||
                            missingMatch.matchNumber.match(new RegExp(`^${matchNameFilter}`, 'gim'))) &&
                        (teamFilter === '' ||
                            missingMatch.teamNumber.toString().match(new RegExp(`^${teamFilter}`, 'gim')))
                    ) {
                        newMatches.push(missingMatch);
                    }
                }
                newMatches = sortMatches(newMatches);
            } else {
                for (const matchForm of matchForms) {
                    if (
                        matchFormFilter.elem.key === 'followUp' &&
                        matchForm.standStatus !== matchFormStatus.followUp &&
                        matchForm.superStatus !== matchFormStatus.followUp
                    ) {
                        continue;
                    } else if (
                        matchFormFilter.elem.key === 'noShow' &&
                        matchForm.standStatus !== matchFormStatus.noShow &&
                        matchForm.superStatus !== matchFormStatus.noShow
                    ) {
                        continue;
                    }
                    if (
                        matchFormFilter.elem.key === 'scoutError' &&
                        getMatchAccuarcy(matchForm, accuarcyData) === null
                    ) {
                        continue;
                    }
                    if (
                        (matchNameFilter === '' ||
                            matchForm.matchNumber.match(new RegExp(`^${matchNameFilter}`, 'gim'))) &&
                        (teamFilter === '' ||
                            matchForm.teamNumber.toString().match(new RegExp(`^${teamFilter}`, 'gim'))) &&
                        (scouterFilter === '' ||
                            matchForm.standScouter?.match(new RegExp(`^${scouterFilter}`, 'gim')) ||
                            matchForm.superScouter?.match(new RegExp(`^${scouterFilter}`, 'gim')))
                    ) {
                        if (!currentEvent.custom) {
                            let allianceNumbers = allMatches.find(
                                (match) =>
                                    match.matchNumber === matchForm.matchNumber && match.station === matchForm.station
                            ).allianceNumbers;
                            matchForm.allianceNumbers = allianceNumbers;
                        }
                        newMatches.push(matchForm);
                    }
                }
                newMatches = sortMatches(newMatches);
            }
            setFilteredMatchForms(newMatches);
        } else {
            setFilteredMatchForms(null);
        }
        setMatchListVersion((prevVersion) => prevVersion + 1);
    }, [
        matchForms,
        allMatches,
        matchNameFilter,
        matchFormFilter,
        scouterFilter,
        teamFilter,
        accuarcyData,
        currentEvent
    ]);

    function getAccuracy(currentEvent) {
        // setLoadingAccuracy(true);
        // fetch(`matchData/getEventAccuracy/${currentEvent.key}`)
        //     .then((response) => response.json())
        //     .then((data) => {
        //         setAccuarcyData(data);
        //         setLoadingAccuracy(false);
        //         setMatchListVersion((prevVersion) => prevVersion + 1);
        //     })
        //     .catch((error) => {
        //         setError(error);
        //         setLoadingAccuracy(false);
        //     });
    }

    function getMatchAccuarcy(match, accuarcyData) {
        return null;
        // if (!accuarcyData) {
        //     return null;
        // }
        // let matchData = accuarcyData.find((accuarcy) => accuarcy.matchKey === match.matchNumber);
        // if (matchData) {
        //     let stationData;
        //     if (match.station.charAt(0) === 'r') {
        //         stationData = matchData.red?.errors[match.teamNumber];
        //     } else {
        //         stationData = matchData.blue?.errors[match.teamNumber];
        //     }
        //     if (stationData) {
        //         stationData = Object.keys(stationData).length === 0 ? null : stationData;
        //     }
        //     return stationData;
        // } else {
        //     return null;
        // }
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

    if (currentEvent === null || accuarcyData === null) {
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
                    icon={<FcInspection />}
                    colorScheme={'black'}
                    variant={'outline'}
                    fontSize={'20px'}
                    size='sm'
                    isLoading={loadingAccuracy}
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
                size='sm'
            />
            <Center marginBottom={'25px'}>
                <Menu placement='bottom'>
                    <MenuButton
                        maxW={'65vw'}
                        onClick={() => setFocusedEvent('')}
                        as={Button}
                        rightIcon={<ChevronDownIcon />}
                    >
                        <Box overflow={'hidden'} textOverflow={'ellipsis'}>
                            {currentEvent.name}
                        </Box>
                    </MenuButton>
                    <MenuList>
                        {sortRegisteredEvents(events).map((eventItem) => (
                            <MenuItem
                                textAlign={'center'}
                                justifyContent={'center'}
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
                                    if (eventItem.key !== currentEvent.key) {
                                        setCurrentEvent({
                                            name: eventItem.name,
                                            key: eventItem.key,
                                            custom: eventItem.custom
                                        });
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
            {matchForms === null || allMatches === null || filteredMatchForms === null ? (
                <Center>
                    <Spinner></Spinner>
                </Center>
            ) : (
                <Box marginBottom={'25px'}>
                    <Grid
                        border={'1px solid black'}
                        borderBottom={'none'}
                        borderRadius={'10px 10px 0px 0px'}
                        backgroundColor={'gray.300'}
                        templateColumns='2fr 1fr 1fr 1fr'
                    >
                        <GridItem
                            fontSize={'lg'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            display={'flex'}
                            justifyContent={'center'}
                            alignItems={'center'}
                            padding={'10px 0px'}
                        >
                            <Input
                                value={matchNameFilter}
                                onChange={(event) => setMatchName(event.target.value)}
                                borderColor={'gray.600'}
                                placeholder='Match #'
                                _placeholder={{ color: 'black', opacity: '0.75' }}
                                _focus={{
                                    outline: 'none',
                                    boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                                    borderColor: 'black',
                                    width: 'max(80%, 100px)'
                                }}
                                _hover={{ borderColor: 'black' }}
                                width={'80%'}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.target.blur();
                                    }
                                }}
                                enterKeyHint='done'
                            />
                        </GridItem>
                        <GridItem
                            fontSize={'lg'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            display={'flex'}
                            justifyContent={'center'}
                            alignItems={'center'}
                        >
                            <Input
                                value={teamFilter}
                                onChange={(event) => setTeamFilter(event.target.value)}
                                borderColor={'gray.600'}
                                placeholder='Team #'
                                _placeholder={{ color: 'black', opacity: '0.75' }}
                                _focus={{
                                    outline: 'none',
                                    boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                                    borderColor: 'black',
                                    width: 'max(80%, 90px)',
                                    backgroundColor: 'gray.300',
                                    zIndex: 1
                                }}
                                _hover={{ borderColor: 'black' }}
                                width={'80%'}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.target.blur();
                                    }
                                }}
                                enterKeyHint='done'
                            />
                        </GridItem>
                        <GridItem
                            fontSize={'lg'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            display={'flex'}
                            justifyContent={'center'}
                            alignItems={'center'}
                        >
                            <Input
                                value={scouterFilter}
                                onChange={(event) => setScouterFilter(event.target.value)}
                                borderColor={'gray.600'}
                                placeholder='Scouter'
                                _placeholder={{ color: 'black', opacity: '0.75' }}
                                _focus={{
                                    outline: 'none',
                                    boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px',
                                    borderColor: 'black',
                                    width: 'max(80%, 110px)',
                                    backgroundColor: 'gray.300',
                                    zIndex: 1
                                }}
                                _hover={{ borderColor: 'black' }}
                                width={'80%'}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.target.blur();
                                    }
                                }}
                                enterKeyHint='done'
                            />
                        </GridItem>
                        <GridItem
                            fontSize={'lg'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            display={'flex'}
                            justifyContent={'center'}
                            alignItems={'center'}
                        >
                            <Popover flip={true} placement='auto'>
                                <PopoverTrigger>
                                    <Text w='fit-content' cursor={'help'} fontSize={'20px'}>
                                        ?
                                    </Text>
                                </PopoverTrigger>
                                <PopoverContent maxWidth={'50vw'}>
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
                        matches={filteredMatchForms}
                        accuarcyData={accuarcyData}
                        currentEvent={currentEvent}
                        filter={matchFormFilter.elem}
                        hasSecondaryFilter={matchNameFilter !== '' || teamFilter !== '' || scouterFilter !== ''}
                        version={matchListVersion}
                    ></MatchesMemo>
                </Box>
            )}
        </Box>
    );
}

export default MatchesPage;

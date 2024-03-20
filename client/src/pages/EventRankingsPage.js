import React, { useEffect, useState } from 'react';
import { leafGet, roundToTenth, sortEvents } from '../util/helperFunctions';
import {
    Box,
    Button,
    Center,
    Flex,
    Grid,
    GridItem,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Spinner,
    Text
} from '@chakra-ui/react';
import { ChevronDownIcon, TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';

let fields = [
    { label: 'Team #', sortField: 'teamNumber' },
    { label: 'Offensive Pts', sortField: 'offensivePoints.avg' },
    { label: 'Auto Pts', sortField: 'autoPoints.avg' },
    { label: 'Teleop Pts', sortField: 'teleopPoints.avg' },
    { label: 'Stage Pts', sortField: 'stagePoints.avg' },
    { label: 'Amp Tele GP', sortField: 'teleopGP.ampScore.avg' },
    { label: 'Spkr. Tele GP', sortField: 'teleopGP.speakerScore.avg' },
    { label: 'Defense', sortField: 'defenseRating.avg' }
];

function EventRankingsPage() {
    const [events, setEvents] = useState(null);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [focusedEvent, setFocusedEvent] = useState(null);
    const [multiTeamEventData, setMultiTeamEventData] = useState(null);
    const [sorting, setSorting] = useState({ field: 'offensivePoints.avg', descending: true });
    const [error, setError] = useState(null);

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

    useEffect(() => {
        setMultiTeamEventData(null);
        if (currentEvent !== null) {
            fetch('/ted/getTEDs', {
                headers: {
                    filters: JSON.stringify({ eventKey: currentEvent.key })
                }
            })
                .then((response) => {
                    if (response.status === 200) {
                        return response.json();
                    } else {
                        throw new Error(response.statusText);
                    }
                })
                .then((data) => {
                    setMultiTeamEventData(data);
                })
                .catch((error) => setError(error.message));
        }
    }, [currentEvent]);

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

    if (events === null || multiTeamEventData === null) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Box>
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
                                    if (eventItem.key !== currentEvent.key) {
                                        setCurrentEvent({
                                            name: eventItem.name,
                                            key: eventItem.key
                                        });
                                    }
                                }}
                            >
                                {eventItem.name}
                            </MenuItem>
                        ))}
                    </MenuList>
                </Menu>
            </Center>
            {multiTeamEventData.length === 0 ? (
                <Text fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'}>
                    No event data
                </Text>
            ) : (
                <Box width={{ base: '100%', lg: '100%' }} overflowX={'auto'} margin={'0 auto'} marginBottom={'25px'}>
                    <Grid
                        templateColumns={`0.5fr 0.8fr repeat(${fields.length - 2}, 0.8fr)`}
                        borderTop={'1px solid black'}
                        minWidth={'1400px'}
                    >
                        {fields.map((element) => (
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
                                    backgroundColor={'gray.300'}
                                    padding={'0px 0px'}
                                    position={element.label === 'Team #' && 'sticky'}
                                    left={element.label === 'Team #' && 0}
                                    zIndex={element.label === 'Team #' && 1}
                                    borderLeft={element.label === 'Team #' && '1px solid black'}
                                >
                                    <Flex
                                        height={'40px'}
                                        width={'100%'}
                                        justifyContent={'center'}
                                        alignItems={'center'}
                                        columnGap={'10px'}
                                        cursor={'pointer'}
                                        onClick={() => {
                                            if (sorting.field === element.sortField) {
                                                setSorting({ ...sorting, descending: !sorting.descending });
                                            } else {
                                                setSorting({ field: element.sortField, descending: true });
                                            }
                                        }}
                                        userSelect={'none'}
                                    >
                                        <Text>{element.label}</Text>
                                        <Flex justifyContent={'center'} alignItems={'center'}>
                                            <TriangleUpIcon
                                                boxSize={4}
                                                color={
                                                    sorting.field === element.sortField && !sorting.descending
                                                        ? 'black'
                                                        : 'gray.400'
                                                }
                                            />
                                            <TriangleDownIcon
                                                boxSize={4}
                                                color={
                                                    sorting.field === element.sortField && sorting.descending
                                                        ? 'black'
                                                        : 'gray.400'
                                                }
                                            />
                                        </Flex>
                                    </Flex>
                                </GridItem>
                            </React.Fragment>
                        ))}
                        {multiTeamEventData
                            .sort((a, b) => {
                                if (sorting.descending) {
                                    return leafGet(b, sorting.field) - leafGet(a, sorting.field);
                                } else {
                                    return leafGet(a, sorting.field) - leafGet(b, sorting.field);
                                }
                            })
                            .map((teamData, index) => (
                                <React.Fragment key={teamData.teamNumber}>
                                    {fields.map((element) => (
                                        <GridItem
                                            key={element.label}
                                            fontSize={'lg'}
                                            fontWeight={'semibold'}
                                            textAlign={'center'}
                                            display={'flex'}
                                            flexDirection={'column'}
                                            justifyContent={'center'}
                                            alignItems={'center'}
                                            borderBottom={'1px solid black'}
                                            borderRight={'1px solid black'}
                                            backgroundColor={index % 2 === 0 ? 'gray.100' : 'white'}
                                            padding={'5px 0px'}
                                            position={element.label === 'Team #' && 'sticky'}
                                            left={element.label === 'Team #' && 0}
                                            zIndex={element.label === 'Team #' && 1}
                                            borderLeft={element.label === 'Team #' && '1px solid black'}
                                            as={element.label === 'Team #' && Link}
                                            to={
                                                element.label === 'Team #'
                                                    ? `/team/${teamData.teamNumber}/overview`
                                                    : null
                                            }
                                            _hover={
                                                element.label === 'Team #' && {
                                                    backgroundColor: index % 2 === 0 ? 'gray.200' : 'gray.100'
                                                }
                                            }
                                            _focus={
                                                element.label === 'Team #' && {
                                                    backgroundColor: index % 2 === 0 ? 'gray.300' : 'gray.200'
                                                }
                                            }
                                        >
                                            {roundToTenth(leafGet(teamData, element.sortField))}
                                        </GridItem>
                                    ))}
                                </React.Fragment>
                            ))}
                    </Grid>
                </Box>
            )}
        </Box>
    );
}

export default EventRankingsPage;

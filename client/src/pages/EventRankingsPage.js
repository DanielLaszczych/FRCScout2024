import React, { useEffect, useState } from 'react';
import { arraysEqual, leafGet, roundToTenth, sortEvents } from '../util/helperFunctions';
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
    { label: 'Team #', sortFields: ['teamNumber'] },
    { label: 'Offensive Pts', sortFields: ['offensivePoints.avg'] },
    { label: 'Auto Pts', sortFields: ['autoPoints.avg'] },
    { label: 'Teleop Pts', sortFields: ['teleopPoints.avg'] },
    { label: 'Stage Pts', sortFields: ['stagePoints.avg'] },
    { label: 'Auto GP', sortFields: ['autoGP.ampScore.avg', 'autoGP.speakerScore.avg'] },
    {
        label: 'Tele GP',
        sortFields: [
            'teleopGP.ampScore.avg',
            'teleopGP.speakerScore.avg',
            'teleopGP.ferry.avg',
            'teleopGP.centerFerry.avg'
        ],
        tooltip: '*Includes ferrying'
    },
    { label: 'Amp Tele GP', sortFields: ['teleopGP.ampScore.avg'] },
    { label: 'Spkr. Tele GP', sortFields: ['teleopGP.speakerScore.avg'] },
    { label: 'Defense', sortFields: ['defenseRating.avg'] }
];

function EventRankingsPage() {
    const [events, setEvents] = useState(null);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [focusedEvent, setFocusedEvent] = useState(null);
    const [multiTeamEventData, setMultiTeamEventData] = useState(null);
    const [sorting, setSorting] = useState({ fields: ['offensivePoints.avg'], descending: true });
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

    function getValue(teamData, sortFields) {
        let total = 0;
        for (const field of sortFields) {
            total += leafGet(teamData, field);
        }
        return total;
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

    if (events === null) {
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
            {multiTeamEventData === null ? (
                <Center>
                    <Spinner></Spinner>
                </Center>
            ) : multiTeamEventData.length === 0 ? (
                <Text fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'}>
                    No event data
                </Text>
            ) : (
                <Box width={{ base: '100%', lg: '100%' }} overflowX={'auto'} margin={'0 auto'} marginBottom={'25px'}>
                    <Grid
                        templateColumns={`0.6fr repeat(${fields.length - 1}, 0.8fr)`}
                        borderTop={'1px solid black'}
                        minWidth={'1600px'}
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
                                    cursor={'pointer'}
                                    userSelect={'none'}
                                    onClick={() => {
                                        if (arraysEqual(sorting.fields, element.sortFields)) {
                                            setSorting({ ...sorting, descending: !sorting.descending });
                                        } else {
                                            setSorting({ fields: element.sortFields, descending: true });
                                        }
                                    }}
                                >
                                    <Flex
                                        height={'40px'}
                                        width={'100%'}
                                        justifyContent={'center'}
                                        alignItems={'center'}
                                        columnGap={'10px'}
                                    >
                                        <Text>{element.label}</Text>
                                        <Flex justifyContent={'center'} alignItems={'center'}>
                                            <TriangleUpIcon
                                                boxSize={4}
                                                color={
                                                    arraysEqual(sorting.fields, element.sortFields) &&
                                                    !sorting.descending
                                                        ? 'black'
                                                        : 'gray.400'
                                                }
                                            />
                                            <TriangleDownIcon
                                                boxSize={4}
                                                color={
                                                    arraysEqual(sorting.fields, element.sortFields) &&
                                                    sorting.descending
                                                        ? 'black'
                                                        : 'gray.400'
                                                }
                                            />
                                        </Flex>
                                    </Flex>
                                    {element.tooltip && <Text fontSize={'xs'}>{element.tooltip}</Text>}
                                </GridItem>
                            </React.Fragment>
                        ))}
                        {multiTeamEventData
                            .sort((a, b) => {
                                let totalA = 0;
                                let totalB = 0;
                                for (const field of sorting.fields) {
                                    totalA += leafGet(a, field);
                                    totalB += leafGet(b, field);
                                }
                                if (sorting.descending) {
                                    return totalB - totalA;
                                } else {
                                    return totalA - totalB;
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
                                            {roundToTenth(getValue(teamData, element.sortFields))}
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

import { React, useCallback, useEffect, useState } from 'react';
import {
    Button,
    Center,
    Box,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Spinner,
    IconButton,
    Grid,
    GridItem
} from '@chakra-ui/react';
import { ChevronDownIcon, WarningIcon } from '@chakra-ui/icons';
import { sortEvents } from '../util/helperFunctions';
import PitsMemo from '../components/PitsMemo';
import { AiFillFilter } from 'react-icons/ai';

function PitPage() {
    const [error, setError] = useState(null);
    const [events, setEvents] = useState(null);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [focusedEvent, setFocusedEvent] = useState(null);
    const [currentEventData, setCurrentEventData] = useState(null);
    const [followUpFilter, setFollowUpFilter] = useState(false);
    const [pitForms, setPitForms] = useState(null);
    const [filteredPitForms, setFilteredPitForms] = useState(null);
    const [pitListVersion, setPitListVersion] = useState(0);

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
        setCurrentEventData(null);
        setPitForms(null);
        setFilteredPitForms(null);
        if (currentEvent !== null) {
            fetch('/event/getEvent', { headers: { filters: JSON.stringify({ key: currentEvent.key }) } })
                .then((response) => {
                    if (response.status === 200) {
                        return response.json();
                    } else {
                        throw new Error(response.statusText);
                    }
                })
                .then((data) => {
                    setCurrentEventData(data);
                })
                .catch((error) => setError(error.message));

            fetch('/pitForm/getPitFormsSimple', {
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
                    setPitForms(data);
                })
                .catch((error) => setError(error.message));
        }
    }, [currentEvent]);

    const getPitFormStatusColor = useCallback(
        (teamNumber) => {
            let pitForm = null;
            for (const pitFormData of pitForms) {
                if (pitFormData.teamNumber === teamNumber) {
                    pitForm = pitFormData;
                    break;
                }
            }
            if (pitForm === null) {
                return 'gray';
            } else if (pitForm.followUp) {
                return 'yellow';
            } else {
                return 'green';
            }
        },
        [pitForms]
    );

    useEffect(() => {
        let newPitForms = [];
        if (pitForms && currentEventData) {
            newPitForms = (
                followUpFilter
                    ? [...currentEventData.teams].filter((team) => getPitFormStatusColor(team.number) !== 'green')
                    : [...currentEventData.teams]
            ).sort((a, b) => a.number - b.number);
            setFilteredPitForms(newPitForms);
        } else {
            setFilteredPitForms(null);
        }
        setPitListVersion((prevVersion) => prevVersion + 1);
    }, [pitForms, followUpFilter, currentEventData, getPitFormStatusColor]);

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

    if (currentEvent === null) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Box margin={'0 auto'} width={{ base: '90%', md: '66%', lg: '66%' }}>
            <IconButton
                position={'absolute'}
                right={'10px'}
                top={'95px'}
                onClick={() => setFollowUpFilter(!followUpFilter)}
                icon={followUpFilter ? <WarningIcon /> : <AiFillFilter />}
                colorScheme={followUpFilter ? 'yellow' : 'black'}
                variant={followUpFilter ? 'solid' : 'outline'}
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
                                        setCurrentEvent({ name: eventItem.name, key: eventItem.key });
                                    }
                                }}
                            >
                                {eventItem.name}
                            </MenuItem>
                        ))}
                    </MenuList>
                </Menu>
            </Center>
            {pitForms === null || filteredPitForms === null ? (
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
                        templateColumns='1fr 1.5fr 1fr 1fr'
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
                            Team #
                        </GridItem>
                        <GridItem
                            fontSize={'lg'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            display={'flex'}
                            justifyContent={'center'}
                            alignItems={'center'}
                        >
                            Name
                        </GridItem>
                        <GridItem
                            fontSize={'lg'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            display={'flex'}
                            justifyContent={'center'}
                            alignItems={'center'}
                        >
                            Scouter
                        </GridItem>
                        <GridItem
                            fontSize={'lg'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            display={'flex'}
                            justifyContent={'center'}
                            alignItems={'center'}
                        >
                            Status
                        </GridItem>
                    </Grid>
                    <PitsMemo
                        eventData={filteredPitForms}
                        pitForms={pitForms}
                        version={pitListVersion}
                        currentEvent={currentEvent}
                    ></PitsMemo>
                </Box>
            )}
        </Box>
    );
}

export default PitPage;

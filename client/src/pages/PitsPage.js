import { React, useCallback, useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { Button, Center, Box, Menu, MenuButton, MenuList, MenuItem, Spinner, IconButton, Grid, GridItem, Text } from '@chakra-ui/react';
import { GET_EVENT, GET_EVENTS_KEYS_NAMES, GET_PITFORMS_BY_EVENT } from '../graphql/queries';
import { ChevronDownIcon, WarningIcon } from '@chakra-ui/icons';
import { sortRegisteredEvents } from '../util/helperFunctions';
import PitsMemo from '../components/PitsMemo';
import { AiFillFilter } from 'react-icons/ai';

function PitPage() {
    const [error, setError] = useState(null);
    const [currentEvent, setCurrentEvent] = useState({ name: '', key: '' });
    const [focusedEvent, setFocusedEvent] = useState('');
    const [followUpFilter, setFollowUpFilter] = useState(false);
    const [filteredPitList, setFilteredPitList] = useState(null);
    const [pitListVersion, setPitListVersion] = useState(0);

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
                    setCurrentEvent({ name: sortedEvents[sortedEvents.length - 1].name, key: sortedEvents[sortedEvents.length - 1].key });
                    setFocusedEvent(sortedEvents[sortedEvents.length - 1].name);
                } else {
                    setCurrentEvent({ name: currentEvent.name, key: currentEvent.key });
                    setFocusedEvent(currentEvent.name);
                }
            } else {
                setError('No events registered in the database');
            }
        },
    });

    const {
        loading: loadingPitForms,
        error: pitFormsError,
        data: { getPitForms: pitForms } = {},
    } = useQuery(GET_PITFORMS_BY_EVENT, {
        skip: currentEvent.key === '',
        fetchPolicy: 'network-only',
        variables: {
            eventKey: currentEvent.key,
        },
        onError(err) {
            console.log(JSON.stringify(err, null, 2));
            setError('Apollo error, could not retrieve pit forms');
        },
    });

    const {
        loading: loadingEvent,
        error: eventError,
        data: { getEvent: event } = {},
    } = useQuery(GET_EVENT, {
        skip: currentEvent.key === '',
        fetchPolicy: 'network-only',
        variables: {
            key: currentEvent.key,
        },
        onError(err) {
            console.log(JSON.stringify(err, null, 2));
            setError('Apollo error, could not retrieve data on current event');
        },
    });

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
        let newPitList = [];
        if (!loadingEvent && !loadingPitForms && event && pitForms) {
            newPitList = (followUpFilter ? event.teams.filter((team) => getPitFormStatusColor(team.number) !== 'green') : event.teams).sort((a, b) => a.number - b.number);
            setFilteredPitList(newPitList);
        } else {
            setFilteredPitList(null);
        }
        setPitListVersion((prevVersion) => prevVersion + 1);
    }, [event, pitForms, followUpFilter, getPitFormStatusColor, loadingEvent, loadingPitForms]);

    if (error) {
        return (
            <Box textAlign={'center'} fontSize={'25px'} fontWeight={'medium'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
                {error}
            </Box>
        );
    }

    if (loadingEvents || currentEvent.key === '' || (eventsError && error !== false)) {
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
                                onClick={() => setCurrentEvent({ name: eventItem.name, key: eventItem.key })}
                            >
                                {eventItem.name}
                            </MenuItem>
                        ))}
                    </MenuList>
                </Menu>
            </Center>
            {loadingPitForms || loadingEvent || filteredPitList === null || ((pitFormsError || eventError) && error !== false) ? (
                <Center>
                    <Spinner></Spinner>
                </Center>
            ) : (
                <Box marginBottom={'25px'}>
                    <Grid border={'1px solid black'} borderBottom={'none'} borderRadius={'10px 10px 0px 0px'} backgroundColor={'gray.300'} templateColumns='1fr 2fr 1fr 1fr' gap={'5px'}>
                        <GridItem padding={'10px 0px 10px 0px'} _focus={{ zIndex: 1 }} textAlign={'center'}>
                            <Text w='fit-content' margin={'0 auto'} pos={'relative'} fontWeight={'500'} fontSize={'18px'} top={'50%'} transform={'translateY(-50%)'}>
                                Team #
                            </Text>
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} _focus={{ zIndex: 1 }} textAlign={'center'}>
                            <Text w='fit-content' margin={'0 auto'} pos={'relative'} fontSize={'18px'} fontWeight={'500'} top={'50%'} transform={'translateY(-50%)'}>
                                Team Name
                            </Text>
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} _focus={{ zIndex: 1 }} textAlign={'center'}>
                            <Text w='fit-content' margin={'0 auto'} pos={'relative'} fontSize={'18px'} fontWeight={'500'} top={'50%'} transform={'translateY(-50%)'}>
                                Scouter
                            </Text>
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} _focus={{ zIndex: 1 }} textAlign={'center'}>
                            <Text w='fit-content' margin={'0 auto'} pos={'relative'} fontSize={'18px'} fontWeight={'500'} top={'50%'} transform={'translateY(-50%)'}>
                                Status
                            </Text>
                        </GridItem>
                    </Grid>
                    <PitsMemo eventData={filteredPitList} pitForms={pitForms} version={pitListVersion} currentEvent={currentEvent}></PitsMemo>
                </Box>
            )}
        </Box>
    );
}

export default PitPage;

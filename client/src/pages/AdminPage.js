import { createRef, React, useEffect, useRef, useState } from 'react';
import {
    Button,
    Center,
    Box,
    Grid,
    Text,
    Flex,
    Circle,
    Spinner,
    IconButton,
    VStack,
    Modal,
    useDisclosure,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useToast,
    Input,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    HStack,
    Icon,
    Tag,
    NumberInput,
    NumberInputField,
    GridItem
} from '@chakra-ui/react';
import { TransitionGroup } from 'react-transition-group';
import CSSTransition from '../components/CSSTransition';
import { ArrowUpIcon, ChevronDownIcon, EditIcon, SmallAddIcon } from '@chakra-ui/icons';
import { year } from '../util/helperConstants';
import '../stylesheets/adminstyle.css';
import { sortEvents, sortRegisteredEvents } from '../util/helperFunctions';
import TBAEventsMemo from '../components/TBAEventsMemo';
import { v4 as uuidv4 } from 'uuid';

const eventTypesArr = [
    { name: 'Week 1', key: uuidv4() },
    { name: 'Week 2', key: uuidv4() },
    { name: 'Week 3', key: uuidv4() },
    { name: 'Week 4', key: uuidv4() },
    { name: 'Week 5', key: uuidv4() },
    { name: 'Week 6', key: uuidv4() },
    { name: 'Championship', key: uuidv4() },
    { name: 'Preseason', key: uuidv4() },
    { name: 'Offseason', key: uuidv4() }
];

function AdminPage() {
    const linkRef = useRef();
    const toast = useToast();
    const { isOpen: isOpenSetEvent, onOpen: onOpenSetEvent, onClose: onCloseSetEvent } = useDisclosure();
    const { isOpen: isOpenCustomEvent, onOpen: onOpenCustomEvent, onClose: onCloseCustomEvent } = useDisclosure();

    const [customEventData, setCustomEventData] = useState({
        key: '',
        name: '',
        eventType: '',
        focusedEventType: '',
        startDate: '',
        endDate: '',
        teams: [],
        inputTeam: ''
    });
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState(null);
    const [version, setVersion] = useState(0);
    const [currentEvent, setCurrentEvent] = useState({ name: '', key: '' });
    const [focusedEvent, setFocusedEvent] = useState({ name: '', key: '' });
    const [changingCurrentEvent, setChangingCurrentEvent] = useState(false);
    const [setupDone, setSetUpDone] = useState(false);
    const [position, setPosition] = useState(0);
    const [eventTypes, setEventTypes] = useState([
        { name: 'Week 1', events: [], count: 0, ref: createRef(), id: uuidv4() },
        { name: 'Week 2', events: [], count: 0, ref: createRef(), id: uuidv4() },
        { name: 'Week 3', events: [], count: 0, ref: createRef(), id: uuidv4() },
        { name: 'Week 4', events: [], count: 0, ref: createRef(), id: uuidv4() },
        { name: 'Week 5', events: [], count: 0, ref: createRef(), id: uuidv4() },
        { name: 'Week 6', events: [], count: 0, ref: createRef(), id: uuidv4() },
        { name: 'Week 7', events: [], count: 0, ref: createRef(), id: uuidv4() },
        { name: 'Championship', events: [], count: 0, ref: createRef(), id: uuidv4() },
        { name: 'Preseason', events: [], count: 0, ref: createRef(), id: uuidv4() },
        { name: 'Offseason', events: [], count: 0, ref: createRef(), id: uuidv4() }
    ]);
    const [events, setEvents] = useState(null);
    const [mutatingEventKey, setMutatingEventKey] = useState(null);

    const listenToScroll = () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        // const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = winScroll;
        setPosition(scrolled);
    };

    function findPos(obj, curTop) {
        if (!obj) {
            return null;
        }
        let curtop = curTop;
        if (obj.offsetParent) {
            do {
                curtop += obj.offsetTop;
            } while ((obj = obj.offsetParent));
            return curtop;
        }
    }

    function handleScrollAction(ref) {
        let targetEle = ref.current;
        let curTop = window.innerWidth <= 285 ? -175 : -100;
        window.scrollTo({ top: findPos(targetEle, curTop), behavior: 'smooth' });
    }

    useEffect(() => {
        window.addEventListener('scroll', listenToScroll);

        return () => window.removeEventListener('scroll', listenToScroll);
    }, []);

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
                setEvents(sortRegisteredEvents(events));
                let currentEvent = events.find((event) => event.currentEvent);
                if (currentEvent === undefined) {
                    setCurrentEvent({ name: 'None', key: 'None' });
                    setFocusedEvent({ name: 'None', key: 'None' });
                } else {
                    setCurrentEvent({ name: currentEvent.name, key: currentEvent.key });
                    setFocusedEvent({ name: currentEvent.name, key: currentEvent.key });
                }
                fetch(`/blueAlliance/getEventsCustom/${year}`)
                    .then((response) => response.json())
                    .then((data) => {
                        if (!data.Error) {
                            let filteredData = data.filter((event) => !events.some((e) => e.name === event.name));
                            setEventTypes((prevEventTypes) =>
                                prevEventTypes.map((eventType) => {
                                    let events = filterEvents(eventType.name, filteredData);
                                    return { ...eventType, events: events, count: events.length };
                                })
                            );
                            setVersion((prevVersion) => prevVersion + 1);
                            setSetUpDone(true);
                        } else {
                            setError(data.Error);
                        }
                    })
                    .catch((error) => setError(error.message));
            })
            .catch((error) => setError(error.message));
    }, []);

    function filterEvents(eventTypeName, events) {
        let filteredEvents = [];
        if (eventTypeName.substring(0, 4) === 'Week') {
            let week = parseInt(eventTypeName.substring(5));
            filteredEvents = events.filter((event) => (event.week !== null ? event.week + 1 === week : false));
        } else if (eventTypeName === 'Championship') {
            filteredEvents = events.filter(
                (event) =>
                    event.event_type_string === 'Championship Division' ||
                    event.event_type_string === 'Championship Finals'
            );
        } else if (eventTypeName === 'Preseason') {
            filteredEvents = events.filter((event) => event.event_type_string === 'Preseason');
        } else {
            filteredEvents = events.filter((event) => event.event_type_string === 'Offseason');
        }
        return sortEvents(filteredEvents);
    }

    function addEvent(event) {
        fetch('event/addEvent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
        })
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    throw new Error(response.statusText);
                }
            })
            .then((data) => {
                let createdEvent = data;
                toast({
                    title: 'Event was Added',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                setEventTypes((prevEventTypes) =>
                    prevEventTypes.map((eventType) => {
                        if (createdEvent.eventType === eventType.name) {
                            let filteredEvents = eventType.events.filter((event) => event.name !== createdEvent.name);
                            return { ...eventType, events: filteredEvents, count: filteredEvents.length };
                        } else {
                            return eventType;
                        }
                    })
                );
                setVersion((prevVersion) => prevVersion + 1);
                setTimeout(() => {
                    setMutatingEventKey(null);
                    setEvents((prevEvents) => sortRegisteredEvents([...prevEvents, createdEvent]));
                }, 300);
                onCloseCustomEvent();
                setCustomEventData({
                    key: '',
                    name: '',
                    eventType: '',
                    focusedEventType: '',
                    startDate: '',
                    endDate: '',
                    teams: [],
                    inputTeam: ''
                });
                setSubmitAttempted(false);
                setSubmitting(false);
            })
            .catch((error) => {
                console.log(error);
                toast({
                    title: 'Error',
                    description: 'Event was not able to be added',
                    status: 'error',
                    duration: 3000,
                    isClosable: true
                });
                setMutatingEventKey(null);
            });
    }

    async function handleAddEvent(name, year, week, eventType, key, startDate, endDate, teams = [], custom = false) {
        setMutatingEventKey(key);
        if (!custom) {
            fetch(`/blueAlliance/event/${key}/teams/simple`)
                .then((response) => response.json())
                .then((data) => {
                    if (!data.Error) {
                        let teams = data.map((team) => {
                            return { name: team.nickname, number: team.team_number, key: team.key };
                        });
                        let event = {
                            name: name,
                            year: year,
                            week: week,
                            eventType: eventType,
                            startDate: startDate,
                            endDate: endDate,
                            key: key,
                            teams: teams
                        };
                        addEvent(event);
                    } else {
                        console.log(data.Error);
                        toast({
                            title: 'Blue Alliance Error',
                            description: 'Event was not able to be added',
                            status: 'error',
                            duration: 3000,
                            isClosable: true
                        });
                        setMutatingEventKey(null);
                    }
                })
                .catch((error) => {
                    console.log(error);
                    toast({
                        title: 'Blue Alliance Error',
                        description: 'Event was not able to be added',
                        status: 'error',
                        duration: 3000,
                        isClosable: true
                    });
                    setMutatingEventKey(null);
                });
        } else {
            setSubmitting(true);
            setSubmitAttempted(true);
            let fetches = [];
            for (let team of teams) {
                fetches.push(fetch(`/blueAlliance/team/frc${team}/simple`));
            }
            let responses = await Promise.all(fetches).catch((error) => console.log(error));
            let jsonResponses = await Promise.all(responses.map((response) => response.json())).catch((error) =>
                console.log(error)
            );
            teams = jsonResponses.map((team) => {
                return { name: team.nickname, number: team.team_number, key: team.key };
            });
            let event = {
                name: name,
                year: year,
                week: week,
                eventType: eventType,
                startDate: startDate,
                endDate: endDate,
                key: key,
                teams: teams,
                custom: true
            };
            addEvent(event);
        }
    }

    function handleRemoveEvent(key) {
        setMutatingEventKey(key);
        fetch('/event/removeEvent', {
            method: 'POST',
            headers: { key: key }
        })
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    throw new Error(response.statusText);
                }
            })
            .then((data) => {
                let removedEvent = data;
                toast({
                    title: 'Event was Removed',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                if (removedEvent.key === currentEvent.key) {
                    setCurrentEvent({ name: 'None', key: 'None' });
                    setFocusedEvent({ name: 'None', key: 'None' });
                }
                setEvents((prevEvents) => prevEvents.filter((event) => event.name !== removedEvent.name));
                setMutatingEventKey(null);
                if (!removedEvent.custom) {
                    setTimeout(() => {
                        setEventTypes((prevEventTypes) =>
                            prevEventTypes.map((eventType) => {
                                if (removedEvent.eventType === eventType.name) {
                                    let addedEvent = {
                                        name: removedEvent.name,
                                        key: removedEvent.key,
                                        week: removedEvent.week,
                                        event_type_string: removedEvent.eventType,
                                        start_date: removedEvent.startDate,
                                        end_date: removedEvent.endDate,
                                        year: removedEvent.year
                                    };
                                    let newEvents = sortEvents([...eventType.events, addedEvent]);
                                    return { ...eventType, events: newEvents, count: eventType.count + 1 };
                                } else {
                                    return eventType;
                                }
                            })
                        );
                        setVersion((prevVersion) => prevVersion + 1);
                    }, 300);
                }
            })
            .catch((error) => {
                console.log(error);
                toast({
                    title: 'Error',
                    description: 'Event was not able to be removed',
                    status: 'error',
                    duration: 3000,
                    isClosable: true
                });
                setMutatingEventKey(null);
            });
    }

    function handleSetCurrentEvent(key) {
        setChangingCurrentEvent(true);
        fetch('/event/setCurrentEvent', {
            method: 'POST',
            headers: { key: key }
        })
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    throw new Error(response.statusText);
                }
            })
            .then((data) => {
                let currentEvent = data;
                toast({
                    title: 'Current Event Changed',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                if (!currentEvent) {
                    setCurrentEvent({ name: 'None', key: 'None' });
                    setFocusedEvent({ name: 'None', key: 'None' });
                } else {
                    setCurrentEvent({ name: currentEvent.name, key: currentEvent.key });
                    setFocusedEvent({ name: currentEvent.name, key: currentEvent.key });
                }
                setChangingCurrentEvent(false);
            })
            .catch((error) => {
                console.log(error);
                toast({
                    title: 'Error',
                    description: 'Current event was not able to changed',
                    status: 'error',
                    duration: 3000,
                    isClosable: true
                });
                setFocusedEvent({ name: currentEvent.name, key: currentEvent.key });
                setChangingCurrentEvent(false);
            });
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

    if (events === null || !setupDone) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Box margin={'0 auto'} width={{ base: '90%', md: '66%', lg: '66%' }}>
            <Modal closeOnEsc={true} isOpen={isOpenSetEvent} onClose={onCloseSetEvent}>
                <ModalOverlay>
                    <ModalContent
                        width={{ base: '75%', md: '40%', lg: '30%' }}
                        marginTop={'10dvh'}
                        marginBottom={'10dvh'}
                    >
                        <ModalHeader fontSize={'lg'} fontWeight={'semibold'}>
                            Select an Event
                        </ModalHeader>
                        <ModalBody maxHeight={'calc(80dvh - 59px - 72px)'} overflowY={'auto'}>
                            <VStack spacing={'10px'}>
                                <Button
                                    colorScheme={focusedEvent.key === 'None' ? 'green' : 'gray'}
                                    onClick={() => setFocusedEvent({ name: 'None', key: 'None' })}
                                >
                                    None
                                </Button>
                                {events.map((event) => (
                                    <Button
                                        key={event.key}
                                        minH={'40px'}
                                        height={'max-content'}
                                        paddingBottom={'5px'}
                                        paddingTop={'5px'}
                                        onClick={() => setFocusedEvent({ name: event.name, key: event.key })}
                                        colorScheme={focusedEvent.key === event.key ? 'green' : 'gray'}
                                        style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}
                                    >
                                        {event.name}
                                    </Button>
                                ))}
                            </VStack>
                        </ModalBody>
                        <ModalFooter>
                            <Button onClick={onCloseSetEvent}>Cancel</Button>
                            <Button
                                colorScheme='blue'
                                ml={3}
                                onClick={() => {
                                    handleSetCurrentEvent(focusedEvent.key);
                                    onCloseSetEvent();
                                }}
                            >
                                Confirm
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </ModalOverlay>
            </Modal>
            <Modal
                closeOnEsc={true}
                isOpen={isOpenCustomEvent}
                onClose={() => {
                    onCloseCustomEvent();
                    setCustomEventData({
                        key: '',
                        name: '',
                        eventType: '',
                        focusedEventType: '',
                        startDate: '',
                        endDate: '',
                        teams: [],
                        inputTeam: ''
                    });
                    setSubmitAttempted(false);
                    setSubmitting(false);
                }}
            >
                <ModalOverlay>
                    <ModalContent
                        width={{ base: '75%', md: '40%', lg: '30%' }}
                        marginTop={'10dvh'}
                        marginBottom={'10dvh'}
                        maxHeight={'80dvh'}
                        overflowY={'auto'}
                    >
                        <ModalHeader fontSize={'lg'} fontWeight={'semibold'} paddingBottom={'5px'}>
                            Custom Event
                        </ModalHeader>
                        <ModalBody paddingLeft={'30px'}>
                            <Text marginBottom={'10px'} fontSize={'md'} fontWeight={'medium'}>
                                Event Key:
                            </Text>
                            <Input
                                type={'text'}
                                borderColor='gray.300'
                                value={customEventData.key}
                                onChange={(e) => setCustomEventData({ ...customEventData, key: e.target.value })}
                                marginBottom={'20px'}
                                maxWidth={'175px'}
                                placeholder={'Event Key'}
                                outline={
                                    customEventData.key.trim() === '' && submitAttempted ? '2px solid red' : 'none'
                                }
                                marginLeft={'15px'}
                            />
                            <Text marginBottom={'10px'} fontSize={'md'} fontWeight={'medium'}>
                                Event Name:
                            </Text>
                            <Input
                                type={'text'}
                                borderColor='gray.300'
                                value={customEventData.name}
                                onChange={(e) => setCustomEventData({ ...customEventData, name: e.target.value })}
                                marginBottom={'20px'}
                                maxWidth={'175px'}
                                placeholder={'Event Name'}
                                outline={
                                    customEventData.name.trim() === '' && submitAttempted ? '2px solid red' : 'none'
                                }
                                marginLeft={'15px'}
                            />
                            <Text marginBottom={'10px'} fontSize={'md'} fontWeight={'medium'}>
                                Event Type:
                            </Text>
                            <Menu>
                                <MenuButton
                                    maxW={'75vw'}
                                    onClick={() => setCustomEventData({ ...customEventData, focusedEventType: '' })}
                                    as={Button}
                                    rightIcon={<ChevronDownIcon />}
                                    outline={
                                        customEventData.eventType === '' && submitAttempted ? '2px solid red' : 'none'
                                    }
                                    marginLeft={'15px'}
                                    marginBottom={'20px'}
                                >
                                    <Box overflow={'hidden'} textOverflow={'ellipsis'} lineHeight={'base'}>
                                        {customEventData.eventType || 'Select One'}
                                    </Box>
                                </MenuButton>
                                <MenuList maxHeight={'200px'} overflowY={'auto'}>
                                    {eventTypesArr.map((eventType) => (
                                        <MenuItem
                                            paddingLeft={'25px'}
                                            _focus={{ backgroundColor: 'none' }}
                                            onMouseEnter={() =>
                                                setCustomEventData({
                                                    ...customEventData,
                                                    focusedEventType: eventType.name
                                                })
                                            }
                                            backgroundColor={
                                                (customEventData.eventType === eventType.name &&
                                                    customEventData.focusedEventType === '') ||
                                                customEventData.focusedEventType === eventType.name
                                                    ? 'gray.100'
                                                    : 'none'
                                            }
                                            maxW={'75vw'}
                                            key={eventType.key}
                                            onClick={() => {
                                                setCustomEventData({ ...customEventData, eventType: eventType.name });
                                            }}
                                        >
                                            {eventType.name}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </Menu>
                            <Text marginBottom={'10px'} fontSize={'md'} fontWeight={'medium'}>
                                Start Date:
                            </Text>
                            <Input
                                type={'date'}
                                borderColor='gray.300'
                                value={customEventData.startDate}
                                onChange={(e) => setCustomEventData({ ...customEventData, startDate: e.target.value })}
                                marginBottom={'20px'}
                                maxWidth={'175px'}
                                placeholder={'Select Date'}
                                outline={
                                    customEventData.startDate.trim() === '' && submitAttempted
                                        ? '2px solid red'
                                        : 'none'
                                }
                                marginLeft={'15px'}
                            />
                            <Text marginBottom={'10px'} fontSize={'md'} fontWeight={'medium'}>
                                End Date:
                            </Text>
                            <Input
                                type={'date'}
                                borderColor='gray.300'
                                value={customEventData.endDate}
                                onChange={(e) => setCustomEventData({ ...customEventData, endDate: e.target.value })}
                                marginBottom={'20px'}
                                maxWidth={'175px'}
                                placeholder={'Select Date'}
                                outline={
                                    customEventData.endDate.trim() === '' && submitAttempted ? '2px solid red' : 'none'
                                }
                                marginLeft={'15px'}
                            />
                            <Text marginBottom={'10px'} fontSize={'md'} fontWeight={'medium'}>
                                Teams:
                            </Text>
                            <HStack
                                spacing={0}
                                marginLeft={'15px'}
                                marginBottom={customEventData.teams.length > 0 && '20px'}
                            >
                                <NumberInput
                                    onChange={(value) => setCustomEventData({ ...customEventData, inputTeam: value })}
                                    value={customEventData.inputTeam}
                                    maxWidth={'150px'}
                                    borderRadius={'5px 0px 0px 5px'}
                                >
                                    <NumberInputField
                                        placeholder={'Enter team'}
                                        enterKeyHint={'send'}
                                        textAlign={'center'}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' && customEventData.inputTeam !== '') {
                                                if (customEventData.teams.includes(customEventData.inputTeam)) {
                                                    let tempObject = { ...customEventData };
                                                    let temp = [...tempObject.teams];
                                                    temp = temp.filter((team) => team !== customEventData.inputTeam);
                                                    tempObject.teams = temp;
                                                    tempObject.inputTeam = '';
                                                    setCustomEventData(tempObject);
                                                } else {
                                                    let tempObject = { ...customEventData };
                                                    let temp = [...tempObject.teams];
                                                    temp.push(customEventData.inputTeam);
                                                    tempObject.teams = temp.sort((a, b) => a - b);
                                                    tempObject.inputTeam = '';
                                                    setCustomEventData(tempObject);
                                                }
                                            }
                                        }}
                                    />
                                </NumberInput>
                                <Button
                                    h='40px'
                                    w='40px'
                                    _hover={{ bgColor: 'gray.200' }}
                                    borderRadius='0px 5px 5px 0px'
                                    bgColor={'transparent'}
                                    border={'1px solid'}
                                    borderLeft={'transparent'}
                                    borderColor={'gray.200'}
                                    _focus={{ boxShadow: 'none' }}
                                    onClick={() => {
                                        if (customEventData.inputTeam !== '') {
                                            if (customEventData.teams.includes(customEventData.inputTeam)) {
                                                let tempObject = { ...customEventData };
                                                let temp = [...tempObject.teams];
                                                temp = temp.filter((team) => team !== customEventData.inputTeam);
                                                tempObject.teams = temp;
                                                tempObject.inputTeam = '';
                                                setCustomEventData(tempObject);
                                            } else {
                                                let tempObject = { ...customEventData };
                                                let temp = [...tempObject.teams];
                                                temp.push(customEventData.inputTeam);
                                                tempObject.teams = temp.sort((a, b) => a - b);
                                                tempObject.inputTeam = '';
                                                setCustomEventData(tempObject);
                                            }
                                        }
                                    }}
                                >
                                    <Icon as={SmallAddIcon} boxSize='5' />
                                </Button>
                            </HStack>
                            <Flex justifyContent={'center'} gap={'5px'} flexWrap={'wrap'}>
                                {customEventData.teams.map((team) => (
                                    <Tag key={team}>{team}</Tag>
                                ))}
                            </Flex>
                        </ModalBody>
                        <ModalFooter paddingTop={'var(--chakra-space-4)'}>
                            <Button
                                onClick={() => {
                                    onCloseCustomEvent();
                                    setCustomEventData({
                                        key: '',
                                        name: '',
                                        eventType: '',
                                        focusedEventType: '',
                                        startDate: '',
                                        endDate: '',
                                        teams: [],
                                        inputTeam: ''
                                    });
                                    setSubmitAttempted(false);
                                    setSubmitting(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                colorScheme='blue'
                                ml={3}
                                isDisabled={
                                    customEventData.key.trim() === '' ||
                                    customEventData.name.trim() === '' ||
                                    customEventData.eventType === '' ||
                                    customEventData.startDate === '' ||
                                    customEventData.endDate === '' ||
                                    customEventData.teams.length === 0 ||
                                    submitting
                                }
                                onClick={() =>
                                    handleAddEvent(
                                        customEventData.name,
                                        year,
                                        -1,
                                        customEventData.eventType,
                                        customEventData.key + '_cst', //This somewhat ensures custom keys do not have the potential to match FRC event keys
                                        customEventData.startDate,
                                        customEventData.endDate,
                                        customEventData.teams,
                                        true
                                    )
                                }
                            >
                                Submit
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </ModalOverlay>
            </Modal>
            {position > findPos(linkRef.current, window.innerWidth <= 285 ? -150 : -75) ? (
                <Circle
                    backgroundColor={'gray.200'}
                    zIndex={2}
                    position={'fixed'}
                    cursor={'pointer'}
                    onClick={() => {
                        // handleScrollAction(linkRef);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    bottom={'2%'}
                    right={'2%'}
                    padding={'10px'}
                    borderRadius={'50%'}
                    border={'2px solid black'}
                >
                    <ArrowUpIcon fontSize={'xl'} />
                </Circle>
            ) : null}
            <Box marginBottom={'25px'}>
                <Text fontSize={'3xl'} fontWeight={'semibold'} lineHeight={'1.1'} marginBottom={'10px'}>
                    Current Event: {currentEvent.name}
                </Text>
                {changingCurrentEvent ? (
                    <Spinner></Spinner>
                ) : (
                    <IconButton size='sm' icon={<EditIcon />} onClick={onOpenSetEvent} />
                )}
            </Box>
            <Box margin='0 auto' marginBottom={'15px'}>
                <Box marginBottom={'10px'}>
                    <Text fontSize={'3xl'} fontWeight={'semibold'} lineHeight={'1.1'}>
                        Registered Events{' '}
                        <small style={{ fontSize: '65%', color: '#777', lineHeight: '1' }}>
                            {events.length} Events
                        </small>
                    </Text>
                </Box>
                <TransitionGroup>
                    {events.map((event, index) => (
                        <CSSTransition key={event.key} timeout={500} classNames='shrink'>
                            <Grid
                                minHeight={'60px'}
                                borderTop={'1px solid black'}
                                borderBottom={index === events.length - 1 && '1px solid black'}
                                backgroundColor={index % 2 === 0 ? 'gray.100' : 'white'}
                                templateColumns='2fr 1fr'
                            >
                                <GridItem
                                    display={'flex'}
                                    justifyContent={'center'}
                                    padding={'0px 10px'}
                                    alignItems={'center'}
                                >
                                    <Text textAlign={'center'}>{event.name}</Text>
                                </GridItem>
                                <GridItem display={'flex'} justifyContent={'center'} alignItems={'center'}>
                                    {mutatingEventKey === event.key ? (
                                        <Flex justifyContent={'center'} alignItems={'center'} minW={'110.27px'}>
                                            <Spinner></Spinner>
                                        </Flex>
                                    ) : (
                                        <Button
                                            isDisabled={mutatingEventKey !== null}
                                            onClick={() => handleRemoveEvent(event.key)}
                                            marginLeft={'10px'}
                                            marginRight={'10px'}
                                            colorScheme={'red'}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </GridItem>
                            </Grid>
                        </CSSTransition>
                    ))}
                </TransitionGroup>
                <Center marginTop={'15px'} marginBottom={'0px'}>
                    <Button onClick={() => onOpenCustomEvent()}>Add Custom Event</Button>
                </Center>
            </Box>
            <Center>
                <Flex flexWrap={'wrap'} marginBottom={'25px'} justifyContent={'center'}>
                    {eventTypes.map((eventType) => (
                        <Button
                            key={eventType.id}
                            ref={eventType.name === 'Week 1' ? linkRef : null}
                            maxW={'125px'}
                            minW={'125px'}
                            margin={'8px'}
                            onClick={() => handleScrollAction(eventType.ref)}
                        >
                            {eventType.name}
                        </Button>
                    ))}
                </Flex>
            </Center>
            <Box>
                {eventTypes.map((eventType) => (
                    <TBAEventsMemo
                        key={eventType.id}
                        eventType={eventType}
                        mutatingEventKey={mutatingEventKey}
                        handleAddEvent={handleAddEvent}
                        version={version}
                    ></TBAEventsMemo>
                ))}
            </Box>
        </Box>
    );
}

export default AdminPage;

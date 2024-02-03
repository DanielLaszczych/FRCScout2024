import { Box, Button, Center, Menu, MenuButton, MenuItem, MenuList, Spinner } from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import TeamPageTabs from './TeamPageTabs';
import { sortEvents } from '../util/helperFunctions';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { teamPageTabs, year } from '../util/helperConstants';
import '../stylesheets/teamstyle.css';

function TeamPage({ keyProp }) {
    const navigate = useNavigate();
    const path = useLocation();
    const tab = path.pathname.split('/')[3];
    const { teamNumber: teamNumberParam } = useParams(); //This is necessary because otherwise TeamPage will not refresh when entering a new/same team numbers even if we are passing Date.now in the key

    const [error, setError] = useState(null);
    const [events, setEvents] = useState(null);
    const [teamName, setTeamName] = useState(null);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [focusedEvent, setFocusedEvent] = useState(null);
    const [teamData, setTeamData] = useState(null);

    const abort = useRef(new AbortController());

    useEffect(() => {
        let storedTeamEvents = fetch('/event/getEventsSimple', {
            headers: { filters: JSON.stringify({ teams: { $elemMatch: { number: teamNumberParam } } }) }
        });
        let allTeamEvents = fetch(`/blueAlliance/team/frc${teamNumberParam}/events/${year}/simple`);
        Promise.all([storedTeamEvents, allTeamEvents])
            .then((responses) => {
                let responseError = responses.find((response) => response.status !== 200);
                if (responseError) {
                    throw new Error(responseError.statusText);
                } else {
                    return Promise.all(responses.map((response) => response.json()));
                }
            })
            .then((data) => {
                console.log(data);
                let storedTeamEvents = data[0];
                let allTeamEvents = data[1];
                if (allTeamEvents.Error) {
                    throw new Error(allTeamEvents.Error);
                }
                allTeamEvents = allTeamEvents.filter(
                    (event) =>
                        event.key !== `${year}cmptx` &&
                        !storedTeamEvents.some((storedEvent) => storedEvent.key === event.key)
                );
                let events = storedTeamEvents.concat(allTeamEvents);
                console.log(events);
                setEvents(sortEvents(events));
                if (events.length === 0) return;
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
    }, [teamNumberParam]);

    useEffect(() => {
        fetch(`/blueAlliance/team/frc${teamNumberParam}/simple`)
            .then((response) => response.json())
            .then((data) => {
                if (!data.Error) {
                    setTeamName(data.nickname);
                } else {
                    setError(data.Error);
                }
            })
            .catch((error) => {
                setError(error);
            });
    }, [teamNumberParam]);

    useEffect(() => {
        abort.current.abort();
        setTeamData(null);
        if (currentEvent !== null) {
            abort.current = new AbortController();
            fetch('/ted/getAllTeamEventData', {
                signal: abort.current.signal,
                headers: {
                    filters: JSON.stringify({ eventKey: currentEvent.key, teamNumber: parseInt(teamNumberParam) })
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
                    console.log(data);
                    setTeamData(data);
                })
                .catch((error) => {
                    if (error?.name !== 'AbortError') {
                        setError(error.message);
                    }
                });
        }
    }, [currentEvent, teamNumberParam]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [tab]);

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

    if (events && events.length === 0) {
        return (
            <Box
                fontSize={'lg'}
                fontWeight={'semibold'}
                textAlign={'center'}
                margin={'0 auto'}
                width={{ base: '85%', md: '66%', lg: '50%' }}
            >
                This team is not competing at any events
            </Box>
        );
    }

    if (events === null || teamName === null || currentEvent === null) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Box marginBottom={'25px'}>
            <Box className='tabs'>
                <Box className='tab-header'>
                    <Box
                        onClick={() =>
                            navigate(`/team/${teamNumberParam}/${teamPageTabs.overview}`, { state: keyProp })
                        }
                    >
                        Overview
                    </Box>
                    <Box onClick={() => navigate(`/team/${teamNumberParam}/${teamPageTabs.pit}`, { state: keyProp })}>
                        Pit
                    </Box>
                    <Box
                        onClick={() =>
                            navigate(`/team/${teamNumberParam}/${teamPageTabs.matchForms}`, { state: keyProp })
                        }
                    >
                        Match Forms
                    </Box>
                    <Box
                        onClick={() =>
                            navigate(`/team/${teamNumberParam}/${teamPageTabs.analysis}`, { state: keyProp })
                        }
                    >
                        Analysis
                    </Box>
                    <Box onClick={() => navigate(`/team/${teamNumberParam}/${teamPageTabs.other}`, { state: keyProp })}>
                        Other
                    </Box>
                </Box>
                <Box
                    className='tab-indicator'
                    style={{
                        left: `calc((calc(100% / 5) * ${Object.values(teamPageTabs).indexOf(tab)}) + 2.5%)`
                    }}
                ></Box>
            </Box>
            <Center marginBottom={'25px'}>
                <Menu placement='bottom'>
                    <MenuButton
                        maxW={'65vw'}
                        onClick={() => setFocusedEvent('')}
                        _focus={{ outline: 'none' }}
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
                                    setCurrentEvent({ name: eventItem.name, key: eventItem.key });
                                }}
                            >
                                {eventItem.name}
                            </MenuItem>
                        ))}
                    </MenuList>
                </Menu>
            </Center>
            <TeamPageTabs
                tab={tab}
                pitForm={teamData?.pitForm}
                matchForms={teamData?.matchForms}
                teamEventData={teamData?.teamEventData}
                teamNumberParam={teamNumberParam}
                teamName={teamName}
            />
        </Box>
    );
}

export default TeamPage;

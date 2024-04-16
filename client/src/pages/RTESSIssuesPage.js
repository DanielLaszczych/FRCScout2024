import { React, useCallback, useEffect, useState } from 'react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Box, Button, Center, Menu, MenuButton, MenuItem, MenuList, Spinner } from '@chakra-ui/react';
import { teamNumber, year } from '../util/helperConstants';
import { useLocation, useNavigate } from 'react-router-dom';
import { sortEvents, sortMatches } from '../util/helperFunctions';
import '../stylesheets/teamstyle.css';

import RTESSIssuesTabs from './RTESSIssuesTabs';

function RTESSIssuesPage() {
    const navigate = useNavigate();
    const path = useLocation();
    const tab = path.pathname.split('/')[2];

    const [error, setError] = useState(null);
    const [events, setEvents] = useState(null);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [focusedEvent, setFocusedEvent] = useState(null);
    const [eventInfo, setEventInfo] = useState({ inEvent: null, eventDone: null, matchTable: null });
    const [rtessIssues, setRTESSIssues] = useState(null);

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

    const fetchRTESSIssues = useCallback(() => {
        fetch('/rtessIssue/getRTESSIssues', {
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
                setRTESSIssues(data);
            })
            .catch((error) => setError(error.message));
    }, [currentEvent]);

    useEffect(() => {
        setRTESSIssues(null);
        if (currentEvent !== null) {
            fetchRTESSIssues();
        }
    }, [currentEvent, fetchRTESSIssues]);

    const fetchTeamInfoWrapper = useCallback(
        (currentEventParam) => {
            fetch(`/blueAlliance/team/frc${teamNumber}/events/${year}/keys`)
                .then((response) => response.json())
                .then((data) => {
                    if (!data.Error) {
                        if (data.includes(currentEventParam.key)) {
                            fetch(`/blueAlliance/team/frc${teamNumber}/event/${currentEventParam.key}/matches`)
                                .then((response) => response.json())
                                .then((data) => {
                                    let matchData = data;
                                    let matches = [];
                                    let atLeastOneMatch = false;
                                    if (matchData && !matchData.Error) {
                                        for (let match of matchData) {
                                            if (match.actual_time === null) {
                                                matches.push({
                                                    matchNumber: match.key.split('_')[1],
                                                    alliance: match.alliances.red.team_keys.includes(`frc${teamNumber}`)
                                                        ? match.alliances.red.team_keys
                                                        : match.alliances.blue.team_keys,
                                                    predictedTime: match.predicted_time,
                                                    scheduledTime: match.time
                                                });
                                            } else {
                                                atLeastOneMatch = true;
                                            }
                                        }
                                    }
                                    setEventInfo({
                                        ...eventInfo,
                                        inEvent: true,
                                        eventDone: atLeastOneMatch && matches.length === 0,
                                        matchTable: sortMatches(matches)
                                    });
                                })
                                .catch((error) => {
                                    setError(error);
                                });
                        } else {
                            setEventInfo({ ...eventInfo, inEvent: false });
                        }
                    } else {
                        setError(data.Error);
                    }
                })
                .catch((error) => {
                    setError(error);
                });
        },
        [eventInfo]
    );

    useEffect(() => {
        if (currentEvent !== null && eventInfo.inEvent === null) {
            fetchTeamInfoWrapper(currentEvent);
        }
    }, [currentEvent, eventInfo, fetchTeamInfoWrapper]);

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
        <Box marginBottom={'25px'}>
            <Box className='tabs'>
                <Box className='tab-header'>
                    <Box style={{ width: 'calc(100% / 2)' }} onClick={() => navigate(`/rtessIssues/team`)}>
                        Our Team
                    </Box>
                    <Box style={{ width: 'calc(100% / 2)' }} onClick={() => navigate(`/rtessIssues/event`)}>
                        Event
                    </Box>
                </Box>
                <Box
                    className='tab-indicator'
                    style={{
                        width: 'calc(75% / 2)',
                        left: `calc((calc(100% / 2) * ${['team', 'event'].indexOf(tab)}) + 6.25%)`
                    }}
                ></Box>
            </Box>
            <Box margin={'0 auto'} marginTop={'25px'} width={{ base: '90%', md: '66%', lg: '66%' }}>
                <Center marginBottom={'25px'}>
                    <Menu placement={'bottom'}>
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
                        <MenuList overflowY={'auto'} maxHeight={'400px'}>
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
                                            setEventInfo({ inEvent: null, eventDone: null, matchTable: null });
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
                {eventInfo.inEvent === null || rtessIssues === null ? (
                    <Center>
                        <Spinner></Spinner>
                    </Center>
                ) : (
                    <RTESSIssuesTabs
                        tab={tab}
                        currentEvent={currentEvent}
                        rtessIssues={rtessIssues}
                        eventInfo={eventInfo}
                        setError={setError}
                        fetchRTESSIssues={fetchRTESSIssues}
                    />
                )}
            </Box>
        </Box>
    );
}

export default RTESSIssuesPage;

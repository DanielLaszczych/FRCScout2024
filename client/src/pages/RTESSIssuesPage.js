import { useQuery } from '@apollo/client';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Box, Button, Center, Menu, MenuButton, MenuItem, MenuList, Spinner } from '@chakra-ui/react';
import { React, useCallback, useContext, useEffect, useState } from 'react';
import { SocketContext } from '../context/socket';
import { GET_EVENTS_KEYS_NAMES, GET_RTESS_ISSUES_ALL } from '../graphql/queries';
import { teamNumber, year } from '../util/helperConstants';
import { useLocation, useNavigate } from 'react-router-dom';
import { sortMatches, sortRegisteredEvents } from '../util/helperFunctions';

import RTESSIssuesTabs from './RTESSIssuesTabs';

function RTESSIssuesPage() {
    const socket = useContext(SocketContext);

    const navigate = useNavigate();
    const path = useLocation();
    const tab = path.pathname.split('/')[2];

    const [error, setError] = useState(null);
    const [currentEvent, setCurrentEvent] = useState({ name: '', key: '' });
    const [focusedEvent, setFocusedEvent] = useState('');
    const [eventInfo, setEventInfo] = useState({ inEvent: null, eventDone: null, matchTable: null });
    const [rtessIssuesAll, setRTESSIssuesAll] = useState(null);
    const [eventRTESSIssues, setEventRTESSIssues] = useState(null);

    const {
        loading: loadingRTESSIssues,
        error: rtessIssuesError,
        refetch: refetchRTESSIssues,
    } = useQuery(GET_RTESS_ISSUES_ALL, {
        fetchPolicy: 'network-only',
        onError(err) {
            console.log(JSON.stringify(err, null, 2));
            setError('Apollo error, could not retrieve rtess issues');
        },
        onCompleted({ getRTESSIssues: rtessIssues }) {
            if (currentEvent.key !== '') {
                setEventRTESSIssues(rtessIssues.filter((rtessIssue) => rtessIssue.eventKey === currentEvent.key && !['Loan', 'Donation'].includes(rtessIssue.issue)));
            }
            setRTESSIssuesAll(rtessIssues);
        },
    });

    const {
        loading: loadingEvents,
        error: eventsError,
        data: { getEvents: events } = {},
    } = useQuery(GET_EVENTS_KEYS_NAMES, {
        skip: rtessIssuesAll === null,
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
                    setEventRTESSIssues(rtessIssuesAll.filter((rtessIssue) => rtessIssue.eventKey === sortedEvents[sortedEvents.length - 1].key && !['Loan', 'Donation'].includes(rtessIssue.issue)));
                    setCurrentEvent({ name: sortedEvents[sortedEvents.length - 1].name, key: sortedEvents[sortedEvents.length - 1].key, custom: sortedEvents[sortedEvents.length - 1].custom });
                    setFocusedEvent(sortedEvents[sortedEvents.length - 1].name);
                } else {
                    setEventRTESSIssues(rtessIssuesAll.filter((rtessIssue) => rtessIssue.eventKey === currentEvent.key && !['Loan', 'Donation'].includes(rtessIssue.issue)));
                    setCurrentEvent({ name: currentEvent.name, key: currentEvent.key, custom: currentEvent.custom });
                    setFocusedEvent(currentEvent.name);
                }
            } else {
                setError('No events registered in the database');
            }
        },
    });

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
                                                    alliance: match.alliances.red.team_keys.includes(`frc${teamNumber}`) ? match.alliances.red.team_keys : match.alliances.blue.team_keys,
                                                    predictedTime: match.predicted_time,
                                                    scheduledTime: match.time,
                                                });
                                            } else {
                                                atLeastOneMatch = true;
                                            }
                                        }
                                    }
                                    setEventInfo({ ...eventInfo, inEvent: true, eventDone: atLeastOneMatch && matches.length === 0, matchTable: sortMatches(matches) });
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
        if (currentEvent.key !== '' && eventInfo.inEvent === null) {
            fetchTeamInfoWrapper(currentEvent);
        }
    }, [currentEvent, eventInfo, fetchTeamInfoWrapper]);

    useEffect(() => {
        socket.on('connect', () => {
            refetchRTESSIssues();
            if (currentEvent.key !== '') {
                fetchTeamInfoWrapper(currentEvent);
            }
        });
        socket.on('rtessUpdate', () => {
            refetchRTESSIssues();
        });
        socket.on('rtessIssuesPageUpdate', (data) => {
            if (tab === 'team') {
                setCurrentEvent({ ...data.currentEvent });
                setEventInfo({ ...eventInfo, inEvent: data.inEvent, eventDone: data.eventDone, matchTable: data.matchTable });
                if (data.currentEvent.key !== '') {
                    setEventRTESSIssues(rtessIssuesAll.filter((rtessIssue) => rtessIssue.eventKey === data.currentEvent.key && !['Loan', 'Donation'].includes(rtessIssue.issue)));
                }
            }
        });
        // clean up
        return () => {
            socket.off('connect');
            socket.off('rtessUpdate');
            socket.off('rtessIssuesPageUpdate');
        };
    }, [socket, currentEvent, refetchRTESSIssues, fetchTeamInfoWrapper, eventInfo, tab, rtessIssuesAll]);

    if (error) {
        return (
            <Box textAlign={'center'} fontSize={'25px'} fontWeight={'medium'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
                {error}
            </Box>
        );
    }

    if (loadingEvents || loadingRTESSIssues || (eventInfo.inEvent === null && eventInfo.matchTable === null) || ((eventsError || rtessIssuesError) && error !== false)) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Box>
            <div className='tabs'>
                <div className='tab-header'>
                    <div style={{ width: 'calc(100% / 2)' }} onClick={() => navigate(`/rtessIssues/team`)}>
                        Our Team
                    </div>
                    <div style={{ width: 'calc(100% / 2)' }} onClick={() => navigate(`/rtessIssues/event`)}>
                        Event
                    </div>
                </div>
                <div className='tab-indicator' style={{ width: 'calc(75% / 2)', left: `calc((calc(100% / 2) * ${['team', 'event'].indexOf(tab)}) + 6.25%)` }}></div>
            </div>
            <Box margin={'0 auto'} marginTop={'25px'} width={{ base: '90%', md: '66%', lg: '66%' }}>
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
                                        setEventInfo({ ...eventInfo, inEvent: null });
                                        setCurrentEvent({ name: eventItem.name, key: eventItem.key });
                                        setEventRTESSIssues(rtessIssuesAll.filter((rtessIssue) => rtessIssue.eventKey === eventItem.key && !['Loan', 'Donation'].includes(rtessIssue.issue)));
                                    }}
                                >
                                    {eventItem.name}
                                </MenuItem>
                            ))}
                        </MenuList>
                    </Menu>
                </Center>
                <RTESSIssuesTabs tab={tab} currentEvent={currentEvent} rtessIssues={eventRTESSIssues} rtessIssuesAll={rtessIssuesAll} eventInfo={eventInfo} setError={setError} />
            </Box>
        </Box>
    );
}

export default RTESSIssuesPage;

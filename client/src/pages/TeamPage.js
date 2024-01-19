import { Box, Button, Center, Menu, MenuButton, MenuItem, MenuList, Spinner } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import TeamPageTabs from './TeamPageTabs';
import { sortBlueAllianceEvents } from '../util/helperFunctions';
import { useQuery } from '@apollo/client';
import { GET_CURRENT_EVENT, GET_STANDFORMS_BY_TEAM, GET_PITFORMS_BY_TEAM, GET_SUPERFORMS_BY_TEAM, GET_TEAMS_EVENTS } from '../graphql/queries';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { matchFormStatus, year } from '../util/helperConstants';

function TeamPage({ keyProp }) {
    const navigate = useNavigate();
    const path = useLocation();
    const tab = path.pathname.split('/')[3];
    const { teamNumber: teamNumberParam } = useParams(); //This is necessary because otherwise TeamPage will not refresh when entering a new/same team numbers even if we are passing Date.now in the key

    const [error, setError] = useState(null);
    const [events, setEvents] = useState(null);
    const [teamName, setTeamName] = useState(null);
    const [currentEvent, setCurrentEvent] = useState({ name: '', key: '' });
    const [focusedEvent, setFocusedEvent] = useState('');
    const [pitForm, setPitForm] = useState(null);
    const [standForms, setStandForms] = useState(null);
    const [filteredStandForms, setFilteredStandForms] = useState(null);
    const [superForms, setSuperForms] = useState(null);
    const [filteredSuperForms, setFilteredSuperForms] = useState(null);
    const [loadingImage, setLoadingImage] = useState(true);
    const [blueAllianceImage, setBlueAllianceImage] = useState(null);
    const [dataMedian, setDataMedian] = useState(true);

    const { error: eventsError } = useQuery(GET_TEAMS_EVENTS, {
        fetchPolicy: 'network-only',
        variables: {
            teamNumber: parseInt(teamNumberParam)
        },
        onError(err) {
            console.log(JSON.stringify(err, null, 2));
            setError('Apollo error, could not retrieve data on current event');
        },
        onCompleted({ getTeamsEvents: teamEvents }) {
            let customEvents = teamEvents.filter((event) => event.custom);
            fetch(`/blueAlliance/team/frc${teamNumberParam}/events/${year}/simple`)
                .then((response) => response.json())
                .then((data) => {
                    if (!data.Error) {
                        let blueEvents = data.filter((event) => event.key !== '2023cmptx');
                        let events = customEvents.concat(blueEvents);
                        setEvents(sortBlueAllianceEvents(events));
                    } else {
                        setError(data.Error);
                    }
                })
                .catch((error) => {
                    setError(error);
                });
        }
    });

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
        fetch(`/blueAlliance/team/frc${teamNumberParam}/media/${year}`)
            .then((response) => response.json())
            .then((data) => {
                if (!data.Error) {
                    for (let media of data) {
                        if (media.type !== 'avatar' && media.type !== 'youtube' && media.type !== 'youtube-channel' && media.type !== 'instagram-image') {
                            setBlueAllianceImage(media.direct_url);
                            break;
                        }
                    }
                } else {
                    setError(data.Error);
                }
                setLoadingImage(false);
            })
            .catch((error) => {
                setError(error);
                setLoadingImage(false);
            });
    }, [teamNumberParam]);

    const {
        loading: loadingPitForms,
        error: pitFormsError,
        data: { getPitForms: pitFormsData } = {}
    } = useQuery(GET_PITFORMS_BY_TEAM, {
        fetchPolicy: 'network-only',
        variables: {
            teamNumber: parseInt(teamNumberParam),
            followUp: false
        },
        onError(err) {
            console.log(JSON.stringify(err, null, 2));
            setError('Apollo error, could not retrieve pit forms');
        }
    });

    const {
        loading: loadingStandForms,
        error: standFormsError,
        data: { getMatchForms: standFormsData } = {}
    } = useQuery(GET_STANDFORMS_BY_TEAM, {
        fetchPolicy: 'network-only',
        variables: {
            teamNumber: parseInt(teamNumberParam),
            standStatus: [matchFormStatus.complete, matchFormStatus.noShow]
        },
        onError(err) {
            console.log(JSON.stringify(err, null, 2));
            setError('Apollo error, could not retrieve match forms');
        }
    });

    const {
        loading: loadingSuperForms,
        error: superFormsError,
        data: { getMatchForms: superFormsData } = {}
    } = useQuery(GET_SUPERFORMS_BY_TEAM, {
        fetchPolicy: 'network-only',
        variables: {
            teamNumber: parseInt(teamNumberParam),
            superStatus: [matchFormStatus.complete, matchFormStatus.noShow]
        },
        onError(err) {
            console.log(JSON.stringify(err, null, 2));
            setError('Apollo error, could not retrieve match forms');
        }
    });

    const { loading: loadingCurrentEvent, error: currentEventError } = useQuery(GET_CURRENT_EVENT, {
        skip: events === null || loadingSuperForms || loadingStandForms || loadingPitForms,
        fetchPolicy: 'network-only',
        onError(err) {
            if (err.message === 'Error: There is no current event') {
                let event = events[events.length - 1];
                setPitForm(pitFormsData.find((pitForm) => pitForm.eventKey === event.key));
                setStandForms(standFormsData.filter((standForm) => standForm.eventKey === event.key));
                setFilteredStandForms(standFormsData.filter((standForm) => standForm.standStatus !== matchFormStatus.noShow && standForm.eventKey === event.key));
                setSuperForms(superFormsData.filter((superForm) => superForm.eventKey === event.key));
                setFilteredSuperForms(
                    superFormsData.filter((superForm) => superForm.superStatus !== matchFormStatus.noShow && superForm.superStatus !== matchFormStatus.inconclusive && superForm.eventKey === event.key)
                );
                setCurrentEvent({ name: event.name, key: event.key });
                setFocusedEvent(event.name);
                setError(false);
            } else {
                console.log(JSON.stringify(err, null, 2));
                setError('Apollo error, could not retrieve current event data');
            }
        },
        onCompleted({ getCurrentEvent: currentEvent }) {
            let event = events[events.length - 1];
            if (events.some((event) => event.key === currentEvent.key)) {
                event = currentEvent;
            }
            setPitForm(pitFormsData.find((pitForm) => pitForm.eventKey === event.key));
            setStandForms(standFormsData.filter((standForm) => standForm.eventKey === event.key));
            setFilteredStandForms(standFormsData.filter((standForm) => standForm.standStatus !== matchFormStatus.noShow && standForm.eventKey === event.key));
            setSuperForms(superFormsData.filter((superForm) => superForm.eventKey === event.key));
            setFilteredSuperForms(superFormsData.filter((superForm) => superForm.superStatus !== matchFormStatus.noShow && superForm.eventKey === event.key));
            setCurrentEvent({ name: event.name, key: event.key });
            setFocusedEvent(event.name);
        }
    });

    useEffect(() => {
        if (localStorage.getItem('DataMedian')) {
            setDataMedian(localStorage.getItem('DataMedian') === 'true');
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('DataMedian', dataMedian);
    }, [dataMedian]);

    if (error) {
        return (
            <Box textAlign={'center'} fontSize={'25px'} fontWeight={'medium'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
                {error}
            </Box>
        );
    }

    if (events && events.length === 0) {
        return (
            <Box textAlign={'center'} fontSize={'25px'} fontWeight={'medium'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
                This team is not competing at any events
            </Box>
        );
    }

    if (
        loadingSuperForms ||
        loadingStandForms ||
        loadingPitForms ||
        loadingCurrentEvent ||
        events === null ||
        teamName === null ||
        currentEvent.key === '' ||
        ((pitFormsError || standFormsError || superFormsError || currentEventError || eventsError) && error !== false) ||
        loadingImage
    ) {
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
                    <div onClick={() => navigate(`/team/${teamNumberParam}/overview`, { state: keyProp })}>Overview</div>
                    <div onClick={() => navigate(`/team/${teamNumberParam}/pit`, { state: keyProp })}>Pit</div>
                    <div onClick={() => navigate(`/team/${teamNumberParam}/stand`, { state: keyProp })}>Stand</div>
                    <div onClick={() => navigate(`/team/${teamNumberParam}/super`, { state: keyProp })}>Super</div>
                    <div onClick={() => navigate(`/team/${teamNumberParam}/other`, { state: keyProp })}>Other</div>
                </div>
                <div className='tab-indicator' style={{ left: `calc((calc(100% / 5) * ${['overview', 'pit', 'stand', 'super', 'other'].indexOf(tab)}) + 2.5%)` }}></div>
            </div>
            <Box margin={'0 auto'} marginTop={'25px'} width={['pit', 'other'].includes(tab) % 2 !== 0 ? { base: '100%', md: '66%', lg: '66%' } : { base: '100%', md: '100%', lg: '100%' }}>
                {tab === 'overview' ? (
                    <Button position={'absolute'} maxWidth={'32px'} right={'10px'} top={'160px'} onClick={() => setDataMedian(!dataMedian)} _focus={{ outline: 'none' }} size='sm'>
                        {dataMedian ? 'M' : 'A'}
                    </Button>
                ) : null}
                <Center marginBottom={'25px'}>
                    <Menu placement='bottom'>
                        <MenuButton maxW={'65vw'} onClick={() => setFocusedEvent('')} _focus={{ outline: 'none' }} as={Button} rightIcon={<ChevronDownIcon />}>
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
                                    backgroundColor={(currentEvent.name === eventItem.name && focusedEvent === '') || focusedEvent === eventItem.name ? 'gray.100' : 'none'}
                                    maxW={'65vw'}
                                    key={eventItem.key}
                                    onClick={() => {
                                        setCurrentEvent({ name: eventItem.name, key: eventItem.key });
                                        setPitForm(pitFormsData.find((pitForm) => pitForm.eventKey === eventItem.key));
                                        setStandForms(standFormsData.filter((standForm) => standForm.eventKey === eventItem.key));
                                        setFilteredStandForms(standFormsData.filter((standForm) => standForm.standStatus !== matchFormStatus.noShow && standForm.eventKey === eventItem.key));
                                        setSuperForms(superFormsData.filter((superForm) => superForm.eventKey === eventItem.key));
                                        setFilteredSuperForms(
                                            superFormsData.filter(
                                                (superForm) =>
                                                    superForm.superStatus !== matchFormStatus.noShow && superForm.superStatus !== matchFormStatus.inconclusive && superForm.eventKey === eventItem.key
                                            )
                                        );
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
                    pitForm={pitForm}
                    standForms={standForms}
                    filteredStandForms={filteredStandForms}
                    superForms={superForms}
                    filteredSuperForms={filteredSuperForms}
                    blueAllianceImage={blueAllianceImage}
                    dataMedian={dataMedian}
                    teamNumberParam={teamNumberParam}
                    teamName={teamName}
                    currentEvent={currentEvent}
                />
            </Box>
        </Box>
    );
}

export default TeamPage;

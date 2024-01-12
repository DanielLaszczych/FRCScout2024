import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Box,
    Button,
    Center,
    Divider,
    Flex,
    Grid,
    GridItem,
    IconButton,
    Image,
    Input,
    Spinner,
    Text,
    Tooltip,
    VStack
} from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth';
import { config, teamNumber, year, timeZone } from '../util/helperConstants';
import { convertMatchKeyToString, fetchAndCache, sortMatches } from '../util/helperFunctions';
import { ConditionalWrapper } from '../components/ConditionalWrapper';
import { GrMapLocation } from 'react-icons/gr';

const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function HomePage() {
    let navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [error, setError] = useState(null);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [pitFormDialog, setPitFormDialog] = useState(false);
    const [pitTeamNumber, setPitTeamNumber] = useState('');
    const [pitPopoverError, setPitPopoverError] = useState(null);
    const [fetchingConfirmation, setFetchingConfirmation] = useState(false);
    const [eventInfo, setEventInfo] = useState({ inEvent: null, matchTable: null, teamStatus: null });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 650);
    const [openPitMap, setOpenPitMap] = useState(false);

    const cancelRef = useRef();
    const inputElement = useRef();

    useEffect(() => {
        if (user !== 'NoUser') {
            fetchAndCache('/event/getCurrentEvent')
                .then((response) => {
                    if (response.status === 204) {
                        throw new Error('There is no event to scout 😔');
                    }
                    return response.json();
                })
                .then((data) => {
                    setCurrentEvent(data);
                    fetchTeamInfo(data);
                })
                .catch((error) => {
                    setError(error.message);
                });
        }
    }, [user]);

    useEffect(() => {
        window.addEventListener('resize', updateSizes);

        return () => window.removeEventListener('resize', updateSizes);
    }, []);

    function fetchTeamInfo(currentEventParam) {
        fetchAndCache(`/blueAlliance/team/frc${teamNumber}/events/${year}/keys`)
            .then((response) => response.json())
            .then((data) => {
                if (!data.Error) {
                    if (data.includes(currentEventParam.key)) {
                        let matchDataPromise = fetchAndCache(`/blueAlliance/team/frc${teamNumber}/event/${currentEventParam.key}/matches`);

                        let teamStatusPromise = fetchAndCache(`/blueAlliance/team/frc${teamNumber}/event/${currentEventParam.key}/status`);

                        Promise.all([matchDataPromise, teamStatusPromise])
                            .then((responses) => Promise.all(responses.map((response) => response.json())))
                            .then((data) => {
                                let matchData = data[0];
                                let matches = [];
                                if (matchData && !matchData.Error) {
                                    for (let match of matchData) {
                                        matches.push({
                                            matchNumber: match.key.split('_')[1],
                                            redAlliance: match.alliances.red.team_keys,
                                            blueAlliance: match.alliances.blue.team_keys,
                                            redScore: {
                                                score: match.alliances.red.score,
                                                linkRP: match.score_breakdown?.red.sustainabilityBonusAchieved,
                                                chargeRP: match.score_breakdown?.red.activationBonusAchieved
                                            },
                                            blueScore: {
                                                score: match.alliances.blue.score,
                                                linkRP: match.score_breakdown?.blue.sustainabilityBonusAchieved,
                                                chargeRP: match.score_breakdown?.blue.activationBonusAchieved
                                            },
                                            winner: match.winning_alliance,
                                            predictedTime: match.predicted_time,
                                            scheduledTime: match.time,
                                            actualTime: match.actual_time
                                        });
                                    }
                                }

                                let statusData = data[1];
                                let status = {};
                                if (statusData && Object.keys(statusData).length > 0 && statusData.qual !== null && !statusData.Error) {
                                    status.qual = statusData.qual.ranking;
                                    status.playoff = statusData.playoff;
                                }
                                setEventInfo({ inEvent: true, matchTable: sortMatches(matches), teamStatus: status });
                            })
                            .catch((error) => {
                                setError(error);
                            });
                    } else {
                        setEventInfo({ inEvent: false });
                    }
                } else {
                    setError(data.Error);
                }
            })
            .catch((error) => {
                setError(error);
            });
    }

    function updateSizes() {
        setIsMobile(window.innerWidth < 650);
    }

    function handlePitFormConfirm() {
        if (currentEvent.custom) {
            navigate(`/pitForm/${currentEvent.key}/${pitTeamNumber}`);
            return;
        }
        setFetchingConfirmation(true);
        fetch(`/blueAlliance/team/frc${parseInt(pitTeamNumber)}/events/${year}/simple`)
            .then((response) => response.json())
            .then((data) => {
                if (!data.Error) {
                    let event = data.find((event) => event.key === currentEvent.key);
                    if (event === undefined) {
                        setPitPopoverError('This team is not competing at this event');
                        setFetchingConfirmation(false);
                    } else {
                        navigate(`/pitForm/${currentEvent.key}/${pitTeamNumber}`);
                    }
                } else {
                    setPitPopoverError(data.Error);
                    setFetchingConfirmation(false);
                }
            })
            .catch((error) => {
                setPitPopoverError(error);
                setFetchingConfirmation(false);
            });
    }

    function getCurrentMatchString(matchTable) {
        let match = matchTable.find((match) => match.actualTime === null);
        return `Next Match: ${convertMatchKeyToString(match.matchNumber)}, 
                                ${
                                    match.predictedTime
                                        ? `${weekday[new Date(match.predictedTime * 1000).getDay()]} ${new Date(match.predictedTime * 1000).toLocaleString('en-US', {
                                              hour: 'numeric',
                                              minute: 'numeric',
                                              hour12: true,
                                              timeZone: timeZone
                                          })}`
                                        : match.scheduledTime
                                        ? `${weekday[new Date(match.scheduledTime * 1000).getDay()]} ${new Date(match.scheduledTime * 1000).toLocaleString('en-US', {
                                              hour: 'numeric',
                                              minute: 'numeric',
                                              hour12: true,
                                              timeZone: timeZone
                                          })}`
                                        : 'No time available'
                                }`;
    }

    function getTeamStatusString(teamStatus) {
        let qualRecord = `${teamStatus.qual.record.wins}-${teamStatus.qual.record.ties}-${teamStatus.qual.record.losses} in quals`;
        let playoffRecord = teamStatus.playoff ? `, ${teamStatus.playoff.record.wins}-${teamStatus.playoff.record.ties}-${teamStatus.playoff.record.losses} in playoffs` : '';

        return `Rank ${teamStatus.qual.rank || 'N/A'}, ${qualRecord}${playoffRecord}`;
    }

    if (error) {
        return (
            <Box textAlign={'center'} fontSize={'25px'} fontWeight={'medium'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
                {error}
            </Box>
        );
    }

    if (currentEvent === null && user !== 'NoUser') {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Center>
            {user === 'NoUser' ? (
                <a style={{ marginTop: '100px' }} href={`${config.API_URL}/auth/google`}>
                    <Button _hover={{ textColor: '#1A202C', backgroundColor: 'gray.200' }} _focus={{ outline: 'none' }}>
                        Login with Google
                    </Button>
                </a>
            ) : (
                <Box width={'100vw'}>
                    {currentEvent.pitMapImage && (
                        <React.Fragment>
                            <IconButton
                                zIndex={openPitMap ? 9999 : 998}
                                position={'absolute'}
                                left={'10px'}
                                top={'95px'}
                                onClick={() => setOpenPitMap(!openPitMap)}
                                icon={<GrMapLocation />}
                                _focus={{ outline: 'none' }}
                                size='sm'
                            />
                            {openPitMap && (
                                <Box background={openPitMap && 'rgba(0, 0, 0, 0.75)'} position={'absolute'} top={0} width={'100%'} height={'100%'} zIndex={9998}>
                                    <Image
                                        src={currentEvent.pitMapImage}
                                        objectFit={'contain'}
                                        position={'relative'}
                                        margin={'0 auto'}
                                        top={'50vh'}
                                        transform={'translateY(-50%)'}
                                        maxW={'90vw'}
                                        maxH={'90vh'}
                                    ></Image>
                                </Box>
                            )}
                        </React.Fragment>
                    )}
                    <Text textAlign={'center'} fontSize={'25px'} fontWeight={'medium'} margin={'0 auto'} width={{ base: '75%', md: '75%', lg: '100%' }}>
                        Current Event: {currentEvent.name}
                    </Text>
                    <VStack spacing={'25px'} marginTop={'25px'}>
                        <Button minWidth={'120px'} _focus={{ outline: 'none' }} onClick={() => setPitFormDialog(true)}>
                            Pit Scout
                        </Button>
                        <AlertDialog
                            closeOnEsc={true}
                            isOpen={pitFormDialog}
                            leastDestructiveRef={cancelRef}
                            onClose={() => {
                                setPitFormDialog(false);
                                setPitTeamNumber('');
                                setPitPopoverError(null);
                                setFetchingConfirmation(false);
                            }}
                            motionPreset='slideInBottom'
                        >
                            <AlertDialogOverlay
                                onFocus={() => {
                                    if (inputElement.current) {
                                        inputElement.current.focus();
                                    }
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && pitTeamNumber.trim() !== '' && !fetchingConfirmation) {
                                        handlePitFormConfirm();
                                    }
                                }}
                            >
                                <AlertDialogContent w={{ base: '75%', md: '40%', lg: '30%' }}>
                                    <AlertDialogHeader color='black' fontSize='lg' fontWeight='bold'>
                                        Enter a team number
                                    </AlertDialogHeader>
                                    <AlertDialogBody>
                                        <Input
                                            ref={inputElement}
                                            type={'number'}
                                            _focus={{ outline: 'none', boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px' }}
                                            borderColor='gray.300'
                                            value={pitTeamNumber}
                                            onChange={(e) => setPitTeamNumber(e.target.value)}
                                        />
                                        {pitPopoverError && (
                                            <Center color={'red.500'} marginTop={'5px'}>
                                                {pitPopoverError}
                                            </Center>
                                        )}
                                    </AlertDialogBody>
                                    <AlertDialogFooter paddingTop={pitPopoverError ? 0 : 'var(--chakra-space-4)'}>
                                        <Button
                                            ref={cancelRef}
                                            onClick={() => {
                                                setPitFormDialog(false);
                                                setPitTeamNumber('');
                                                setPitPopoverError(null);
                                                setFetchingConfirmation(false);
                                            }}
                                            _focus={{ outline: 'none' }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            colorScheme='blue'
                                            ml={3}
                                            isDisabled={pitTeamNumber.trim() === '' || fetchingConfirmation}
                                            _focus={{ outline: 'none' }}
                                            onClick={() => handlePitFormConfirm()}
                                        >
                                            Confirm
                                        </Button>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialogOverlay>
                        </AlertDialog>
                        <Button minWidth={'120px'} _focus={{ outline: 'none' }} as={Link} to={'/preStandForm'}>
                            Stand Scout
                        </Button>
                        <Button minWidth={'120px'} _focus={{ outline: 'none' }} as={Link} to={'/preSuperForm'}>
                            Super Scout
                        </Button>
                    </VStack>
                    {(() => {
                        if (eventInfo.inEvent === null) {
                            return (
                                <Center marginTop={'50px'}>
                                    <Spinner></Spinner>
                                </Center>
                            );
                        } else if (eventInfo.inEvent === false) {
                            return null;
                        } else if (eventInfo.matchTable === null || eventInfo.teamStatus === null) {
                            return (
                                <Center marginTop={'50px'}>
                                    <Spinner></Spinner>
                                </Center>
                            );
                        } else {
                            return (
                                <Box width={{ base: '95vw', sm: '90vw', md: '80vw', lg: '670px' }} margin={'0 auto'} marginTop={'25px'} marginBottom={'25px'}>
                                    {Object.keys(eventInfo.teamStatus).length === 0 ? (
                                        <Text textAlign={'center'} fontSize={'20px'} marginBottom={eventInfo.matchTable.length === 0 ? '10px' : '20px'} fontWeight={'medium'}>
                                            No status posted yet
                                        </Text>
                                    ) : (
                                        <Box>
                                            {eventInfo.matchTable.find((match) => match.actualTime === null) && (
                                                <Text textAlign={'center'} fontSize={'20px'} marginBottom={'10px'} fontWeight={'medium'}>
                                                    {getCurrentMatchString(eventInfo.matchTable)}
                                                </Text>
                                            )}
                                            <Text textAlign={'center'} fontSize={'20px'} marginBottom={'25px'} fontWeight={'medium'}>
                                                {getTeamStatusString(eventInfo.teamStatus)}
                                            </Text>
                                        </Box>
                                    )}
                                    {eventInfo.matchTable.length === 0 ? (
                                        <Text textAlign={'center'} fontSize={'20px'} marginBottom={'10px'} fontWeight={'medium'}>
                                            No matches posted yet
                                        </Text>
                                    ) : (
                                        <Box>
                                            <Grid
                                                margin={'0 auto'}
                                                border={'1px solid black'}
                                                borderBottom={'none'}
                                                borderRadius={'10px 10px 0px 0px'}
                                                backgroundColor={'gray.300'}
                                                templateColumns={isMobile ? '1fr 1fr 0.5fr' : '1.5fr 1fr 1fr 0.75fr'}
                                                gap={'0px'}
                                            >
                                                <GridItem padding={'7px 0px 7px 0px'} textAlign={'center'} borderRight={'1px solid black'}>
                                                    <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                        Match
                                                    </Text>
                                                </GridItem>
                                                <ConditionalWrapper
                                                    condition={isMobile}
                                                    wrapper={(children) => (
                                                        <GridItem padding={'8px 0px 8px 0px'} borderRight={'1px solid black'}>
                                                            {children}
                                                        </GridItem>
                                                    )}
                                                >
                                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'} borderRight={!isMobile && '1px solid black'}>
                                                        <Text pos={'relative'} top={!isMobile && '50%'} transform={!isMobile && 'translateY(-50%)'} paddingBottom={isMobile && '4px'}>
                                                            Red Alliance
                                                        </Text>
                                                    </GridItem>
                                                    {isMobile && <Divider borderColor={'black'} borderRadius={'5px'}></Divider>}
                                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'} borderRight={!isMobile && '1px solid black'}>
                                                        <Text pos={'relative'} top={!isMobile && '50%'} transform={!isMobile && 'translateY(-50%)'} paddingTop={isMobile && '4px'}>
                                                            Blue Alliance
                                                        </Text>
                                                    </GridItem>
                                                </ConditionalWrapper>
                                                <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                                    <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                        Scores
                                                    </Text>
                                                </GridItem>
                                            </Grid>
                                            <Box borderRadius={'0px 0px 10px 10px'} border={'1px solid black'} borderTop={'none'}>
                                                {eventInfo.matchTable.map((match, index) => (
                                                    <React.Fragment key={match.matchNumber}>
                                                        {index === 0 && (
                                                            <Grid
                                                                margin={'0 auto'}
                                                                borderTop={index === 0 ? '1px solid black' : '1px solid gray'}
                                                                backgroundColor={'#d7d7d761'}
                                                                borderRadius={eventInfo.matchTable.length - 1 === index && '0px 0px 10px 10px'}
                                                                key={'Qualifications'}
                                                                gap={'0px'}
                                                                padding={'10px 0px 10px 0px'}
                                                                textAlign={'center'}
                                                            >
                                                                Qualifications
                                                            </Grid>
                                                        )}
                                                        {index > 0 &&
                                                            eventInfo.matchTable[index].matchNumber.substring(0, 2) === 'sf' &&
                                                            eventInfo.matchTable[index - 1].matchNumber.substring(0, 2) === 'qm' && (
                                                                <Grid
                                                                    margin={'0 auto'}
                                                                    borderTop={index === 0 ? '1px solid black' : '1px solid gray'}
                                                                    backgroundColor={'#d7d7d761'}
                                                                    borderRadius={eventInfo.matchTable.length - 1 === index && '0px 0px 10px 10px'}
                                                                    key={'Semifinals'}
                                                                    gap={'0px'}
                                                                    padding={'10px 0px 10px 0px'}
                                                                    textAlign={'center'}
                                                                >
                                                                    Semifinals
                                                                </Grid>
                                                            )}
                                                        {index > 0 &&
                                                            eventInfo.matchTable[index].matchNumber.substring(0, 1) === 'f' &&
                                                            eventInfo.matchTable[index - 1].matchNumber.substring(0, 2) === 'sf' && (
                                                                <Grid
                                                                    margin={'0 auto'}
                                                                    borderTop={index === 0 ? '1px solid black' : '1px solid gray'}
                                                                    backgroundColor={'#d7d7d761'}
                                                                    borderRadius={eventInfo.matchTable.length - 1 === index && '0px 0px 10px 10px'}
                                                                    key={'Finals'}
                                                                    gap={'0px'}
                                                                    padding={'10px 0px 10px 0px'}
                                                                    textAlign={'center'}
                                                                >
                                                                    Finals
                                                                </Grid>
                                                            )}
                                                        <Grid
                                                            margin={'0 auto'}
                                                            borderTop={index === 0 ? '1px solid black' : '1px solid gray'}
                                                            backgroundColor={index % 2 === 0 ? '#d7d7d761' : 'white'}
                                                            borderRadius={eventInfo.matchTable.length - 1 === index && '0px 0px 10px 10px'}
                                                            templateColumns={isMobile ? '1fr 1fr 0.5fr' : '1.5fr 1fr 1fr 0.75fr'}
                                                            gap={'0px'}
                                                        >
                                                            <GridItem minH={isMobile && '70px'} padding={'7px 0px 7px 0px'} textAlign={'center'} borderRight={'1px solid gray'}>
                                                                <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                                    {convertMatchKeyToString(match.matchNumber)}
                                                                </Text>
                                                            </GridItem>
                                                            <ConditionalWrapper condition={isMobile} wrapper={(children) => <GridItem>{children}</GridItem>}>
                                                                <GridItem height={isMobile && '50%'} padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                                                    <Flex height={'100%'}>
                                                                        {match.redAlliance.map((team) => (
                                                                            <Flex
                                                                                height={'100%'}
                                                                                justifyContent={'center'}
                                                                                alignItems={'center'}
                                                                                borderRight={'1px solid gray'}
                                                                                width={`${100.0 / 3.0}%`}
                                                                                key={`${team}${match.matchNumber}`}
                                                                                textDecoration={team === `frc${teamNumber}` ? 'underline' : 'none'}
                                                                                textDecorationThickness={'2px'}
                                                                                fontWeight={match.redScore.score > match.blueScore.score ? 'bold' : 'normal'}
                                                                                as={Link}
                                                                                to={`/team/${team.substring(3)}/overview`}
                                                                                backgroundColor={'red.200'}
                                                                                _hover={{ backgroundColor: 'red.300' }}
                                                                                _active={{ backgroundColor: 'red.400' }}
                                                                            >
                                                                                {team.substring(3)}
                                                                            </Flex>
                                                                        ))}
                                                                    </Flex>
                                                                </GridItem>
                                                                <GridItem height={isMobile && '50%'} padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                                                    <Flex height={'100%'}>
                                                                        {match.blueAlliance.map((team) => (
                                                                            <Flex
                                                                                height={'100%'}
                                                                                justifyContent={'center'}
                                                                                alignItems={'center'}
                                                                                borderRight={'1px solid gray'}
                                                                                width={`${100.0 / 3.0}%`}
                                                                                key={`${team}${match.matchNumber}`}
                                                                                textDecoration={team === `frc${teamNumber}` ? 'underline' : 'none'}
                                                                                textDecorationThickness={'2px'}
                                                                                fontWeight={match.redScore.score < match.blueScore.score ? 'bold' : 'normal'}
                                                                                as={Link}
                                                                                to={`/team/${team.substring(3)}/overview`}
                                                                                backgroundColor={'blue.200'}
                                                                                _hover={{ backgroundColor: 'blue.300' }}
                                                                                _active={{ backgroundColor: 'blue.400' }}
                                                                            >
                                                                                {team.substring(3)}
                                                                            </Flex>
                                                                        ))}
                                                                    </Flex>
                                                                </GridItem>
                                                            </ConditionalWrapper>
                                                            <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                                                {match.actualTime !== null ? (
                                                                    <Flex height={'100%'} position={'relative'} flexWrap={'wrap'}>
                                                                        <Flex
                                                                            flexGrow={1}
                                                                            minW={isMobile && '100%'}
                                                                            height={!isMobile && '100%'}
                                                                            justifyContent={'center'}
                                                                            alignItems={'center'}
                                                                            width={'50%'}
                                                                            backgroundColor={'red.200'}
                                                                            borderRight={!isMobile && '1px solid gray'}
                                                                            fontWeight={match.redScore.score > match.blueScore.score ? 'bold' : 'normal'}
                                                                            textDecoration={match.redAlliance.includes(`frc${teamNumber}`) ? 'underline' : 'none'}
                                                                            textDecorationThickness={'2px'}
                                                                        >
                                                                            {match.redScore.score}
                                                                        </Flex>
                                                                        {match.redScore.linkRP && (
                                                                            <Tooltip label={'Sustainability Bonus'} placement={'top'}>
                                                                                <Box
                                                                                    position={'absolute'}
                                                                                    borderRadius={'5px'}
                                                                                    width={'5px'}
                                                                                    height={'5px'}
                                                                                    backgroundColor={'black'}
                                                                                    left={'4px'}
                                                                                    top={'5px'}
                                                                                ></Box>
                                                                            </Tooltip>
                                                                        )}
                                                                        {match.redScore.chargeRP && (
                                                                            <Tooltip label={'Activation Bonus'} placement={'top'}>
                                                                                <Box
                                                                                    position={'absolute'}
                                                                                    borderRadius={'5px'}
                                                                                    width={'5px'}
                                                                                    height={'5px'}
                                                                                    backgroundColor={'black'}
                                                                                    left={'12px'}
                                                                                    top={'5px'}
                                                                                ></Box>
                                                                            </Tooltip>
                                                                        )}
                                                                        <Flex
                                                                            borderRadius={eventInfo.matchTable.length - 1 === index && '0px 0px 10px 0px'}
                                                                            flexGrow={1}
                                                                            minW={isMobile && '100%'}
                                                                            height={!isMobile && '100%'}
                                                                            justifyContent={'center'}
                                                                            alignItems={'center'}
                                                                            width={'50%'}
                                                                            backgroundColor={'blue.200'}
                                                                            fontWeight={match.redScore.score < match.blueScore.score ? 'bold' : 'normal'}
                                                                            textDecoration={match.blueAlliance.includes(`frc${teamNumber}`) ? 'underline' : 'none'}
                                                                            textDecorationThickness={'2px'}
                                                                        >
                                                                            {match.blueScore.score}
                                                                        </Flex>
                                                                        {match.blueScore.linkRP && (
                                                                            <Tooltip label={'Cargo Bonus'} placement={'top'}>
                                                                                <Box
                                                                                    position={'absolute'}
                                                                                    borderRadius={'5px'}
                                                                                    width={'5px'}
                                                                                    height={'5px'}
                                                                                    backgroundColor={'black'}
                                                                                    left={isMobile ? '4px' : 'calc(50% + 4px)'}
                                                                                    top={isMobile ? 'calc(50% + 5px)' : '5px'}
                                                                                ></Box>
                                                                            </Tooltip>
                                                                        )}
                                                                        {match.blueScore.chargeRP && (
                                                                            <Tooltip label={'Hangar Bonus'} placement={'top'}>
                                                                                <Box
                                                                                    position={'absolute'}
                                                                                    borderRadius={'5px'}
                                                                                    width={'5px'}
                                                                                    height={'5px'}
                                                                                    backgroundColor={'black'}
                                                                                    left={isMobile ? '12px' : 'calc(50% + 12px)'}
                                                                                    top={isMobile ? 'calc(50% + 5px)' : '5px'}
                                                                                ></Box>
                                                                            </Tooltip>
                                                                        )}
                                                                    </Flex>
                                                                ) : (
                                                                    <Tooltip
                                                                        isDisabled={!match.predictedTime}
                                                                        label={
                                                                            !match.scheduledTime
                                                                                ? 'No time scheduled' //this will likely never occur because our tooltip is only enabled if theres a predicted time which means there should also be a scheduled time
                                                                                : `Scheduled at ${weekday[new Date(match.scheduledTime * 1000).getDay()]} ${new Date(
                                                                                      match.scheduledTime * 1000
                                                                                  ).toLocaleString('en-US', {
                                                                                      hour: 'numeric',
                                                                                      minute: 'numeric',
                                                                                      hour12: true,
                                                                                      timeZone: timeZone
                                                                                  })}`
                                                                        }
                                                                    >
                                                                        <Text fontStyle={match.predictedTime ? 'italic' : 'normal'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                                            {match.predictedTime
                                                                                ? `${weekday[new Date(match.predictedTime * 1000).getDay()]} ${new Date(match.predictedTime * 1000).toLocaleString(
                                                                                      'en-US',
                                                                                      {
                                                                                          hour: 'numeric',
                                                                                          minute: 'numeric',
                                                                                          hour12: true,
                                                                                          timeZone: timeZone
                                                                                      }
                                                                                  )}*`
                                                                                : match.scheduledTime
                                                                                ? `${weekday[new Date(match.scheduledTime * 1000).getDay()]} ${new Date(match.scheduledTime * 1000).toLocaleString(
                                                                                      'en-US',
                                                                                      {
                                                                                          hour: 'numeric',
                                                                                          minute: 'numeric',
                                                                                          hour12: true,
                                                                                          timeZone: timeZone
                                                                                      }
                                                                                  )}`
                                                                                : '?'}
                                                                        </Text>
                                                                    </Tooltip>
                                                                )}
                                                            </GridItem>
                                                        </Grid>
                                                    </React.Fragment>
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            );
                        }
                    })()}
                </Box>
            )}
        </Center>
    );
}

export default HomePage;

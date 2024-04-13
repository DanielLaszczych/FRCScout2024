import React, { useEffect, useState } from 'react';
import { Box, Button, Center, Flex, Grid, GridItem, Icon, IconButton, Spinner, Text, Tooltip } from '@chakra-ui/react';
import { GiHighShot } from 'react-icons/gi';
import { RiEditBoxFill, RiSpeaker2Fill } from 'react-icons/ri';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AutoPaths from '../components/AutoPaths';
import CommentsTable from '../components/CommentsTable';
import MatchCompareGraph from '../components/MatchCompareGraph';
import MatchLineGraphs from '../components/MatchLineGraphs';
import TeamStatsList from '../components/TeamStatsList';
import { matchFormStatus, teamPageTabs } from '../util/helperConstants';
import { convertMatchKeyToString, roundToTenth } from '../util/helperFunctions';
import PitMap from '../components/PitMap';

let tabs = {
    graphs: 'Graphs',
    autoPaths: 'Auto Paths',
    commentsAndIssues: 'Comments & Issues',
    stats: 'Stats List',
    compare: 'Compare'
};

function MatchAnalystPage() {
    const {
        eventKey: eventKeyParam,
        redTeamNumber1: redTeamNumber1Param,
        redTeamNumber2: redTeamNumber2Param,
        redTeamNumber3: redTeamNumber3Param,
        blueTeamNumber1: blueTeamNumber1Param,
        blueTeamNumber2: blueTeamNumber2Param,
        blueTeamNumber3: blueTeamNumber3Param,
        matchNumber: matchNumberParam
    } = useParams();
    const navigate = useNavigate();

    const [error, setError] = useState(null);
    const [eventName, setEventName] = useState(null);
    const [eventData, setEventData] = useState(null);
    const [teams] = useState({
        red: [redTeamNumber1Param, redTeamNumber2Param, redTeamNumber3Param],
        blue: [blueTeamNumber1Param, blueTeamNumber2Param, blueTeamNumber3Param]
    });
    const [multiTeamEventData, setMultiTeamEventData] = useState(null);
    const [multiOneValidMatchForms, setMutliOneValidMatchForms] = useState(null);
    const [multiTeamRTESSData, setMultiTeamRTESSData] = useState(null);
    const [tab, setTab] = useState(tabs.graphs);

    useEffect(() => {
        fetch(`/blueAlliance/event/${eventKeyParam}/simple`)
            .then((response) => response.json())
            .then((data) => {
                if (!data.Error) {
                    setEventName(data.name);
                } else {
                    setError(data.Error);
                }
            })
            .catch((error) => {
                console.log(error);
                setError(error.message);
            });

        fetch('/event/getEvent', { headers: { filters: JSON.stringify({ key: eventKeyParam }) } })
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    throw new Error(response.statusText);
                }
            })
            .then((data) => {
                if (data === null) {
                    setEventData({});
                } else {
                    setEventData(data);
                }
            })
            .catch((error) => setError(error.message));

        Promise.all(
            teams.red.concat(teams.blue).map((teamNumber) =>
                fetch('/ted/getAllTeamEventData', {
                    headers: {
                        filters: JSON.stringify({ eventKey: eventKeyParam, teamNumber: parseInt(teamNumber) })
                    }
                })
            )
        )
            .then((responses) => {
                let responseError = responses.find((response) => response.status !== 200);
                if (responseError) {
                    throw new Error(responseError.statusText);
                } else {
                    return Promise.all(responses.map((response) => response.json()));
                }
            })
            .then((data) => {
                let allTeamData = data;
                let multiTeamEventData = {};
                let multiOneValidMatchForms = {};
                let multiTeamRTESSData = {};
                allTeamData.forEach((teamData, index) => {
                    let teamNumber = index > 2 ? teams.blue[index - 3] : teams.red[index];
                    multiTeamEventData[teamNumber] = teamData.teamEventData;
                    multiOneValidMatchForms[teamNumber] = teamData.matchForms.filter(
                        (matchForm) =>
                            [matchFormStatus.complete, matchFormStatus.noShow].includes(matchForm.standStatus) ||
                            [matchFormStatus.complete, matchFormStatus.noShow].includes(matchForm.superStatus)
                    );
                    multiTeamRTESSData[teamNumber] = teamData.rtessIssues;
                });
                setMultiTeamEventData(multiTeamEventData);
                setMutliOneValidMatchForms(multiOneValidMatchForms);
                setMultiTeamRTESSData(multiTeamRTESSData);
            })
            .catch((error) => {
                setError(error.message);
            });
    }, [eventKeyParam, teams]);

    function getAvgTotalPoints(alliance, amplify = 0) {
        let total = 0;
        for (const teamNumber of teams[alliance]) {
            let teamData = multiTeamEventData[teamNumber];
            if (teamData) {
                total +=
                    teamData.autoPoints.avg +
                    teamData.teleopGP.ampScore.avg +
                    teamData.teleopGP.speakerScore.avg * (1 - amplify) * 2 +
                    teamData.teleopGP.speakerScore.avg * amplify * 5 +
                    teamData.stagePoints.avg;
            }
        }
        return total;
    }

    function getMaxTotalPoints(alliance, amplify = 0) {
        let total = 0;
        for (const teamNumber of teams[alliance]) {
            let teamData = multiTeamEventData[teamNumber];
            if (teamData) {
                total +=
                    teamData.autoPoints.max +
                    teamData.teleopGP.ampScore.max +
                    teamData.teleopGP.speakerScore.max * (1 - amplify) * 2 +
                    teamData.teleopGP.speakerScore.max * amplify * 5 +
                    teamData.stagePoints.max;
            }
        }
        return total;
    }

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

    if (
        eventName === null ||
        eventData === null ||
        multiTeamEventData === null ||
        multiOneValidMatchForms === null ||
        multiTeamRTESSData === null
    ) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Box marginBottom={'25px'}>
            <IconButton
                position={'absolute'}
                top={'95px'}
                right={'15px'}
                onClick={() => {
                    navigate('/preMatchAnalyst', { state: { teams } });
                }}
                size={'sm'}
                icon={<RiEditBoxFill />}
            />
            <PitMap event={eventData} iconTop={95} iconLeft={10} redTeams={teams.red} blueTeams={teams.blue}></PitMap>
            <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginBottom={'5px'}>
                {eventName}
            </Text>
            {matchNumberParam && (
                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginBottom={'10px'}>
                    {convertMatchKeyToString(matchNumberParam)}
                </Text>
            )}
            <Box width={{ base: '100%', lg: '85%' }} overflowX={'auto'} margin={'0 auto'} marginBottom={'15px'}>
                <Grid
                    templateColumns={'1fr 1.65fr 1.3fr 2fr 1.65fr 1.3fr 1.3fr'}
                    borderTop={'1px solid black'}
                    minWidth={'1200px'}
                >
                    {[
                        { label: 'Team #' },
                        { label: 'Total', subLabels: ['Pts', 'Max Pts', 'GP'] },
                        { label: 'Auto', subLabels: ['Pts', 'GP'] },
                        { label: 'Teleop', subLabels: ['Pts', 'Amp GP', 'Spkr. GP'] },
                        { label: 'Stage', subLabels: ['Pts', 'Hangs', 'Traps'] },
                        { label: 'No Amplif.', subLabels: ['Pts', 'Max Pts'] },
                        { label: '75% Amplif.', subLabels: ['Pts', 'Max Pts'] }
                    ].map((element) => (
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
                                {!element.subLabels ? (
                                    element.label
                                ) : (
                                    <React.Fragment>
                                        <Text height={'27px'}>{element.label}</Text>
                                        <Flex height={'27px'} width={'100%'}>
                                            {element.subLabels.map((subLabel) => (
                                                <Text key={subLabel} flex={1 / element.subLabels.length}>
                                                    {subLabel}
                                                </Text>
                                            ))}
                                        </Flex>
                                    </React.Fragment>
                                )}
                            </GridItem>
                        </React.Fragment>
                    ))}
                    {['red', 'blue'].map((alliance, index) => (
                        <React.Fragment key={alliance}>
                            <GridItem
                                fontSize={'xl'}
                                fontWeight={'medium'}
                                textAlign={'center'}
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                borderBottom={'1px solid black'}
                                borderRight={'1px solid black'}
                                backgroundColor={alliance === 'red' ? 'red.200' : 'blue.200'}
                                rowEnd={index * 3 + 5}
                                colEnd={7}
                                rowSpan={3}
                                colSpan={1}
                            >
                                <Text flex={1 / 2}>{roundToTenth(getAvgTotalPoints(alliance))}</Text>
                                <Text flex={1 / 2}>{roundToTenth(getMaxTotalPoints(alliance))}</Text>
                            </GridItem>
                            <GridItem
                                fontSize={'xl'}
                                fontWeight={'medium'}
                                textAlign={'center'}
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                borderBottom={'1px solid black'}
                                borderRight={'1px solid black'}
                                backgroundColor={alliance === 'red' ? 'red.200' : 'blue.200'}
                                rowEnd={index * 3 + 5}
                                colEnd={8}
                                rowSpan={3}
                                colSpan={1}
                            >
                                <Text flex={1 / 2}>{roundToTenth(getAvgTotalPoints(alliance, 0.75))}</Text>
                                <Text flex={1 / 2}>{roundToTenth(getMaxTotalPoints(alliance, 0.75))}</Text>
                            </GridItem>
                        </React.Fragment>
                    ))}
                    {[...teams.red, ...teams.blue].map((teamNumber, index) => (
                        <React.Fragment key={teamNumber}>
                            <GridItem
                                fontSize={'lg'}
                                fontWeight={'medium'}
                                textAlign={'center'}
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                borderBottom={'1px solid black'}
                                borderRight={'1px solid black'}
                                backgroundColor={index > 2 ? 'blue.200' : 'red.200'}
                                minHeight={'35px'}
                                position={'sticky'}
                                left={0}
                                zIndex={1}
                                borderLeft={'1px solid black'}
                                as={Link}
                                to={`/team/${teamNumber}/${teamPageTabs.overview}`}
                                _hover={index > 2 ? { backgroundColor: 'blue.300' } : { backgroundColor: 'red.300' }}
                                _active={index > 2 ? { backgroundColor: 'blue.400' } : { backgroundColor: 'red.400' }}
                            >
                                {teamNumber}
                            </GridItem>
                            {multiTeamEventData[teamNumber] && (
                                <React.Fragment>
                                    <Grid
                                        fontSize={'lg'}
                                        fontWeight={'medium'}
                                        textAlign={'center'}
                                        display={'flex'}
                                        justifyContent={'center'}
                                        alignItems={'center'}
                                        borderBottom={'1px solid black'}
                                        borderRight={'1px solid black'}
                                        backgroundColor={index > 2 ? 'blue.200' : 'red.200'}
                                    >
                                        <Text flex={1 / 3}>
                                            {roundToTenth(multiTeamEventData[teamNumber].offensivePoints.avg)}
                                        </Text>
                                        <Text flex={1 / 3}>{multiTeamEventData[teamNumber].offensivePoints.max}</Text>
                                        <Text flex={1 / 3}>
                                            {roundToTenth(
                                                multiTeamEventData[teamNumber].autoGP.ampScore.avg +
                                                    multiTeamEventData[teamNumber].autoGP.speakerScore.avg +
                                                    multiTeamEventData[teamNumber].teleopGP.ampScore.avg +
                                                    multiTeamEventData[teamNumber].teleopGP.speakerScore.avg
                                            )}
                                        </Text>
                                    </Grid>
                                    <Grid
                                        fontSize={'lg'}
                                        fontWeight={'medium'}
                                        textAlign={'center'}
                                        display={'flex'}
                                        justifyContent={'center'}
                                        alignItems={'center'}
                                        borderBottom={'1px solid black'}
                                        borderRight={'1px solid black'}
                                        backgroundColor={index > 2 ? 'blue.200' : 'red.200'}
                                    >
                                        <Text flex={1 / 2}>
                                            {roundToTenth(multiTeamEventData[teamNumber].autoPoints.avg)}
                                        </Text>
                                        <Text flex={1 / 2}>
                                            {roundToTenth(
                                                multiTeamEventData[teamNumber].autoGP.ampScore.avg +
                                                    multiTeamEventData[teamNumber].autoGP.speakerScore.avg
                                            )}
                                        </Text>
                                    </Grid>
                                    <Grid
                                        fontSize={'lg'}
                                        fontWeight={'medium'}
                                        textAlign={'center'}
                                        display={'flex'}
                                        justifyContent={'center'}
                                        alignItems={'center'}
                                        borderBottom={'1px solid black'}
                                        borderRight={'1px solid black'}
                                        backgroundColor={index > 2 ? 'blue.200' : 'red.200'}
                                    >
                                        <Text flex={1 / 3}>
                                            {roundToTenth(multiTeamEventData[teamNumber].teleopPoints.avg)}
                                        </Text>
                                        <Text flex={1 / 3}>
                                            {roundToTenth(multiTeamEventData[teamNumber].teleopGP.ampScore.avg)}
                                        </Text>
                                        <Flex
                                            flex={1 / 3}
                                            justifyContent={'center'}
                                            alignItems={'center'}
                                            columnGap={'3px'}
                                        >
                                            <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                {roundToTenth(multiTeamEventData[teamNumber].teleopGP.speakerScore.avg)}
                                            </Text>
                                            {multiTeamEventData[teamNumber].teleopGP.speakerScore.total +
                                                multiTeamEventData[teamNumber].teleopGP.speakerMiss.total >
                                            0 ? (
                                                multiTeamEventData[teamNumber].teleopGP.subwooferScore.avg +
                                                    multiTeamEventData[teamNumber].teleopGP.subwooferMiss.avg >
                                                multiTeamEventData[teamNumber].teleopGP.otherScore.avg +
                                                    multiTeamEventData[teamNumber].teleopGP.otherMiss.avg ? (
                                                    <Tooltip
                                                        // label={'Primary Subwoofer w/Allocation %'}
                                                        label={'Primary Subwoofer'}
                                                        hasArrow
                                                    >
                                                        <Center>
                                                            <Icon boxSize={5} as={RiSpeaker2Fill} />
                                                            {/* <Text fontSize={'sm'}>{`${roundToWhole(
                                                                ((multiTeamEventData[teamNumber].teleopGP.subwooferScore
                                                                    .avg +
                                                                    multiTeamEventData[teamNumber].teleopGP
                                                                        .subwooferMiss.avg) /
                                                                    (multiTeamEventData[teamNumber].teleopGP
                                                                        .speakerScore.avg +
                                                                        multiTeamEventData[teamNumber].teleopGP
                                                                            .speakerMiss.avg)) *
                                                                    100
                                                            )}%`}</Text> */}
                                                        </Center>
                                                    </Tooltip>
                                                ) : (
                                                    <Tooltip
                                                        // label={'Primary Ranged w/Allocation %'}
                                                        label={'Primary Ranged'}
                                                        hasArrow
                                                    >
                                                        <Center>
                                                            <Icon boxSize={4} as={GiHighShot} />
                                                            {/* <Text fontSize={'sm'}>{`${roundToWhole(
                                                                ((multiTeamEventData[teamNumber].teleopGP.otherScore
                                                                    .avg +
                                                                    multiTeamEventData[teamNumber].teleopGP.otherMiss
                                                                        .avg) /
                                                                    (multiTeamEventData[teamNumber].teleopGP
                                                                        .speakerScore.avg +
                                                                        multiTeamEventData[teamNumber].teleopGP
                                                                            .speakerMiss.avg)) *
                                                                    100
                                                            )}%`}</Text> */}
                                                        </Center>
                                                    </Tooltip>
                                                )
                                            ) : null}
                                        </Flex>
                                    </Grid>
                                    <Grid
                                        fontSize={'lg'}
                                        fontWeight={'medium'}
                                        textAlign={'center'}
                                        display={'flex'}
                                        justifyContent={'center'}
                                        alignItems={'center'}
                                        borderBottom={'1px solid black'}
                                        borderRight={'1px solid black'}
                                        backgroundColor={index > 2 ? 'blue.200' : 'red.200'}
                                    >
                                        <Text flex={1 / 3}>
                                            {roundToTenth(multiTeamEventData[teamNumber].stagePoints.avg)}
                                        </Text>
                                        <Text flex={1 / 3}>
                                            {multiTeamEventData[teamNumber].climbSuccessFraction || 'N/A'}
                                        </Text>
                                        <Text flex={1 / 3}>{multiTeamEventData[teamNumber].teleopGP.trap.total}</Text>
                                    </Grid>
                                </React.Fragment>
                            )}
                            {!multiTeamEventData[teamNumber] && (
                                <React.Fragment>
                                    <GridItem
                                        fontSize={'lg'}
                                        fontWeight={'medium'}
                                        textAlign={'center'}
                                        display={'flex'}
                                        justifyContent={'center'}
                                        alignItems={'center'}
                                        borderBottom={'1px solid black'}
                                        borderRight={'1px solid black'}
                                        backgroundColor={index > 2 ? 'blue.200' : 'red.200'}
                                        colSpan={4}
                                    >
                                        No data avaliable
                                    </GridItem>
                                </React.Fragment>
                            )}
                        </React.Fragment>
                    ))}
                </Grid>
            </Box>
            <Flex
                margin={'0 auto'}
                justifyContent={'center'}
                columnGap={'10px'}
                rowGap={'10px'}
                marginTop={'30px'}
                marginBottom={'15px'}
                flexWrap={'wrap'}
                width={'80%'}
            >
                {Object.keys(tabs).map((tabKey) => (
                    <Button
                        key={tabs[tabKey]}
                        colorScheme={tabs[tabKey] === tab ? 'green' : 'gray'}
                        onClick={() => setTab(tabs[tabKey])}
                    >
                        {tabs[tabKey]}
                    </Button>
                ))}
            </Flex>
            <Box hidden={tab !== tabs.graphs}>
                <MatchLineGraphs
                    teamNumbers={[...teams.red, ...teams.blue]}
                    multiTeamMatchForms={Object.fromEntries(
                        [...teams.red, ...teams.blue].map((teamNumber) => [
                            teamNumber,
                            multiOneValidMatchForms[teamNumber]
                        ])
                    )}
                    onTeamPage={false}
                />
            </Box>
            <Box hidden={tab !== tabs.autoPaths}>
                <AutoPaths
                    teamNumbers={[...teams.red, ...teams.blue]}
                    autoPaths={Object.fromEntries(
                        [...teams.red, ...teams.blue].map((teamNumber) => [
                            teamNumber,
                            multiTeamEventData[teamNumber]?.autoPaths
                        ])
                    )}
                    allAutoPaths={Object.fromEntries(
                        [...teams.red, ...teams.blue].map((teamNumber) => [
                            teamNumber,
                            multiTeamEventData[teamNumber]?.allAutoPaths
                        ])
                    )}
                    onTeamPage={false}
                />
            </Box>
            <Box hidden={tab !== tabs.commentsAndIssues}>
                <CommentsTable
                    teamNumbers={[...teams.red, ...teams.blue]}
                    multiTeamMatchForms={Object.fromEntries(
                        [...teams.red, ...teams.blue].map((teamNumber) => [
                            teamNumber,
                            multiOneValidMatchForms[teamNumber]
                        ])
                    )}
                    multiTeamRTESSForms={Object.fromEntries(
                        [...teams.red, ...teams.blue].map((teamNumber) => [teamNumber, multiTeamRTESSData[teamNumber]])
                    )}
                    onTeamPage={false}
                />
            </Box>
            <Box hidden={tab !== tabs.stats}>
                <TeamStatsList
                    teamNumbers={[...teams.red, ...teams.blue]}
                    multiTeamEventsData={Object.fromEntries(
                        [...teams.red, ...teams.blue].map((teamNumber) => [teamNumber, multiTeamEventData[teamNumber]])
                    )}
                    multiTeamMatchForms={Object.fromEntries(
                        [...teams.red, ...teams.blue].map((teamNumber) => [
                            teamNumber,
                            multiOneValidMatchForms[teamNumber]
                        ])
                    )}
                    onTeamPage={false}
                />
            </Box>
            <Box hidden={tab !== tabs.compare}>
                <MatchCompareGraph
                    teamNumbers={[...teams.red, ...teams.blue]}
                    multiTeamEventsData={Object.fromEntries(
                        [...teams.red, ...teams.blue].map((teamNumber) => [teamNumber, multiTeamEventData[teamNumber]])
                    )}
                    multiTeamMatchForms={Object.fromEntries(
                        [...teams.red, ...teams.blue].map((teamNumber) => [
                            teamNumber,
                            multiOneValidMatchForms[teamNumber]
                        ])
                    )}
                    onTeamPage={false}
                />
            </Box>
        </Box>
    );
}

export default MatchAnalystPage;

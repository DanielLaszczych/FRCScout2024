import React, { useCallback, useContext, useEffect, useLayoutEffect, useState } from 'react';
import {
    Box,
    Center,
    Flex,
    Grid,
    GridItem,
    IconButton,
    Image as ChakraImage,
    ListItem,
    OrderedList,
    Popover,
    PopoverArrow,
    PopoverCloseButton,
    PopoverContent,
    PopoverTrigger,
    Spinner,
    Tag,
    Text,
    Divider
} from '@chakra-ui/react';
import {
    convertMatchKeyToString,
    convertStationKeyToString,
    getValueByRange,
    shortenScouterName,
    sortMatches
} from '../util/helperFunctions';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from '../context/auth';
import { Link } from 'react-router-dom';
import { matchFormStatus, teamPageTabs } from '../util/helperConstants';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';
import PreAutoBlueField from '../images/PreAutoBlueField.png';
import PreAutoRedField from '../images/PreAutoRedField.png';
import { GrMap } from 'react-icons/gr';
import MatchLineGraphs from '../components/MatchLineGrahps';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

let abilityTypes = {
    ranking: 'ranking',
    checkbox: 'checkbox',
    radio: 'radio'
};
let subAbilityTypes = {
    radio: 'radio',
    comment: 'comment'
};
let startingPositions = [
    [28, 35, uuidv4()],
    [60, 118, uuidv4()],
    [28, 200, uuidv4()],
    [28, 300, uuidv4()]
];
let imageWidth = 435;
let imageHeight = 435;

function TeamPageTabs({ tab, pitForm, matchForms, teamEventData, teamNumberParam, teamName }) {
    const { user } = useContext(AuthContext);

    const [dimensionRatios, setDimensionRatios] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [commentsToggled, setCommentsToggled] = useState([]);
    const [oneCompleteMatchForms, setOneCompleteMatchForms] = useState(null);

    useEffect(() => {
        if (matchForms) {
            setOneCompleteMatchForms(
                matchForms.filter(
                    (matchForm) =>
                        matchForm.standStatus === matchFormStatus.complete ||
                        matchForm.superStatus === matchFormStatus.complete
                )
            );
        } else {
            setOneCompleteMatchForms(null);
        }
    }, [matchForms]);

    useLayoutEffect(() => {
        setDimensionRatios(null);
        setImageLoaded(false);
    }, [tab]);

    const getImageVariables = useCallback(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const breakPointWidth = window.innerWidth;
        // const viewportHeight = window.innerHeight;

        // Calculate image dimensions based on screen size
        // We subtract by 50 in this one to account for the 25px of padding on all sides
        const maxWidth =
            viewportWidth *
                (tab !== teamPageTabs.forms
                    ? getValueByRange(breakPointWidth)
                    : getValueByRange(breakPointWidth, [0.75, 0.6, 0.35, 0.2])) -
            (tab !== teamPageTabs.forms ? 0 : 50); // Adjust the multiplier as needed
        const maxHeight = imageHeight - (tab !== teamPageTabs.forms ? 0 : 50);

        const screenAspectRatio = maxWidth / maxHeight;
        const imageAspectRatio = imageWidth / imageHeight;

        // Calculate the new dimensions to fit the screen while maintaining the aspect ratio
        let scaledWidth, scaledHeight;
        if (imageAspectRatio > screenAspectRatio) {
            // Original image has a wider aspect ratio, so add horizontal whitespace
            scaledWidth = maxWidth;
            scaledHeight = maxWidth / imageAspectRatio;

            // Commenting this because we will never white space because we
            // position inside the image
            // const extraHorizontalSpace = maxHeight - scaledHeight;
            // const whitespaceTop = extraHorizontalSpace / 2;
            // const whitespaceBottom = extraHorizontalSpace / 2;
            // setWhitespace({ top: whitespaceTop, bottom: whitespaceBottom, left: 0, right: 0 });
        } else {
            // Original image has a taller aspect ratio, so add vertical whitespace
            scaledHeight = maxHeight;
            scaledWidth = maxHeight * imageAspectRatio;

            // Commenting this because we will never white space because we
            // position inside the image
            // const extraVerticalSpace = maxWidth - scaledWidth;
            // const whitespaceLeft = extraVerticalSpace / 2;
            // const whitespaceRight = extraVerticalSpace / 2;
            // setWhitespace({ top: 0, bottom: 0, left: whitespaceLeft, right: whitespaceRight });
        }
        setDimensionRatios({ width: scaledWidth / imageWidth, height: scaledHeight / imageHeight });
    }, [tab]);

    useEffect(() => {
        if ([teamPageTabs.pit, teamPageTabs.forms].includes(tab)) {
            getImageVariables();
            window.addEventListener('resize', getImageVariables);

            return () => window.removeEventListener('resize', getImageVariables);
        }
    }, [getImageVariables, tab]);

    function getPoint(pointX, station) {
        let mirror = 185;
        if (station.charAt(0) === 'r') {
            // Calculate mirrored x-coordinate
            return 2 * mirror - pointX;
        } else {
            return pointX;
        }
    }

    function renderAbilities(ability, index) {
        return (
            <Box key={ability.label + index} width={'100%'} marginTop={index > 0 && '8px'}>
                <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'}>
                    {ability.label}
                    {ability.type === abilityTypes.radio ? `: ${ability.abilities[0].label}` : ''}
                </Text>
                {(() => {
                    switch (ability.type) {
                        case abilityTypes.checkbox:
                            return (
                                <Flex
                                    justifyContent={'space-evenly'}
                                    flexWrap={'wrap'}
                                    marginTop={'5px'}
                                    columnGap={'10px'}
                                    rowGap={'8px'}
                                >
                                    {ability.abilities.length === 0 && (
                                        <Tag fontSize={'md'} fontWeight={'medium'}>
                                            None
                                        </Tag>
                                    )}
                                    {ability.abilities.map((subAbility) => {
                                        return (
                                            <Tag key={subAbility.label} fontSize={'md'} fontWeight={'medium'}>
                                                {subAbility.label}
                                            </Tag>
                                        );
                                    })}
                                </Flex>
                            );
                        case abilityTypes.ranking:
                            return (
                                <OrderedList>
                                    {ability.abilities.map((subAbility) => {
                                        return (
                                            <ListItem
                                                marginLeft={'15px'}
                                                key={subAbility.label}
                                                fontWeight={'600'}
                                                fontSize={'100%'}
                                            >
                                                <Text display={'inline-block'} fontWeight={'600'} fontSize={'100%'}>
                                                    {subAbility.label}
                                                </Text>
                                                {subAbility?.subType === subAbilityTypes.radio && (
                                                    <Text display={'inline-block'} fontWeight={'600'} fontSize={'100%'}>
                                                        &nbsp;{`(${subAbility.subField})`}
                                                    </Text>
                                                )}
                                            </ListItem>
                                        );
                                    })}
                                    ;
                                </OrderedList>
                            );
                        default:
                            return null;
                    }
                })()}
            </Box>
        );
    }

    function renderTab(tab) {
        switch (tab) {
            case teamPageTabs.overview:
                return (
                    <Flex flexWrap={'wrap'} justifyContent={'center'} rowGap={'15px'}>
                        <Flex width={{ base: '100%', lg: '40%' }} flexDirection={'column'} alignItems={'center'}>
                            <Text fontSize={'2xl'} fontWeight={'semibold'} textAlign={'center'}>
                                Team Number: {teamNumberParam}
                            </Text>
                            <Text fontSize={'2xl'} fontWeight={'semibold'} textAlign={'center'}>
                                Team Name: {teamName}
                            </Text>
                            {pitForm?.image && (
                                <ChakraImage
                                    marginTop={'25px'}
                                    width={{ base: '90%', sm: '70%', md: '50%', lg: '80%' }}
                                    src={pitForm.image}
                                />
                            )}
                        </Flex>
                        <Flex
                            width={{ base: '100%', lg: '60%' }}
                            flexDirection={'column'}
                            alignItems={'center'}
                            rowGap={'10px'}
                        >
                            {teamEventData && (
                                <Flex
                                    width={'90%'}
                                    flexWrap={'wrap'}
                                    justifyContent={'center'}
                                    borderLeft={'1px solid black'}
                                    borderTop={'1px solid black'}
                                    outline={'1px solid black'}
                                >
                                    <Flex
                                        flex={1}
                                        flexDirection={'column'}
                                        minWidth={'80px'}
                                        borderRight={'1px solid black'}
                                        borderBottom={'1px solid black'}
                                    >
                                        <Flex
                                            alignItems={'center'}
                                            justifyContent={'center'}
                                            fontSize={'lg'}
                                            fontWeight={'medium'}
                                            textAlign={'center'}
                                            borderBottom={'1px solid black'}
                                            height={'54px'}
                                            backgroundColor={'gray.200'}
                                        >
                                            Team #
                                        </Flex>
                                        <Text
                                            fontSize={'lg'}
                                            fontWeight={'medium'}
                                            textAlign={'center'}
                                            padding={'2px 0px'}
                                            backgroundColor={'red.200'}
                                        >
                                            {teamNumberParam}
                                        </Text>
                                    </Flex>
                                    <Flex
                                        flex={1}
                                        flexDirection={'column'}
                                        borderRight={'1px solid black'}
                                        minWidth={'220px'}
                                        borderBottom={'1px solid black'}
                                    >
                                        <Text
                                            fontSize={'lg'}
                                            fontWeight={'medium'}
                                            textAlign={'center'}
                                            height={'27px'}
                                            backgroundColor={'gray.200'}
                                        >
                                            Total
                                        </Text>
                                        <Flex
                                            borderBottom={'1px solid black'}
                                            height={'27px'}
                                            backgroundColor={'gray.200'}
                                        >
                                            <Text
                                                flex={1 / 4}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                Avg
                                            </Text>
                                            <Text
                                                flex={1 / 4}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                Max
                                            </Text>
                                            <Text
                                                flex={1 / 4}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                -
                                            </Text>
                                            <Text
                                                flex={1 / 4}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                -
                                            </Text>
                                        </Flex>
                                        <Flex padding={'2px 0px'} backgroundColor={'red.200'}>
                                            <Text
                                                flex={1 / 4}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {teamEventData.offensivePoints.avg}
                                            </Text>
                                            <Text
                                                flex={1 / 4}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {teamEventData.offensivePoints.max}
                                            </Text>
                                            <Text
                                                flex={1 / 4}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                -
                                            </Text>
                                            <Text
                                                flex={1 / 4}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                -
                                            </Text>
                                        </Flex>
                                    </Flex>
                                    <Flex
                                        flexDirection={'column'}
                                        flex={1}
                                        minWidth={'150px'}
                                        borderRight={'1px solid black'}
                                        borderBottom={'1px solid black'}
                                    >
                                        <Text
                                            fontSize={'lg'}
                                            fontWeight={'medium'}
                                            textAlign={'center'}
                                            height={'27px'}
                                            backgroundColor={'gray.200'}
                                        >
                                            Auto
                                        </Text>
                                        <Flex
                                            borderBottom={'1px solid black'}
                                            height={'27px'}
                                            backgroundColor={'gray.200'}
                                        >
                                            <Text
                                                flex={1 / 2}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                Avg
                                            </Text>
                                            <Text
                                                flex={1 / 2}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                Max
                                            </Text>
                                        </Flex>
                                        <Flex padding={'2px 0px'} backgroundColor={'red.200'}>
                                            <Text
                                                flex={1 / 2}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {teamEventData.autoPoints.avg}
                                            </Text>
                                            <Text
                                                flex={1 / 2}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {teamEventData.autoPoints.max}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                    <Flex
                                        flexDirection={'column'}
                                        flex={1}
                                        minWidth={'150px'}
                                        borderRight={'1px solid black'}
                                        borderBottom={'1px solid black'}
                                    >
                                        <Text
                                            fontSize={'lg'}
                                            fontWeight={'medium'}
                                            textAlign={'center'}
                                            height={'27px'}
                                            backgroundColor={'gray.200'}
                                        >
                                            Teleop
                                        </Text>
                                        <Flex
                                            borderBottom={'1px solid black'}
                                            height={'27px'}
                                            backgroundColor={'gray.200'}
                                        >
                                            <Text
                                                flex={1 / 2}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                Avg
                                            </Text>
                                            <Text
                                                flex={1 / 2}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                Max
                                            </Text>
                                        </Flex>
                                        <Flex padding={'2px 0px'} backgroundColor={'red.200'}>
                                            <Text
                                                flex={1 / 2}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {teamEventData.teleopPoints.avg}
                                            </Text>
                                            <Text
                                                flex={1 / 2}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {teamEventData.teleopPoints.max}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                    <Flex
                                        flexDirection={'column'}
                                        flex={1}
                                        minWidth={'190px'}
                                        borderRight={'1px solid black'}
                                        borderBottom={'1px solid black'}
                                    >
                                        <Text
                                            fontSize={'lg'}
                                            fontWeight={'medium'}
                                            textAlign={'center'}
                                            height={'27px'}
                                            backgroundColor={'gray.200'}
                                        >
                                            Stage
                                        </Text>
                                        <Flex
                                            borderBottom={'1px solid black'}
                                            height={'27px'}
                                            backgroundColor={'gray.200'}
                                        >
                                            <Text
                                                flex={1 / 3}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                Avg
                                            </Text>
                                            <Text
                                                flex={1 / 3}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                Max
                                            </Text>
                                            <Text
                                                flex={1 / 3}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                Hangs
                                            </Text>
                                        </Flex>
                                        <Flex padding={'2px 0px'} backgroundColor={'red.200'}>
                                            <Text
                                                flex={1 / 3}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {teamEventData.stagePoints.avg}
                                            </Text>
                                            <Text
                                                flex={1 / 3}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {teamEventData.stagePoints.max}
                                            </Text>
                                            <Text
                                                flex={1 / 3}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {teamEventData.climbSuccessFraction || 'N/A'}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                    <Flex
                                        flex={1}
                                        flexDirection={'column'}
                                        minWidth={'65px'}
                                        borderRight={'1px solid black'}
                                        borderBottom={'1px solid black'}
                                    >
                                        <Flex
                                            alignItems={'center'}
                                            justifyContent={'center'}
                                            fontSize={'lg'}
                                            fontWeight={'medium'}
                                            textAlign={'center'}
                                            borderBottom={'1px solid black'}
                                            height={'54px'}
                                            backgroundColor={'gray.200'}
                                        >
                                            Pts
                                        </Flex>
                                        <Text
                                            fontSize={'lg'}
                                            fontWeight={'medium'}
                                            textAlign={'center'}
                                            padding={'2px 0px'}
                                            backgroundColor={'red.200'}
                                        >
                                            -
                                        </Text>
                                    </Flex>
                                    <Flex
                                        flex={1}
                                        flexDirection={'column'}
                                        minWidth={'85px'}
                                        borderRight={'1px solid black'}
                                        borderBottom={'1px solid black'}
                                    >
                                        <Flex
                                            alignItems={'center'}
                                            justifyContent={'center'}
                                            fontSize={'lg'}
                                            fontWeight={'medium'}
                                            textAlign={'center'}
                                            borderBottom={'1px solid black'}
                                            height={'54px'}
                                            backgroundColor={'gray.200'}
                                        >
                                            Max Pts
                                        </Flex>
                                        <Text
                                            fontSize={'lg'}
                                            fontWeight={'medium'}
                                            textAlign={'center'}
                                            padding={'2px 0px'}
                                            backgroundColor={'red.200'}
                                        >
                                            -
                                        </Text>
                                    </Flex>
                                </Flex>
                            )}
                            {!teamEventData && (
                                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                    No match data
                                </Text>
                            )}
                            {pitForm && !pitForm.followUp && (
                                <Flex
                                    width={'90%'}
                                    flexWrap={'wrap'}
                                    rowGap={'10px'}
                                    columnGap={'40px'}
                                    justifyContent={'center'}
                                >
                                    <Flex flex={1 / 3} minWidth={'fit-content'} flexDirection={'column'} rowGap={'2px'}>
                                        <Text
                                            fontSize={'lg'}
                                            fontWeight={'semibold'}
                                            textAlign={'center'}
                                            textDecoration={'underline'}
                                        >
                                            Basic Attr.
                                        </Text>
                                        <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                            Weight: {pitForm.weight} lbs
                                        </Text>
                                        <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                            Height: {pitForm.height} inches
                                        </Text>
                                        <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                            Frame size: {pitForm.frameSize.width} in. by {pitForm.frameSize.length} in.
                                        </Text>
                                    </Flex>
                                    <Flex flex={1 / 3} minWidth={'fit-content'} flexDirection={'column'} rowGap={'2px'}>
                                        <Text
                                            fontSize={'lg'}
                                            fontWeight={'semibold'}
                                            textAlign={'center'}
                                            textDecoration={'underline'}
                                        >
                                            Drive Train
                                        </Text>
                                        <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                            Type: {pitForm.driveTrain}
                                        </Text>
                                        <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                            Motors:{' '}
                                            {pitForm.motors
                                                .map((motor) => `${motor.label} (${motor.value})`)
                                                .join(', ')}
                                        </Text>
                                    </Flex>
                                    <Flex flex={1 / 3} minWidth={'fit-content'} flexDirection={'column'} rowGap={'2px'}>
                                        <Text
                                            fontSize={'lg'}
                                            fontWeight={'semibold'}
                                            textAlign={'center'}
                                            textDecoration={'underline'}
                                        >
                                            Other
                                        </Text>
                                        <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                            Batteries: {pitForm.batteryCount}
                                        </Text>
                                        <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                            Charging: {pitForm.chargingBatteryCount}
                                        </Text>
                                    </Flex>
                                </Flex>
                            )}
                            {(!pitForm || pitForm.followUp) && (
                                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                    No pit data
                                </Text>
                            )}
                            {teamEventData && (
                                <Text
                                    fontSize={'xl'}
                                    fontWeight={'semibold'}
                                    textAlign={'center'}
                                    textDecoration={'underline'}
                                >
                                    Event Ranking
                                </Text>
                            )}
                            {teamEventData && (
                                // This has to be in its own space
                                <Flex
                                    width={{ base: '90vw', sm: '60vw', md: '40vw' }}
                                    height={{ base: '90vw', sm: '60vw', md: 'max(40dvh, 300px)' }}
                                    marginTop={{ base: '-20px', md: '0px' }}
                                    justifyContent={'center'}
                                    position={'relative'}
                                >
                                    <Radar
                                        data={{
                                            labels: [
                                                `Offense (${teamEventData.rank.offense})`,
                                                ['Speaker', `Tele (${teamEventData.rank.teleopSpeaker})`],
                                                `Stage (${teamEventData.rank.stage})`,
                                                `Defense (${
                                                    teamEventData.playedDefense === 0
                                                        ? 'N/A'
                                                        : teamEventData.rank.defense
                                                })`,
                                                `Auto (${teamEventData.rank.auto})`,
                                                ['Amp', `Tele (${teamEventData.rank.teleopAmp})`]
                                            ],
                                            datasets: [
                                                {
                                                    data: [
                                                        'offense',
                                                        'teleopSpeaker',
                                                        'stage',
                                                        'defense',
                                                        'auto',
                                                        'teleopAmp'
                                                    ].map((field) => {
                                                        if (field === 'defense' && teamEventData.playedDefense === 0) {
                                                            return teamEventData.rank.totalTeam;
                                                        }
                                                        return teamEventData.rank[field];
                                                    }),
                                                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                                    borderColor: 'red',
                                                    borderWidth: 1
                                                }
                                            ]
                                        }}
                                        options={{
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    display: false
                                                }
                                            },
                                            scales: {
                                                r: {
                                                    reverse: true,
                                                    min: 1,
                                                    max: teamEventData.rank.totalTeams || 10,
                                                    pointLabels: {
                                                        font: {
                                                            size: 14
                                                        }
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </Flex>
                            )}
                        </Flex>
                    </Flex>
                );
            case teamPageTabs.pit:
                return pitForm && !pitForm.followUp ? (
                    <Box margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
                        <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginBottom={'5px'}>
                            Weight: {pitForm.weight} lbs
                        </Text>
                        <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginBottom={'5px'}>
                            Starting Height: {pitForm.height} inches
                        </Text>
                        <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                            Frame Size: {pitForm.frameSize.width} in. by {pitForm.frameSize.length} in.
                        </Text>
                        <Divider borderStyle={'dashed'} borderColor={'black'} marginTop={'15px'} />
                        <Text
                            fontSize={'lg'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            marginBottom={'5px'}
                            marginTop={'10px'}
                        >
                            Drive
                        </Text>
                        <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'} marginBottom={'5px'}>
                            Type: {pitForm.driveTrain}
                        </Text>
                        <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'} marginBottom={'5px'}>
                            Motors: {pitForm.motors.map((motor) => `${motor.label} (${motor.value})`).join(', ')}
                        </Text>
                        <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'}>
                            Comment:{' '}
                            <span style={{ fontWeight: '600', fontSize: '95%' }}>{pitForm.driveTrainComment}</span>
                        </Text>
                        <Divider borderStyle={'dashed'} borderColor={'black'} marginTop={'15px'} />
                        <Text
                            fontSize={'lg'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            marginBottom={'5px'}
                            marginTop={'10px'}
                        >
                            Autonomous
                        </Text>
                        <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'} marginBottom={'5px'}>
                            Programming Language: {pitForm.programmingLanguage}
                        </Text>
                        <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'} marginBottom={'5px'}>
                            Prefered Starting Position
                        </Text>
                        <Center
                            margin={'0 auto'}
                            marginBottom={'10px'}
                            width={`${imageWidth * dimensionRatios.width}px`}
                            height={`${imageHeight * dimensionRatios.height}px`}
                            position={'relative'}
                        >
                            <Spinner position={'absolute'} visibility={!imageLoaded ? 'visible' : 'hidden'} />
                            <img
                                src={PreAutoBlueField}
                                alt={'Field Map'}
                                style={{ visibility: imageLoaded ? 'visible' : 'hidden' }}
                                onLoad={() => setImageLoaded(true)}
                            />
                            <Flex
                                position={'absolute'}
                                visibility={imageLoaded ? 'visible' : 'hidden'}
                                left={`${startingPositions[pitForm.startingPosition - 1][0] * dimensionRatios.width}px`}
                                top={`${startingPositions[pitForm.startingPosition - 1][1] * dimensionRatios.height}px`}
                                width={`${65 * dimensionRatios.width}px`}
                                height={`${65 * dimensionRatios.height}px`}
                                backgroundColor={'gray.500'}
                                textColor={'white'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                borderRadius={'5px'}
                            >
                                {pitForm.startingPosition}
                            </Flex>
                        </Center>
                        <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'}>
                            Comment: <span style={{ fontWeight: '600', fontSize: '95%' }}>{pitForm.autoComment}</span>
                        </Text>
                        <Divider borderStyle={'dashed'} borderColor={'black'} marginTop={'15px'} />
                        <Text
                            fontSize={'lg'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            marginBottom={'5px'}
                            marginTop={'10px'}
                        >
                            Abilities
                        </Text>
                        <Box>
                            {[...pitForm.autoAbilities, ...pitForm.teleAbilities].map((ability, index) =>
                                renderAbilities(ability, index)
                            )}
                        </Box>
                        <Divider borderStyle={'dashed'} borderColor={'black'} marginTop={'15px'} />
                        <Text
                            fontSize={'lg'}
                            fontWeight={'semibold'}
                            textAlign={'center'}
                            marginBottom={'5px'}
                            marginTop={'10px'}
                        >
                            Closing
                        </Text>
                        <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'} marginBottom={'5px'}>
                            Total Batteries: {pitForm.batteryCount}
                        </Text>
                        <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'} marginBottom={'5px'}>
                            Batteries Charging: {pitForm.chargingBatteryCount}
                        </Text>
                        <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'} marginBottom={'5px'}>
                            Working On:{' '}
                            <span style={{ fontWeight: '600', fontSize: '95%' }}>{pitForm.workingComment}</span>
                        </Text>
                        <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'}>
                            End Comment:{' '}
                            <span style={{ fontWeight: '600', fontSize: '95%' }}>{pitForm.closingComment}</span>
                        </Text>
                    </Box>
                ) : (
                    <Box fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'}>
                        No pit data
                    </Box>
                );
            case teamPageTabs.forms:
                return (
                    // Match #, Scouter (Both if possible), Starting Position, Pre-loaded, left zone, game piece auto, game piece tele, climb, super scout stats, issues, comment
                    <Box>
                        {oneCompleteMatchForms.length > 0 && (
                            <Box width={'100%'} overflowX={'auto'}>
                                <Grid
                                    templateColumns={'repeat(13, 1fr)'}
                                    borderLeft={'1px solid black'}
                                    borderTop={'1px solid black'}
                                    minWidth={'1900px'}
                                >
                                    {[
                                        'Match #',
                                        'Scouters',
                                        'Starting Position',
                                        'Pre-loaded',
                                        'Left Start',
                                        'Scoring (Auto)',
                                        'Intaking (Tele)',
                                        'Scoring (Tele)',
                                        'Stage',
                                        'Defense',
                                        'Attributes',
                                        'Issues',
                                        'Comments'
                                    ].map((label) => (
                                        <GridItem
                                            key={label}
                                            fontSize={'lg'}
                                            fontWeight={'medium'}
                                            textAlign={'center'}
                                            display={'flex'}
                                            justifyContent={'center'}
                                            alignItems={'center'}
                                            borderBottom={'1px solid black'}
                                            borderRight={'1px solid black'}
                                            backgroundColor={'gray.200'}
                                            padding={'10px 0px'}
                                            position={label === 'Match #' && 'sticky'}
                                            left={label === 'Match #' && 0}
                                            zIndex={label === 'Match #' && 1}
                                        >
                                            {label}
                                        </GridItem>
                                    ))}
                                    {sortMatches(oneCompleteMatchForms).map((matchForm) => (
                                        <React.Fragment key={matchForm.matchNumber}>
                                            <GridItem
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                                display={'flex'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                                borderBottom={'1px solid black'}
                                                borderRight={'1px solid black'}
                                                backgroundColor={
                                                    matchForm.station.charAt(0) === 'r' ? 'red.200' : 'blue.200'
                                                }
                                                minWidth={'180px'}
                                                minHeight={'100px'}
                                                position={'sticky'}
                                                left={0}
                                                zIndex={1}
                                            >
                                                {convertMatchKeyToString(matchForm.matchNumber)} :{' '}
                                                {convertStationKeyToString(matchForm.station)}
                                            </GridItem>
                                            <GridItem
                                                display={'flex'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                                flexDirection={'column'}
                                                borderBottom={'1px solid black'}
                                                borderRight={'1px solid black'}
                                                backgroundColor={
                                                    matchForm.station.charAt(0) === 'r' ? 'red.200' : 'blue.200'
                                                }
                                                minWidth={'160px'}
                                            >
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                    {`Stand: ${
                                                        matchForm.standStatus === matchFormStatus.missing
                                                            ? 'N/A'
                                                            : shortenScouterName(matchForm.standScouter)
                                                    }`}
                                                </Text>
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                    {`Super: ${
                                                        matchForm.superStatus === matchFormStatus.missing
                                                            ? 'N/A'
                                                            : shortenScouterName(matchForm.superScouter)
                                                    }`}
                                                </Text>
                                            </GridItem>
                                            {[
                                                matchFormStatus.followUp,
                                                matchFormStatus.missing,
                                                matchFormStatus.noShow
                                            ].includes(matchForm.standStatus) && (
                                                <GridItem
                                                    fontSize={'lg'}
                                                    fontWeight={'medium'}
                                                    textAlign={'center'}
                                                    display={'flex'}
                                                    justifyContent={'center'}
                                                    alignItems={'center'}
                                                    borderBottom={'1px solid black'}
                                                    borderRight={'1px solid black'}
                                                    colSpan={8}
                                                    backgroundColor={
                                                        matchForm.station.charAt(0) === 'r' ? 'red.200' : 'blue.200'
                                                    }
                                                >
                                                    {matchForm.standStatus === matchFormStatus.followUp
                                                        ? 'Marked for follow up'
                                                        : matchForm.standStatus === matchFormStatus.missing
                                                        ? 'Not yet completed'
                                                        : 'No show'}
                                                </GridItem>
                                            )}
                                            {matchForm.standStatus === matchFormStatus.complete && (
                                                <React.Fragment>
                                                    <GridItem
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        backgroundColor={
                                                            matchForm.station.charAt(0) === 'r' ? 'red.200' : 'blue.200'
                                                        }
                                                        minWidth={'150px'}
                                                    >
                                                        <Popover
                                                            flip={false}
                                                            placement={'bottom'}
                                                            onOpen={() => setImageLoaded(false)}
                                                            isLazy={true}
                                                        >
                                                            <PopoverTrigger>
                                                                <IconButton icon={<GrMap />} size='sm' />
                                                            </PopoverTrigger>
                                                            <PopoverContent
                                                                // Unnessary border that add 1px to all sides
                                                                border={'none'}
                                                                width={{
                                                                    base: '75vw',
                                                                    sm: '60vw',
                                                                    md: '35vw',
                                                                    lg: '20vw'
                                                                }}
                                                                position={'relative'}
                                                                padding={'25px'}
                                                            >
                                                                <PopoverArrow />
                                                                <PopoverCloseButton />
                                                                <Center
                                                                    margin={'0 auto'}
                                                                    width={`${imageWidth * dimensionRatios.width}px`}
                                                                    height={`${imageHeight * dimensionRatios.height}px`}
                                                                    position={'relative'}
                                                                >
                                                                    <Spinner
                                                                        position={'absolute'}
                                                                        visibility={!imageLoaded ? 'visible' : 'hidden'}
                                                                    />
                                                                    <img
                                                                        src={
                                                                            matchForm.station.charAt(0) === 'r'
                                                                                ? PreAutoRedField
                                                                                : PreAutoBlueField
                                                                        }
                                                                        style={{
                                                                            visibility: imageLoaded
                                                                                ? 'visible'
                                                                                : 'hidden'
                                                                        }}
                                                                        alt={'Field Map'}
                                                                        onLoad={() => setImageLoaded(true)}
                                                                    />
                                                                    <Flex
                                                                        position={'absolute'}
                                                                        visibility={imageLoaded ? 'visible' : 'hidden'}
                                                                        left={`${
                                                                            getPoint(
                                                                                startingPositions[
                                                                                    matchForm.startingPosition - 1
                                                                                ][0],
                                                                                matchForm.station
                                                                            ) * dimensionRatios.width
                                                                        }px`}
                                                                        top={`${
                                                                            startingPositions[
                                                                                matchForm.startingPosition - 1
                                                                            ][1] * dimensionRatios.height
                                                                        }px`}
                                                                        width={`${65 * dimensionRatios.width}px`}
                                                                        height={`${65 * dimensionRatios.height}px`}
                                                                        backgroundColor={'gray.500'}
                                                                        textColor={'white'}
                                                                        justifyContent={'center'}
                                                                        alignItems={'center'}
                                                                        borderRadius={'5px'}
                                                                    >
                                                                        {matchForm.startingPosition}
                                                                    </Flex>
                                                                </Center>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </GridItem>
                                                    <GridItem
                                                        fontSize={'lg'}
                                                        fontWeight={'medium'}
                                                        textAlign={'center'}
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        backgroundColor={
                                                            matchForm.station.charAt(0) === 'r' ? 'red.200' : 'blue.200'
                                                        }
                                                    >
                                                        {matchForm.preLoadedPiece}
                                                    </GridItem>
                                                    <GridItem
                                                        fontSize={'lg'}
                                                        fontWeight={'medium'}
                                                        textAlign={'center'}
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        backgroundColor={
                                                            matchForm.station.charAt(0) === 'r' ? 'red.200' : 'blue.200'
                                                        }
                                                    >
                                                        {matchForm.leftStart ? 'Yes' : 'No'}
                                                    </GridItem>
                                                    <GridItem
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        flexDirection={'column'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        backgroundColor={
                                                            matchForm.station.charAt(0) === 'r' ? 'red.200' : 'blue.200'
                                                        }
                                                        minWidth={'140px'}
                                                    >
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Amp: `}
                                                            <Text
                                                                fontSize={'lg'}
                                                                fontWeight={'medium'}
                                                                textColor={'green'}
                                                                as={'span'}
                                                            >
                                                                {matchForm.autoGP.ampScore}
                                                            </Text>
                                                            <Text
                                                                fontSize={'md'}
                                                                fontWeight={'medium'}
                                                                textColor={'red'}
                                                                as={'span'}
                                                            >
                                                                {' '}
                                                                ({matchForm.autoGP.ampMiss})
                                                            </Text>
                                                        </Text>
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Speaker: `}
                                                            <Text
                                                                fontSize={'lg'}
                                                                fontWeight={'medium'}
                                                                textColor={'green'}
                                                                as={'span'}
                                                            >
                                                                {matchForm.autoGP.speakerScore}
                                                            </Text>
                                                            <Text
                                                                fontSize={'md'}
                                                                fontWeight={'medium'}
                                                                textColor={'red'}
                                                                as={'span'}
                                                            >
                                                                {' '}
                                                                ({matchForm.autoGP.speakerMiss})
                                                            </Text>
                                                        </Text>
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Intake Miss: `}
                                                            <Text
                                                                fontSize={'lg'}
                                                                fontWeight={'medium'}
                                                                textColor={'red'}
                                                                as={'span'}
                                                            >
                                                                {matchForm.autoGP.intakeMiss}
                                                            </Text>
                                                        </Text>
                                                    </GridItem>
                                                    <GridItem
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        flexDirection={'column'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        backgroundColor={
                                                            matchForm.station.charAt(0) === 'r' ? 'red.200' : 'blue.200'
                                                        }
                                                        minWidth={'140px'}
                                                    >
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Source: ${matchForm.teleopGP.intakeSource}`}
                                                        </Text>
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Ground: ${matchForm.teleopGP.intakeGround}`}
                                                        </Text>
                                                    </GridItem>
                                                    <GridItem
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        flexDirection={'column'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        backgroundColor={
                                                            matchForm.station.charAt(0) === 'r' ? 'red.200' : 'blue.200'
                                                        }
                                                        minWidth={'140px'}
                                                    >
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Amp: `}
                                                            <Text
                                                                fontSize={'lg'}
                                                                fontWeight={'medium'}
                                                                textColor={'green'}
                                                                as={'span'}
                                                            >
                                                                {matchForm.teleopGP.ampScore}
                                                            </Text>
                                                            <Text
                                                                fontSize={'md'}
                                                                fontWeight={'medium'}
                                                                textColor={'red'}
                                                                as={'span'}
                                                            >
                                                                {' '}
                                                                ({matchForm.teleopGP.ampMiss})
                                                            </Text>
                                                        </Text>
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Speaker: `}
                                                            <Text
                                                                fontSize={'lg'}
                                                                fontWeight={'medium'}
                                                                textColor={'green'}
                                                                as={'span'}
                                                            >
                                                                {matchForm.teleopGP.speakerScore}
                                                            </Text>
                                                            <Text
                                                                fontSize={'md'}
                                                                fontWeight={'medium'}
                                                                textColor={'red'}
                                                                as={'span'}
                                                            >
                                                                {' '}
                                                                ({matchForm.teleopGP.speakerMiss})
                                                            </Text>
                                                        </Text>
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Ferry: ${matchForm.teleopGP.ferry}`}
                                                        </Text>
                                                    </GridItem>
                                                    <GridItem
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        flexDirection={'column'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        backgroundColor={
                                                            matchForm.station.charAt(0) === 'r' ? 'red.200' : 'blue.200'
                                                        }
                                                        minWidth={'150px'}
                                                    >
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Climb: ${matchForm.climb}`}
                                                        </Text>
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Trap: ${matchForm.teleopGP.trap}`}
                                                        </Text>
                                                    </GridItem>
                                                    <GridItem
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        flexDirection={'column'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        backgroundColor={
                                                            matchForm.station.charAt(0) === 'r' ? 'red.200' : 'blue.200'
                                                        }
                                                        minWidth={'170px'}
                                                    >
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Rating: ${matchForm.defenseRating || 'N/A'}`}
                                                        </Text>
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Allocation: ${
                                                                matchForm.defenseAllocation * 100 + '%' || 'N/A'
                                                            }`}
                                                        </Text>
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Was Defended: ${matchForm.wasDefended ? 'Yes' : 'No'}`}
                                                        </Text>
                                                    </GridItem>
                                                </React.Fragment>
                                            )}
                                            <GridItem
                                                display={'flex'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                                flexDirection={'column'}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                                borderBottom={'1px solid black'}
                                                borderRight={'1px solid black'}
                                                backgroundColor={
                                                    matchForm.station.charAt(0) === 'r' ? 'red.200' : 'blue.200'
                                                }
                                                minWidth={'135px'}
                                            >
                                                {matchForm.superStatus === matchFormStatus.followUp
                                                    ? 'Marked for follow up'
                                                    : matchForm.superStatus === matchFormStatus.missing
                                                    ? 'Not yet completed'
                                                    : matchForm.superStatus === matchFormStatus.noShow
                                                    ? 'No show'
                                                    : ''}
                                                {matchForm.superStatus === matchFormStatus.complete && (
                                                    <React.Fragment>
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Agility: ${matchForm.agility || 'N/A'}`}
                                                        </Text>
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Field Aware: ${matchForm.fieldAwareness || 'N/A'}`}
                                                        </Text>
                                                    </React.Fragment>
                                                )}
                                            </GridItem>
                                            {[
                                                matchFormStatus.followUp,
                                                matchFormStatus.missing,
                                                matchFormStatus.noShow
                                            ].includes(matchForm.standStatus) && (
                                                <GridItem
                                                    fontSize={'lg'}
                                                    fontWeight={'medium'}
                                                    textAlign={'center'}
                                                    display={'flex'}
                                                    justifyContent={'center'}
                                                    alignItems={'center'}
                                                    borderBottom={'1px solid black'}
                                                    borderRight={'1px solid black'}
                                                    colSpan={2}
                                                    backgroundColor={
                                                        matchForm.station.charAt(0) === 'r' ? 'red.200' : 'blue.200'
                                                    }
                                                >
                                                    {matchForm.standStatus === matchFormStatus.followUp
                                                        ? 'Marked for follow up'
                                                        : matchForm.standStatus === matchFormStatus.missing
                                                        ? 'Not yet completed'
                                                        : 'No show'}
                                                </GridItem>
                                            )}
                                            {matchForm.standStatus === matchFormStatus.complete && (
                                                <React.Fragment>
                                                    <GridItem
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        flexDirection={'column'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        backgroundColor={
                                                            matchForm.station.charAt(0) === 'r' ? 'red.200' : 'blue.200'
                                                        }
                                                        minWidth={'120px'}
                                                    >
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {[
                                                                matchForm.lostCommunication ? 'Lost comms' : false,
                                                                matchForm.robotBroke ? 'Broke' : false,
                                                                matchForm.yellowCard ? 'Yellow card' : false,
                                                                matchForm.redCard ? 'Red card' : false
                                                            ]
                                                                .filter((elem) => elem)
                                                                .join(', ') || 'No issues'}
                                                        </Text>
                                                    </GridItem>
                                                    <GridItem
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        backgroundColor={
                                                            matchForm.station.charAt(0) === 'r' ? 'red.200' : 'blue.200'
                                                        }
                                                        minWidth={'120px'}
                                                        padding={'0px 10px'}
                                                        onClick={() => {
                                                            if (commentsToggled.includes(matchForm.matchNumber)) {
                                                                setCommentsToggled(
                                                                    commentsToggled.filter(
                                                                        (matchNumber) =>
                                                                            matchNumber !== matchForm.matchNumber
                                                                    )
                                                                );
                                                            } else {
                                                                setCommentsToggled([
                                                                    ...commentsToggled,
                                                                    matchForm.matchNumber
                                                                ]);
                                                            }
                                                        }}
                                                        cursor={'pointer'}
                                                        _hover={{
                                                            backgroundColor:
                                                                matchForm.station.charAt(0) === 'r'
                                                                    ? 'red.300'
                                                                    : 'blue.300'
                                                        }}
                                                    >
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                            style={{
                                                                WebkitLineClamp: commentsToggled.includes(
                                                                    matchForm.matchNumber
                                                                )
                                                                    ? 'unset'
                                                                    : '3',
                                                                display: '-webkit-box',
                                                                WebkitBoxOrient: 'vertical'
                                                            }}
                                                            overflow={'hidden'}
                                                            textOverflow={'ellipsis'}
                                                        >
                                                            {matchForm.standComment || 'No comment'}
                                                        </Text>
                                                    </GridItem>
                                                </React.Fragment>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </Grid>
                            </Box>
                        )}
                        {oneCompleteMatchForms.length === 0 && (
                            <Box fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'}>
                                No match data
                            </Box>
                        )}
                    </Box>
                );
            case teamPageTabs.analysis:
                return (
                    <Box>
                        <MatchLineGraphs
                            teamNumbers={[teamNumberParam]}
                            multiTeamMatchForms={{
                                [teamNumberParam]: oneCompleteMatchForms
                            }}
                        />
                    </Box>
                );
            case teamPageTabs.other:
                return (
                    <Box>
                        {/* <Center marginBottom={'25px'}>
                            <HeatMap
                                data={filteredStandForms}
                                largeScale={0.5}
                                mediumScale={0.7}
                                smallScale={1.0}
                                maxOccurances={3}
                            ></HeatMap>
                        </Center>
                        <Box
                            textAlign={'center'}
                            fontSize={'25px'}
                            fontWeight={'medium'}
                            margin={'0 auto'}
                            width={{ base: '85%', md: '66%', lg: '50%' }}
                        >
                            Comments and Concerns
                        </Box>
                        {joinStandAndSuperForms([...standForms], [...superForms]).map((match) => (
                            <div key={match._id} style={{ marginTop: '10px' }} className='grid'>
                                <div className='grid-column'>
                                    <div className='grid-item header'>
                                        {convertMatchKeyToString(match.matchNumber)} :{' '}
                                        {convertStationKeyToString(match.station)}
                                    </div>
                                </div>
                                <div className='grid-column'>
                                    <div className='grid-item header'>Problems</div>
                                    <div className='grid-item header'>Stand Comment</div>
                                    <div className='grid-item header'>Super Comment</div>
                                </div>
                                <div className='grid-column'>
                                    <div className='grid-item'>
                                        {match.standStatus === matchFormStatus.noShow ? (
                                            <div style={{ wordBreak: 'break-word' }}>No Show</div>
                                        ) : !match.lostCommunication &&
                                          !match.robotBroke &&
                                          !match.yellowCard & !match.redCard ? (
                                            <div style={{ wordBreak: 'break-word' }}>None</div>
                                        ) : (
                                            <Box>
                                                {match.lostCommunication ? (
                                                    <div style={{ wordBreak: 'break-word' }}>Lost Communication</div>
                                                ) : null}
                                                {match.robotBroke ? <div>Robot broke</div> : null}
                                                {match.yellowCard ? <div>Yellow Card Given</div> : null}
                                                {match.redCard ? <div>Red Card Given</div> : null}
                                            </Box>
                                        )}
                                    </div>
                                    <Box className='grid-item'>
                                        <Text
                                            flexBasis={
                                                match.standEndComment || match.standStatusComment
                                                    ? '120px'
                                                    : { base: '96px', md: '50px', lg: '50px' }
                                            }
                                            flexGrow={1}
                                            flexShrink={1}
                                            overflowY={'auto'}
                                            wordBreak={'break-word'}
                                        >
                                            Stand Comment: {match.standEndComment || match.standStatusComment || 'None'}
                                        </Text>
                                    </Box>
                                    <Box className='grid-item'>
                                        <Text
                                            flexBasis={
                                                match.superEndComment || match.superStatusComment
                                                    ? '120px'
                                                    : { base: '96px', md: '50px', lg: '50px' }
                                            }
                                            flexGrow={1}
                                            flexShrink={1}
                                            overflowY={'auto'}
                                            wordBreak={'break-word'}
                                        >
                                            Super Comment: {match.superEndComment || match.superStatusComment || 'None'}
                                        </Text>
                                    </Box>
                                </div>
                            </div>
                        ))} */}
                    </Box>
                );
            default:
                return null;
        }
    }

    if (
        pitForm === undefined ||
        matchForms === undefined ||
        oneCompleteMatchForms === null ||
        teamEventData === undefined ||
        ([teamPageTabs.pit, teamPageTabs.forms].includes(tab) && dimensionRatios === null)
    ) {
        // For some reason these needs a zIndex value other wise a black line
        // shows up under the tabs bar but only on chrome and mobile inspector display
        return (
            <Center>
                <Spinner zIndex={-1}></Spinner>
            </Center>
        );
    }

    return renderTab(tab);
}

export default TeamPageTabs;

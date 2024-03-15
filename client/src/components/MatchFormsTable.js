import React, { useContext, useState } from 'react';
import {
    Box,
    Button,
    Center,
    Flex,
    Grid,
    GridItem,
    IconButton,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverTrigger,
    Spinner,
    Text
} from '@chakra-ui/react';
import {
    convertMatchKeyToString,
    convertStationKeyToString,
    roundToWhole,
    shortenScouterName,
    sortMatches
} from '../util/helperFunctions';
import { AuthContext } from '../context/auth';
import { matchFormStatus } from '../util/helperConstants';
import { Link } from 'react-router-dom';
import { GrMap } from 'react-icons/gr';
import { v4 as uuidv4 } from 'uuid';
import PreAutoBlueField from '../images/PreAutoBlueField.png';
import PreAutoRedField from '../images/PreAutoRedField.png';

let startingPositions = [
    [28, 35, uuidv4()],
    [60, 118, uuidv4()],
    [28, 200, uuidv4()],
    [28, 300, uuidv4()]
];
let imageWidth = 435;
let imageHeight = 435;
function MatchFormsTable({ oneValidMatchForms, dimensionRatios, practiceForms = false }) {
    const { user } = useContext(AuthContext);

    const [imageLoaded, setImageLoaded] = useState(false);
    const [commentsToggled, setCommentsToggled] = useState([]);

    function getPoint(pointX, station) {
        let mirror = 185;
        if (station.charAt(0) === 'r') {
            // Calculate mirrored x-coordinate
            return 2 * mirror - pointX;
        } else {
            return pointX;
        }
    }

    return (
        <Box>
            {oneValidMatchForms.length > 0 && (
                <Box>
                    {practiceForms && (
                        <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'} marginBottom={'10px'}>
                            Practice Forms
                        </Text>
                    )}
                    <Box width={'100%'} overflowX={'auto'}>
                        <Grid
                            templateColumns={'0.75fr 1fr 1fr 0.75fr 0.75fr repeat(8, 1fr)'}
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
                                'Super Form',
                                'Issues',
                                'Comment'
                            ].map((label) => (
                                <GridItem
                                    key={label}
                                    fontSize={'lg'}
                                    fontWeight={'semibold'}
                                    textAlign={'center'}
                                    display={'flex'}
                                    justifyContent={'center'}
                                    alignItems={'center'}
                                    borderBottom={'1px solid black'}
                                    borderRight={'1px solid black'}
                                    backgroundColor={'gray.300'}
                                    padding={'10px 0px'}
                                    position={label === 'Match #' && 'sticky'}
                                    left={label === 'Match #' && 0}
                                    zIndex={label === 'Match #' && 1}
                                    borderLeft={label === 'Match #' && '1px solid black'}
                                >
                                    {label}
                                </GridItem>
                            ))}
                            {sortMatches(oneValidMatchForms).map((matchForm) => (
                                <React.Fragment key={matchForm.matchNumber}>
                                    {user.admin ? (
                                        <Popover isLazy={true}>
                                            <PopoverTrigger>
                                                <GridItem
                                                    borderBottom={'1px solid black'}
                                                    borderRight={'1px solid black'}
                                                    backgroundColor={'gray.100'}
                                                    minHeight={'120px'}
                                                    position={'sticky'}
                                                    left={0}
                                                    zIndex={1}
                                                    borderLeft={'1px solid black'}
                                                >
                                                    <Button
                                                        fontSize={'lg'}
                                                        fontWeight={'medium'}
                                                        textAlign={'center'}
                                                        whiteSpace={'pre-line'}
                                                        height={'100%'}
                                                        width={'100%'}
                                                        backgroundColor={'transparent'}
                                                        borderRadius={'0px'}
                                                        lineHeight={'unset'}
                                                        _hover={{ backgroundColor: 'gray.200' }}
                                                        _active={{
                                                            backgroundColor: 'gray.300'
                                                        }}
                                                    >
                                                        {convertMatchKeyToString(matchForm.matchNumber, true)}
                                                        {'\n'}
                                                        {convertStationKeyToString(matchForm.station)}
                                                    </Button>
                                                </GridItem>
                                            </PopoverTrigger>
                                            <PopoverContent width={'fit-content'}>
                                                <PopoverArrow />
                                                <PopoverCloseButton />
                                                <PopoverBody display={'flex'} flexDirection={'column'} rowGap={'10px'}>
                                                    <Button
                                                        as={matchForm.standStatus !== matchFormStatus.missing && Link}
                                                        to={
                                                            matchForm.standStatus !== matchFormStatus.missing
                                                                ? `/standForm/${matchForm.eventKey}/${matchForm.matchNumber}/${matchForm.station}/${matchForm.teamNumber}`
                                                                : null
                                                        }
                                                        state={{ previousRoute: 'team' }}
                                                        isDisabled={matchForm.standStatus === matchFormStatus.missing}
                                                    >
                                                        {matchForm.standStatus !== matchFormStatus.missing
                                                            ? 'Stand Form'
                                                            : 'No Stand Form'}
                                                    </Button>
                                                    <Button
                                                        as={matchForm.superStatus !== matchFormStatus.missing && Link}
                                                        to={
                                                            matchForm.superStatus !== matchFormStatus.missing
                                                                ? `/superForm/${matchForm.eventKey}/${
                                                                      matchForm.matchNumber
                                                                  }/${matchForm.station.charAt(0)}/${
                                                                      matchForm.allianceNumbers[0]
                                                                  }/${matchForm.allianceNumbers[1]}/${
                                                                      matchForm.allianceNumbers[2]
                                                                  }`
                                                                : null
                                                        }
                                                        state={{
                                                            previousRoute: 'team',
                                                            teamNumber: matchForm.teamNumber
                                                        }}
                                                        isDisabled={matchForm.superStatus === matchFormStatus.missing}
                                                    >
                                                        {matchForm.superStatus !== matchFormStatus.missing
                                                            ? 'Super Form'
                                                            : 'No Super Form'}
                                                    </Button>
                                                </PopoverBody>
                                            </PopoverContent>
                                        </Popover>
                                    ) : (
                                        <GridItem
                                            fontSize={'lg'}
                                            fontWeight={'medium'}
                                            textAlign={'center'}
                                            display={'flex'}
                                            justifyContent={'center'}
                                            alignItems={'center'}
                                            borderBottom={'1px solid black'}
                                            borderRight={'1px solid black'}
                                            backgroundColor={'gray.100'}
                                            minHeight={'120px'}
                                            position={'sticky'}
                                            left={0}
                                            zIndex={1}
                                            whiteSpace={'pre-line'}
                                            borderLeft={'1px solid black'}
                                        >
                                            {convertMatchKeyToString(matchForm.matchNumber, true)}
                                            {'\n'}
                                            {convertStationKeyToString(matchForm.station)}
                                        </GridItem>
                                    )}
                                    <GridItem
                                        display={'flex'}
                                        justifyContent={'center'}
                                        alignItems={'center'}
                                        flexDirection={'column'}
                                        borderBottom={'1px solid black'}
                                        borderRight={'1px solid black'}
                                        backgroundColor={'gray.100'}
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
                                            backgroundColor={'gray.100'}
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
                                                backgroundColor={'gray.100'}
                                                minWidth={'150px'}
                                            >
                                                <Popover
                                                    flip={false}
                                                    placement={'bottom'}
                                                    onOpen={() => setImageLoaded(false)}
                                                    isLazy={true}
                                                >
                                                    <PopoverTrigger>
                                                        <IconButton
                                                            icon={<GrMap />}
                                                            size='sm'
                                                            color={'black'}
                                                            backgroundColor={'gray.200'}
                                                            _hover={{ backgroundColor: 'gray.300' }}
                                                            _active={{ backgroundColor: 'gray.400' }}
                                                        />
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
                                                                    visibility: imageLoaded ? 'visible' : 'hidden'
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
                                                backgroundColor={'gray.100'}
                                            >
                                                {matchForm.preloadedPiece}
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
                                                backgroundColor={'gray.100'}
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
                                                backgroundColor={'gray.100'}
                                                minWidth={'180px'}
                                            >
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
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
                                                        textColor={'crimson'}
                                                        as={'span'}
                                                    >
                                                        {' '}
                                                        ({matchForm.autoGP.ampMiss})
                                                    </Text>
                                                    {matchForm.autoGP.ampScore + matchForm.autoGP.ampMiss > 0 && (
                                                        <Text fontSize={'md'} fontWeight={'medium'} as={'span'}>
                                                            {` ${roundToWhole(
                                                                (matchForm.autoGP.ampScore /
                                                                    (matchForm.autoGP.ampScore +
                                                                        matchForm.autoGP.ampMiss)) *
                                                                    100
                                                            )}%`}
                                                        </Text>
                                                    )}
                                                </Text>
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
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
                                                        textColor={'crimson'}
                                                        as={'span'}
                                                    >
                                                        {' '}
                                                        ({matchForm.autoGP.speakerMiss})
                                                    </Text>
                                                    {matchForm.autoGP.speakerScore + matchForm.autoGP.speakerMiss >
                                                        0 && (
                                                        <Text fontSize={'md'} fontWeight={'medium'} as={'span'}>
                                                            {` ${roundToWhole(
                                                                (matchForm.autoGP.speakerScore /
                                                                    (matchForm.autoGP.speakerScore +
                                                                        matchForm.autoGP.speakerMiss)) *
                                                                    100
                                                            )}%`}
                                                        </Text>
                                                    )}
                                                </Text>
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                    {`Intake Miss: `}
                                                    <Text
                                                        fontSize={'lg'}
                                                        fontWeight={'medium'}
                                                        textColor={'crimson'}
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
                                                backgroundColor={'gray.100'}
                                                minWidth={'140px'}
                                            >
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                    {`Source: ${matchForm.teleopGP.intakeSource}`}
                                                </Text>
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
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
                                                backgroundColor={'gray.100'}
                                                minWidth={'180px'}
                                            >
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
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
                                                        textColor={'crimson'}
                                                        as={'span'}
                                                    >
                                                        {' '}
                                                        ({matchForm.teleopGP.ampMiss})
                                                    </Text>
                                                    {matchForm.teleopGP.ampScore + matchForm.teleopGP.ampMiss > 0 && (
                                                        <Text fontSize={'md'} fontWeight={'medium'} as={'span'}>
                                                            {` ${roundToWhole(
                                                                (matchForm.teleopGP.ampScore /
                                                                    (matchForm.teleopGP.ampScore +
                                                                        matchForm.teleopGP.ampMiss)) *
                                                                    100
                                                            )}%`}
                                                        </Text>
                                                    )}
                                                </Text>
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
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
                                                        textColor={'crimson'}
                                                        as={'span'}
                                                    >
                                                        {' '}
                                                        ({matchForm.teleopGP.speakerMiss})
                                                    </Text>
                                                    {matchForm.teleopGP.speakerScore + matchForm.teleopGP.speakerMiss >
                                                        0 && (
                                                        <Text fontSize={'md'} fontWeight={'medium'} as={'span'}>
                                                            {` ${roundToWhole(
                                                                (matchForm.teleopGP.speakerScore /
                                                                    (matchForm.teleopGP.speakerScore +
                                                                        matchForm.teleopGP.speakerMiss)) *
                                                                    100
                                                            )}%`}
                                                        </Text>
                                                    )}
                                                </Text>
                                                <Flex columnGap={'10px'}>
                                                    <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'}>
                                                        {`Sub: `}
                                                        <Text
                                                            fontSize={'sm'}
                                                            fontWeight={'medium'}
                                                            textColor={'green'}
                                                            as={'span'}
                                                        >
                                                            {matchForm.teleopGP.subwooferScore}
                                                        </Text>
                                                        <Text
                                                            fontSize={'sm'}
                                                            fontWeight={'medium'}
                                                            textColor={'crimson'}
                                                            as={'span'}
                                                        >
                                                            {' '}
                                                            ({matchForm.teleopGP.subwooferMiss})
                                                        </Text>
                                                    </Text>
                                                    <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'}>
                                                        {`Other: `}
                                                        <Text
                                                            fontSize={'sm'}
                                                            fontWeight={'medium'}
                                                            textColor={'green'}
                                                            as={'span'}
                                                        >
                                                            {matchForm.teleopGP.otherScore}
                                                        </Text>
                                                        <Text
                                                            fontSize={'sm'}
                                                            fontWeight={'medium'}
                                                            textColor={'crimson'}
                                                            as={'span'}
                                                        >
                                                            {' '}
                                                            ({matchForm.teleopGP.otherMiss})
                                                        </Text>
                                                    </Text>
                                                </Flex>
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
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
                                                backgroundColor={'gray.100'}
                                                minWidth={'175px'}
                                            >
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                    {`Climb: ${matchForm.climb.attempt}${
                                                        matchForm.climb.attempt === 'Success'
                                                            ? ` (+${matchForm.climb.harmony})`
                                                            : ''
                                                    }`}
                                                </Text>
                                                {matchForm.climb.attempt !== 'Success' && (
                                                    <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                        {`Park: ${matchForm.climb.park ? 'Yes' : 'No'}`}
                                                    </Text>
                                                )}
                                                {matchForm.climb.attempt === 'Success' && (
                                                    <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                        {`Location: ${matchForm.climb.location}`}
                                                    </Text>
                                                )}
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
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
                                                backgroundColor={'gray.100'}
                                                minWidth={'170px'}
                                            >
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                    {`Rating: ${matchForm.defenseRating || 'N/A'}`}
                                                </Text>
                                                {matchForm.defenseRating > 0 && (
                                                    <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                        {`Allocation: ${
                                                            matchForm.defenseAllocation * 100 + '%' || 'N/A'
                                                        }`}
                                                    </Text>
                                                )}
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
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
                                        backgroundColor={'gray.100'}
                                        minWidth={'135px'}
                                        // Just to make 'Not yet completed' look nicer
                                        padding={matchForm.superStatus === matchFormStatus.missing ? '0px 5px' : '0px'}
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
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                    {`Agility: ${matchForm.agility || 'N/A'}`}
                                                </Text>
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                    {`Field Aware: ${matchForm.fieldAwareness || 'N/A'}`}
                                                </Text>
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                    {`High Note: `}
                                                    {matchForm.ampPlayer ? (
                                                        <React.Fragment>
                                                            <Text
                                                                fontSize={'lg'}
                                                                fontWeight={'medium'}
                                                                textColor={'green'}
                                                                as={'span'}
                                                            >
                                                                {matchForm.ampPlayerGP.highNoteScore}
                                                            </Text>
                                                            <Text
                                                                fontSize={'md'}
                                                                fontWeight={'medium'}
                                                                textColor={'crimson'}
                                                                as={'span'}
                                                            >
                                                                {' '}
                                                                ({matchForm.ampPlayerGP.highNoteMiss})
                                                            </Text>
                                                        </React.Fragment>
                                                    ) : (
                                                        'N/A'
                                                    )}
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
                                            colSpan={matchForm.standStatus === matchFormStatus.noShow ? 1 : 2}
                                            backgroundColor={'gray.100'}
                                        >
                                            {matchForm.standStatus === matchFormStatus.followUp
                                                ? 'Marked for follow up'
                                                : matchForm.standStatus === matchFormStatus.missing
                                                ? 'Not yet completed'
                                                : 'No show'}
                                        </GridItem>
                                    )}
                                    {[matchFormStatus.complete, matchFormStatus.noShow].includes(
                                        matchForm.standStatus
                                    ) && (
                                        <React.Fragment>
                                            {matchForm.standStatus === matchFormStatus.complete && (
                                                <GridItem
                                                    display={'flex'}
                                                    justifyContent={'center'}
                                                    alignItems={'center'}
                                                    flexDirection={'column'}
                                                    borderBottom={'1px solid black'}
                                                    borderRight={'1px solid black'}
                                                    backgroundColor={'gray.100'}
                                                    minWidth={'120px'}
                                                >
                                                    <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
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
                                            )}
                                            <GridItem
                                                display={'flex'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                                borderBottom={'1px solid black'}
                                                borderRight={'1px solid black'}
                                                backgroundColor={'gray.100'}
                                                minWidth={'120px'}
                                                padding={
                                                    commentsToggled.includes(matchForm.matchNumber)
                                                        ? '10px 10px'
                                                        : '0px 10px'
                                                }
                                                onClick={() => {
                                                    if (commentsToggled.includes(matchForm.matchNumber)) {
                                                        setCommentsToggled(
                                                            commentsToggled.filter(
                                                                (matchNumber) => matchNumber !== matchForm.matchNumber
                                                            )
                                                        );
                                                    } else {
                                                        setCommentsToggled([...commentsToggled, matchForm.matchNumber]);
                                                    }
                                                }}
                                                cursor={'pointer'}
                                                _hover={{
                                                    backgroundColor: 'gray.200'
                                                }}
                                                _active={{
                                                    backgroundColor: 'gray.300'
                                                }}
                                            >
                                                <Text
                                                    fontSize={'lg'}
                                                    fontWeight={'medium'}
                                                    textAlign={'center'}
                                                    style={{
                                                        WebkitLineClamp: commentsToggled.includes(matchForm.matchNumber)
                                                            ? 'unset'
                                                            : '3',
                                                        display: '-webkit-box',
                                                        WebkitBoxOrient: 'vertical'
                                                    }}
                                                    overflow={'hidden'}
                                                    textOverflow={'ellipsis'}
                                                >
                                                    {matchForm.standStatus === matchFormStatus.noShow
                                                        ? matchForm.standStatusComment
                                                        : matchForm.standComment || 'No comment'}
                                                </Text>
                                            </GridItem>
                                        </React.Fragment>
                                    )}
                                </React.Fragment>
                            ))}
                        </Grid>
                    </Box>
                </Box>
            )}
            {oneValidMatchForms.length === 0 && (
                <Box fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'}>
                    {`No ${practiceForms ? 'practice' : 'match'} data`}
                </Box>
            )}
        </Box>
    );
}

export default MatchFormsTable;

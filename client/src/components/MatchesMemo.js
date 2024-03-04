import { CheckCircleIcon, QuestionIcon, WarningIcon } from '@chakra-ui/icons';
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
    PopoverFooter,
    PopoverHeader,
    PopoverTrigger,
    Text
} from '@chakra-ui/react';
import React from 'react';
import { MdOutlineDoNotDisturbAlt } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { matchFormStatus } from '../util/helperConstants';
import { capitalizeFirstLetter, convertMatchKeyToString, convertStationKeyToString } from '../util/helperFunctions';

function MatchesMemo({ noMatches, matches, currentEvent, filter, hasSecondaryFilter, accuarcyData }) {
    function getIcon(match) {
        return match.accuarcyData ? (
            <Popover flip={true} placement='bottom'>
                <PopoverTrigger>
                    <IconButton icon={<WarningIcon />} colorScheme={'orange'} size='sm' />
                </PopoverTrigger>
                <PopoverContent maxWidth={'200px'}>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverHeader
                        margin={'0 auto'}
                        maxWidth={'75%'}
                        fontSize={'md'}
                        fontWeight={'semibold'}
                        textAlign={'center'}
                    >
                        Scouting Error
                    </PopoverHeader>
                    <PopoverBody maxHeight={'100px'} overflowY={'auto'}>
                        <Box>
                            {Object.keys(match.accuarcyData).map((key, index) => (
                                <Box key={key} marginTop={index > 0 && '10px'}>
                                    <Text>
                                        {capitalizeFirstLetter(key)
                                            .match(/[A-Z][a-z]+|[0-9]+/g)
                                            .join(' ')}
                                    </Text>
                                    <Box>
                                        <Text fontSize={'sm'}>
                                            Scouted: {match.accuarcyData[key].scouted} ({match.accuarcyData[key].true})
                                        </Text>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </PopoverBody>
                    <PopoverFooter>
                        <Button
                            size='sm'
                            as={Link}
                            to={match.link}
                            state={{ previousRoute: 'matches', scoutingError: true }}
                        >
                            Go To
                        </Button>
                    </PopoverFooter>
                </PopoverContent>
            </Popover>
        ) : match.status === matchFormStatus.missing ? (
            <IconButton
                icon={<QuestionIcon />}
                colorScheme={'purple'}
                size='sm'
                as={Link}
                to={match.link}
                state={{ previousRoute: 'matches' }}
            />
        ) : ![matchFormStatus.followUp, matchFormStatus.noShow].includes(match.status) ? (
            <IconButton
                icon={<CheckCircleIcon />}
                colorScheme={'green'}
                size='sm'
                as={Link}
                to={match.link}
                state={{ previousRoute: 'matches' }}
            />
        ) : match.status === matchFormStatus.noShow ? (
            <IconButton
                icon={<MdOutlineDoNotDisturbAlt />}
                colorScheme={'red'}
                size='sm'
                as={Link}
                to={match.link}
                state={{ previousRoute: 'matches' }}
            />
        ) : (
            <Popover flip={true} placement='bottom'>
                <PopoverTrigger>
                    <IconButton icon={<WarningIcon />} colorScheme={'yellow'} size='sm' />
                </PopoverTrigger>
                <PopoverContent maxWidth={'200px'}>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverHeader
                        margin={'0 auto'}
                        maxWidth={'75%'}
                        fontSize={'md'}
                        fontWeight={'semibold'}
                        textAlign={'center'}
                    >
                        Follow Up Comment
                    </PopoverHeader>
                    <PopoverBody maxHeight={'100px'} overflowY={'auto'}>
                        <Text>{match.comment}</Text>
                    </PopoverBody>
                    <PopoverFooter>
                        <Button size='sm' as={Link} to={match.link} state={{ previousRoute: 'matches' }}>
                            Go To
                        </Button>
                    </PopoverFooter>
                </PopoverContent>
            </Popover>
        );
    }

    function getMatchAccuarcy(match, accuarcyData) {
        let matchData = accuarcyData.find((accuarcy) => accuarcy.matchKey === match.matchNumber);
        if (matchData) {
            let stationData;
            if (match.station.charAt(0) === 'r') {
                stationData = matchData.red?.errors[match.teamNumber];
            } else {
                stationData = matchData.blue?.errors[match.teamNumber];
            }
            if (stationData) {
                stationData = Object.keys(stationData).length === 0 ? null : stationData;
            }
            return stationData;
        } else {
            return null;
        }
    }

    return (
        <Box borderRadius={'0px 0px 10px 10px'} border={'1px solid black'} borderTop={'none'} overflow={'hidden'}>
            {(noMatches && filter.key !== 'missing') || matches.length === 0 ? (
                <Center padding={'10px 0px'} borderTop={'1px solid black'}>
                    <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'} width={'90%'}>
                        {noMatches
                            ? 'No matches have been scouted yet'
                            : hasSecondaryFilter
                            ? 'No matches match the filters'
                            : filter.emptyMsg}
                    </Text>
                </Center>
            ) : (
                <Grid borderTop={'1px solid black'} templateColumns={'2fr 1fr 1fr 1fr'}>
                    {matches.map((match, index) => (
                        <React.Fragment key={match._id}>
                            <GridItem
                                fontSize={'md'}
                                fontWeight={'medium'}
                                textAlign={'center'}
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                backgroundColor={index % 2 === 0 ? 'gray.100' : 'white'}
                                borderBottom={index < matches.length - 1 && '1px solid black'}
                            >
                                {convertMatchKeyToString(match.matchNumber)} :{' '}
                                {convertStationKeyToString(match.station)}
                            </GridItem>
                            <GridItem
                                fontSize={'md'}
                                fontWeight={'medium'}
                                textAlign={'center'}
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                backgroundColor={index % 2 === 0 ? 'gray.100' : 'white'}
                                borderBottom={index < matches.length - 1 && '1px solid black'}
                            >
                                {match.teamNumber}
                            </GridItem>
                            <GridItem
                                fontSize={'md'}
                                fontWeight={'medium'}
                                textAlign={'center'}
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                backgroundColor={index % 2 === 0 ? 'gray.100' : 'white'}
                                borderBottom={index < matches.length - 1 && '1px solid black'}
                                padding={'10px 0px'}
                            >
                                <Flex flexDirection={'column'} rowGap={'10px'}>
                                    <Center minHeight={'32px'}>
                                        {[undefined, matchFormStatus.missing].includes(match.standStatus)
                                            ? 'N/A'
                                            : `${match.standScouter.split(' ')[0]}`}
                                    </Center>
                                    <Center minHeight={'32px'}>
                                        {[undefined, matchFormStatus.missing].includes(match.superStatus)
                                            ? 'N/A'
                                            : `${match.superScouter.split(' ')[0]}`}
                                    </Center>
                                </Flex>
                            </GridItem>
                            <GridItem
                                fontSize={'md'}
                                fontWeight={'medium'}
                                textAlign={'center'}
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                backgroundColor={index % 2 === 0 ? 'gray.100' : 'white'}
                                borderBottom={index < matches.length - 1 && '1px solid black'}
                                padding={'10px 0px'}
                            >
                                <Flex flexDirection={'column'} rowGap={'10px'}>
                                    <Box>
                                        {getIcon({
                                            accuarcyData: getMatchAccuarcy(match, accuarcyData),
                                            status: match.standStatus || matchFormStatus.missing,
                                            comment: match.standStatusComment,
                                            link: `/standForm/${currentEvent.key}/${match.matchNumber}/${match.station}/${match.teamNumber}`
                                        })}
                                    </Box>
                                    {getIcon({
                                        status: match.superStatus || matchFormStatus.missing,
                                        comment: match.superStatusComment,
                                        link: `/superForm/${currentEvent.key}/${match.matchNumber}/${match.station[0]}/${match.allianceNumbers[0]}/${match.allianceNumbers[1]}/${match.allianceNumbers[2]}`
                                    })}
                                </Flex>
                            </GridItem>
                        </React.Fragment>
                    ))}
                </Grid>
            )}
        </Box>
    );
}

function areEqual(prevProps, nextProps) {
    return prevProps.version === nextProps.version;
}

export default React.memo(MatchesMemo, areEqual);
